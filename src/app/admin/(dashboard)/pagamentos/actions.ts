"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { PaymentModel } from "@/lib/models/payment";
import { UserModel } from "@/lib/models/user";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export type PaymentAdminState = { error: string } | { success: true } | null;

const VALID_STATUSES = ["pending", "paid", "refunded", "failed"];

export async function updatePaymentStatusAction(
  paymentId: string,
  _prevState: PaymentAdminState,
  formData: FormData
): Promise<PaymentAdminState> {
  if (!(await isAdminAuthenticated())) return { error: "Sessão de admin expirada." };

  const status = String(formData.get("status") ?? "");
  if (!VALID_STATUSES.includes(status)) return { error: "Status inválido." };

  await connectDB();
  const payment = await PaymentModel.findById(paymentId);
  if (!payment) return { error: "Pagamento não encontrado." };

  const wasPaid = payment.status === "paid";
  payment.status = status as (typeof VALID_STATUSES)[number];
  payment.paidAt = status === "paid" ? new Date() : undefined;
  await payment.save();

  // Reflete manualmente no plano do usuário — útil pra corrigir casos em
  // que o webhook da Efí falhou (já aconteceu, ver _docs/pagamentos.md).
  if (status === "paid" && !wasPaid) {
    await UserModel.findByIdAndUpdate(payment.userId, {
      plan: "premium",
      premiumSince: new Date(),
    });
  } else if (status !== "paid" && wasPaid) {
    await UserModel.findByIdAndUpdate(payment.userId, { plan: "free" });
  }

  revalidatePath("/admin/pagamentos");
  return { success: true };
}

export async function deletePaymentAction(paymentId: string) {
  if (!(await isAdminAuthenticated())) return;

  await connectDB();
  const payment = await PaymentModel.findByIdAndDelete(paymentId);
  if (!payment) return;

  // Mesma lógica do webhook de estorno: sem isso, apagar o único registro
  // "paid" de alguém deixava a conta Premium sem nenhum pagamento no banco
  // que justificasse.
  if (payment.status === "paid") {
    const stillPaid = await PaymentModel.exists({
      userId: payment.userId,
      status: "paid",
    });
    if (!stillPaid) {
      await UserModel.findByIdAndUpdate(payment.userId, { plan: "free" });
    }
  }

  revalidatePath("/admin/pagamentos");
}
