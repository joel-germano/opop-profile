import { connectDB } from "@/lib/db";
import { PaymentModel } from "@/lib/models/payment";
import { UserModel } from "@/lib/models/user";
import { AdminPaymentRow } from "@/components/AdminPaymentRow";

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const METHOD_LABELS: Record<string, string> = { pix: "Pix", credit: "Cartão" };

export default async function AdminPagamentosPage() {
  await connectDB();

  const payments = await PaymentModel.find({}).sort({ createdAt: -1 }).lean();
  const userIds = [...new Set(payments.map((p) => String(p.userId)))];
  const users = await UserModel.find({ _id: { $in: userIds } })
    .select("name username")
    .lean();
  const usersById = new Map(users.map((u) => [String(u._id), u]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Pagamentos
        </h1>
        <p className="mt-1 text-sm text-white/60">{payments.length} registro(s).</p>
      </div>

      <div className="flex flex-col gap-2">
        {payments.map((payment) => {
          const user = usersById.get(String(payment.userId));
          return (
            <div
              key={String(payment._id)}
              className="flex flex-wrap items-center gap-4 rounded-2xl bg-white/5 p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-white">
                  {user ? user.name : "Usuário removido"}
                  {user && (
                    <span className="font-normal text-white/50"> @{user.username}</span>
                  )}
                </p>
                <p className="truncate text-xs text-white/50">
                  {METHOD_LABELS[payment.method] ?? payment.method} ·{" "}
                  {formatBRL(payment.amountCents)} ·{" "}
                  {new Date(payment.createdAt as Date).toLocaleString("pt-BR")}
                </p>
                <p className="truncate text-xs text-white/40">
                  id transação: <span className="font-mono">{String(payment._id)}</span> · txid:{" "}
                  <span className="font-mono">{payment.externalId}</span>
                </p>
              </div>

              <AdminPaymentRow
                paymentId={String(payment._id)}
                initialStatus={payment.status ?? "pending"}
              />
            </div>
          );
        })}

        {payments.length === 0 && (
          <p className="text-sm text-white/50">Nenhum pagamento registrado ainda.</p>
        )}
      </div>
    </div>
  );
}
