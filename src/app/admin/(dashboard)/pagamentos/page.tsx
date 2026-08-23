import { TriangleAlert } from "lucide-react";
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

  const needsReviewCount = payments.filter(
    (p) => p.method === "credit" && p.status === "pending"
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Pagamentos
        </h1>
        <p className="mt-1 text-sm text-white/60">{payments.length} registro(s).</p>

        {needsReviewCount > 0 && (
          <p className="mt-3 flex items-start gap-2 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger-light ring-1 ring-danger/30">
            <TriangleAlert size={16} strokeWidth={2} className="mt-0.5 shrink-0" />
            <span>
              {needsReviewCount} cobrança(s) de cartão sem resposta conclusiva da
              Efí. Confira cada uma no painel da Efí: se foi aprovada, marque
              como <strong>paid</strong> aqui para liberar o Premium; se foi
              recusada, marque como <strong>failed</strong>.
            </span>
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {payments.map((payment) => {
          const user = usersById.get(String(payment.userId));

          // Pix pendente é rotina (cobrança gerada e abandonada). Cartão
          // pendente não: significa que a Efí não deu resposta conclusiva
          // (análise antifraude) e o valor PODE estar retido sem o cliente
          // ter recebido nada. Precisa conferir na Efí e resolver na mão —
          // por isso destaca, senão some no meio dos Pix abandonados.
          const needsReview = payment.method === "credit" && payment.status === "pending";

          return (
            <div
              key={String(payment._id)}
              className={`flex flex-wrap items-center gap-4 rounded-2xl p-4 ${
                needsReview ? "bg-danger/10 ring-1 ring-danger/40" : "bg-white/5"
              }`}
            >
              <div className="min-w-0 flex-1">
                {needsReview && (
                  <p className="mb-1 flex items-center gap-1.5 text-xs font-bold text-danger-light">
                    <TriangleAlert size={13} strokeWidth={2.5} />
                    Conferir na Efí — cartão sem resposta conclusiva
                  </p>
                )}
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
