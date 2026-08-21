import { connectDB } from "@/lib/db";
import { TemplateModel } from "@/lib/models/template";
import { getCurrentUser } from "@/lib/auth";
import { TEMPLATE_LIMITS } from "@/lib/plans";
import { TemplatesManager } from "@/components/TemplatesManager";

export default async function ConfiguracoesPage() {
  const user = await getCurrentUser();
  if (!user) return null; // já redirecionado pelo layout/proxy do /painel

  await connectDB();
  const templates = await TemplateModel.find({ userId: user._id })
    .sort({ order: 1, createdAt: 1 })
    .lean();

  const plan = user.plan as "free" | "premium";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Molduras
        </h1>
        <p className="mt-1.5 text-sm text-white/60">
          As artes que aparecem na sua página de apoio, em{" "}
          <span className="text-white/80">opop.bio/{user.username}</span>.
        </p>
      </div>

      <TemplatesManager
        templates={templates.map((t) => ({ id: String(t._id), imageUrl: t.imageUrl }))}
        limit={TEMPLATE_LIMITS[plan]}
        plan={plan}
      />
    </div>
  );
}
