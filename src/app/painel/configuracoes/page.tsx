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
    .sort({ createdAt: 1 })
    .lean();

  const plan = user.plan as "free" | "premium";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-3xl font-normal tracking-wide text-white">
          Molduras
        </h1>
        <p className="mt-2 text-base text-white/60">
          Envie as molduras que vão aparecer na sua página de apoio (
          <span className="text-white/80">/{user.username}</span>). PNG com um
          &ldquo;buraco&rdquo; transparente no centro, onde a foto do apoiador aparece.
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
