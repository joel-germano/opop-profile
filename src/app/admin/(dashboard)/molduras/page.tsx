import { connectDB } from "@/lib/db";
import { UserModel } from "@/lib/models/user";
import { TemplateModel } from "@/lib/models/template";
import { AdminTemplateRow } from "@/components/AdminTemplateRow";
import { AdminPagination } from "@/components/AdminPagination";
import { parsePage, totalPagesFor } from "@/lib/admin-pagination";

// Menor que ADMIN_PAGE_SIZE porque cada "linha" aqui é uma conta inteira com
// várias miniaturas — 20 contas por página deixaria a lista enorme.
const USERS_PER_PAGE = 8;

export default async function AdminMoldurasPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = parsePage(pageParam);

  await connectDB();

  // Só pagina as CONTAS que têm moldura (não a lista de moldura em si) —
  // assim o agrupamento por dono não quebra entre páginas.
  const [templateCount, userIdsWithTemplates] = await Promise.all([
    TemplateModel.countDocuments({}),
    TemplateModel.distinct("userId"),
  ]);
  const total = userIdsWithTemplates.length;
  const totalPages = totalPagesFor(total, USERS_PER_PAGE);

  const users = await UserModel.find({ _id: { $in: userIdsWithTemplates } })
    .select("name username")
    .sort({ name: 1 })
    .skip((page - 1) * USERS_PER_PAGE)
    .limit(USERS_PER_PAGE)
    .lean();

  const templates = await TemplateModel.find({
    userId: { $in: users.map((u) => u._id) },
  })
    .sort({ createdAt: 1 })
    .lean();

  const templatesByUser = new Map<string, typeof templates>();
  for (const template of templates) {
    const key = String(template.userId);
    templatesByUser.set(key, [...(templatesByUser.get(key) ?? []), template]);
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Molduras
        </h1>
        <p className="mt-1 text-sm text-white/60">
          {templateCount} moldura(s) em {total} conta(s).
        </p>
      </div>

      {users.map((user) => {
        const userTemplates = templatesByUser.get(String(user._id)) ?? [];
        if (userTemplates.length === 0) return null;

        return (
          <div key={String(user._id)} className="flex flex-col gap-3">
            <h2 className="text-sm font-bold text-white">
              {user.name}{" "}
              <span className="font-normal text-white/50">@{user.username}</span>
            </h2>
            <div className="flex flex-wrap gap-4">
              {userTemplates.map((template) => (
                <AdminTemplateRow
                  key={String(template._id)}
                  templateId={String(template._id)}
                  imageUrl={template.imageUrl}
                />
              ))}
            </div>
          </div>
        );
      })}

      {total === 0 && (
        <p className="text-sm text-white/50">Nenhuma moldura enviada ainda.</p>
      )}

      <AdminPagination page={page} totalPages={totalPages} basePath="/admin/molduras" />
    </div>
  );
}
