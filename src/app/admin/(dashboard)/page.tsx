import { BadgeDollarSign, CreditCard, QrCode, Users } from "lucide-react";
import { connectDB } from "@/lib/db";
import { PaymentModel } from "@/lib/models/payment";
import { UserModel } from "@/lib/models/user";

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function AdminDashboardPage() {
  await connectDB();

  const paidPayments = await PaymentModel.find({ status: "paid" })
    .select("amountCents method createdAt")
    .lean();

  const totalCents = paidPayments.reduce((sum, p) => sum + p.amountCents, 0);
  const pixCents = paidPayments
    .filter((p) => p.method === "pix")
    .reduce((sum, p) => sum + p.amountCents, 0);
  const creditCents = paidPayments
    .filter((p) => p.method === "credit")
    .reduce((sum, p) => sum + p.amountCents, 0);

  const [totalUsers, premiumUsers, pendingPayments] = await Promise.all([
    UserModel.countDocuments({}),
    UserModel.countDocuments({ plan: "premium" }),
    PaymentModel.countDocuments({ status: "pending" }),
  ]);

  const ticketMedio = paidPayments.length > 0 ? totalCents / paidPayments.length : 0;

  const cards = [
    {
      label: "Faturado (total)",
      value: formatBRL(totalCents),
      icon: BadgeDollarSign,
      sub: `${paidPayments.length} pagamento${paidPayments.length === 1 ? "" : "s"} confirmado${paidPayments.length === 1 ? "" : "s"}`,
    },
    {
      label: "Via Pix",
      value: formatBRL(pixCents),
      icon: QrCode,
      sub: `${paidPayments.filter((p) => p.method === "pix").length} pagamentos`,
    },
    {
      label: "Via cartão",
      value: formatBRL(creditCents),
      icon: CreditCard,
      sub: `${paidPayments.filter((p) => p.method === "credit").length} pagamentos`,
    },
    {
      label: "Assinantes Premium",
      value: `${premiumUsers} de ${totalUsers}`,
      icon: Users,
      sub: `Ticket médio: ${formatBRL(ticketMedio)}`,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-normal tracking-wide text-white">
          Vendas
        </h1>
        <p className="mt-1 text-sm text-white/60">
          Resumo de faturamento e conversão Premium.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, sub }) => (
          <div key={label} className="rounded-2xl bg-white/5 p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/15 text-brand-light">
              <Icon size={18} strokeWidth={1.75} />
            </span>
            <p className="mt-3 text-2xl font-bold text-white">{value}</p>
            <p className="text-sm text-white/60">{label}</p>
            <p className="mt-1 text-xs text-white/40">{sub}</p>
          </div>
        ))}
      </div>

      {pendingPayments > 0 && (
        <p className="text-sm text-white/50">
          {pendingPayments} pagamento{pendingPayments === 1 ? "" : "s"} ainda pendente
          {pendingPayments === 1 ? "" : "s"} (Pix aguardando confirmação ou cartão em
          processamento).
        </p>
      )}
    </div>
  );
}
