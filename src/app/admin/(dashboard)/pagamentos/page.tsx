import { Types } from "mongoose";
import { TriangleAlert } from "lucide-react";
import { connectDB } from "@/lib/db";
import { PaymentModel } from "@/lib/models/payment";
import { UserModel } from "@/lib/models/user";
import { AdminPaymentRow } from "@/components/AdminPaymentRow";
import { AdminPagination } from "@/components/AdminPagination";
import { ADMIN_PAGE_SIZE, parsePage, totalPagesFor } from "@/lib/admin-pagination";
import { escapeRegex } from "@/lib/regex-escape";

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const METHOD_LABELS: Record<string, string> = { pix: "Pix", credit: "Cartão" };
const STATUS_OPTIONS = ["pending", "paid", "refunded", "failed"];
const METHOD_OPTIONS = ["pix", "credit"];

export default async function AdminPagamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; status?: string; method?: string }>;
}) {
  const { page: pageParam, q = "", status = "", method = "" } = await searchParams;
  const page = parsePage(pageParam);

  await connectDB();

  const filter: Record<string, unknown> = {};
  if (STATUS_OPTIONS.includes(status)) filter.status = status;
  if (METHOD_OPTIONS.includes(method)) filter.method = method;

  const query = q.trim();
  if (query) {
    const regex = new RegExp(escapeRegex(query), "i");
    const matchedUsers = await UserModel.find({
      $or: [{ name: regex }, { username: regex }, { email: regex }],
    })
      .select("_id")
      .lean();
    const orClauses: Record<string, unknown>[] = [
      { externalId: regex },
      { userId: { $in: matchedUsers.map((u) => u._id) } },
    ];
    if (Types.ObjectId.isValid(query)) orClauses.push({ _id: query });
    filter.$or = orClauses;
  }

  const [total, needsReviewCount, payments] = await Promise.all([
    PaymentModel.countDocuments(filter),
    PaymentModel.countDocuments({ method: "credit", status: "pending" }),
    PaymentModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * ADMIN_PAGE_SIZE)
      .limit(ADMIN_PAGE_SIZE)
      .lean(),
  ]);
  const totalPages = totalPagesFor(total);

  const userIds = [...new Set(payments.map((p) => String(p.userId)))];
  const users = await UserModel.find({ _id: { $in: userIds } })
    .select("name username")
    .lean();
  const usersById = new Map(users.map((u) => [String(u._id), u]));

  const queryState = { q: query || undefined, status: status || undefined, method: method || undefined };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Pagamentos
        </h1>
        <p className="mt-1 text-sm text-white/60">{total} registro(s).</p>

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

      <form
        method="get"
        className="flex flex-wrap items-center gap-2 rounded-2xl bg-white/5 p-3"
      >
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="Nome, email, username ou txid/id..."
          className="min-w-0 flex-1 rounded-xl bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none"
        />
        <select
          name="method"
          defaultValue={method}
          className="rounded-xl bg-white/10 px-3 py-2 text-sm text-white focus:outline-none"
        >
          <option value="">Todos os métodos</option>
          <option value="pix">Pix</option>
          <option value="credit">Cartão</option>
        </select>
        <select
          name="status"
          defaultValue={status}
          className="rounded-xl bg-white/10 px-3 py-2 text-sm text-white focus:outline-none"
        >
          <option value="">Todos os status</option>
          <option value="pending">pending</option>
          <option value="paid">paid</option>
          <option value="refunded">refunded</option>
          <option value="failed">failed</option>
        </select>
        <button
          type="submit"
          className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-black transition active:scale-95 hover:bg-brand-light"
        >
          Filtrar
        </button>
        {(query || status || method) && (
          <a
            href="/admin/pagamentos"
            className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white/70 transition active:scale-95 hover:bg-white/20"
          >
            Limpar
          </a>
        )}
      </form>

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
          <p className="text-sm text-white/50">Nenhum pagamento encontrado.</p>
        )}
      </div>

      <AdminPagination
        page={page}
        totalPages={totalPages}
        basePath="/admin/pagamentos"
        query={queryState}
      />
    </div>
  );
}
