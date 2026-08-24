import { Trash2 } from "lucide-react";
import { connectDB } from "@/lib/db";
import { SupporterModel } from "@/lib/models/supporter";
import { SupporterPurchaseModel } from "@/lib/models/supporter-purchase";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { AdminPagination } from "@/components/AdminPagination";
import { ADMIN_PAGE_SIZE, parsePage, totalPagesFor } from "@/lib/admin-pagination";
import { deleteSupporterAction } from "./actions";

const METHOD_LABELS: Record<string, string> = { pix: "Pix", credit: "Cartão" };

export default async function AdminEleitoresPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = parsePage(pageParam);

  await connectDB();

  const [total, paidCount, supporters] = await Promise.all([
    SupporterModel.countDocuments({}),
    SupporterModel.countDocuments({ unlocked: true }),
    SupporterModel.find({})
      .sort({ createdAt: -1 })
      .skip((page - 1) * ADMIN_PAGE_SIZE)
      .limit(ADMIN_PAGE_SIZE)
      .lean(),
  ]);
  const totalPages = totalPagesFor(total);

  // Compra mais recente só de quem está nesta página — evita carregar a
  // coleção de compras inteira pra montar 20 linhas.
  const supporterIds = supporters.map((s) => s._id);
  const purchases = await SupporterPurchaseModel.find({
    supporterId: { $in: supporterIds },
    status: "paid",
  })
    .sort({ paidAt: -1 })
    .lean();

  const paidPurchaseBySupporter = new Map<string, (typeof purchases)[number]>();
  for (const purchase of purchases) {
    const key = String(purchase.supporterId);
    if (!paidPurchaseBySupporter.has(key)) paidPurchaseBySupporter.set(key, purchase);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Eleitores
        </h1>
        <p className="mt-1 text-sm text-white/60">
          {total} eleitor(es) · {paidCount} pagou(ram)
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {supporters.map((supporter) => {
          const purchase = paidPurchaseBySupporter.get(String(supporter._id));
          return (
            <div
              key={String(supporter._id)}
              className="flex flex-wrap items-center gap-4 rounded-2xl bg-white/5 p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-white">
                  {supporter.name || supporter.email}
                </p>
                <p className="truncate text-xs text-white/50">
                  {supporter.email}
                  {supporter.googleId ? " · Google" : ""}
                </p>
                {purchase && (
                  <p className="mt-1 truncate text-xs text-white/40">
                    {METHOD_LABELS[purchase.method] ?? purchase.method} · txid/id transação:{" "}
                    <span className="font-mono">{purchase.externalId}</span>
                  </p>
                )}
              </div>

              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                  supporter.unlocked
                    ? "bg-brand/20 text-brand-light"
                    : "bg-white/10 text-white/60"
                }`}
              >
                {supporter.unlocked ? "Pago" : "Não pago"}
              </span>

              <form action={deleteSupporterAction.bind(null, String(supporter._id))}>
                <ConfirmSubmitButton
                  confirmMessage={`Excluir eleitor ${supporter.email}?`}
                  ariaLabel="Excluir eleitor"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500/15 text-red-400 transition active:scale-90 hover:bg-red-500/25"
                >
                  <Trash2 size={15} strokeWidth={1.75} />
                </ConfirmSubmitButton>
              </form>
            </div>
          );
        })}

        {supporters.length === 0 && (
          <p className="text-sm text-white/50">Nenhum eleitor ainda.</p>
        )}
      </div>

      <AdminPagination page={page} totalPages={totalPages} basePath="/admin/eleitores" />
    </div>
  );
}
