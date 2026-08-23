import { connectDB } from "@/lib/db";
import { TemplateModel } from "@/lib/models/template";
import { getCurrentUser } from "@/lib/auth";
import { getCampaignDraft, getDraftId } from "@/lib/draft";
import { PAYMENTS_ENABLED, PREMIUM_PRICE_CENTS, TEMPLATE_LIMITS } from "@/lib/plans";
import { PainelSteps } from "@/components/PainelSteps";

export default async function PainelPage() {
  const user = await getCurrentUser();
  const draftId = user ? null : await getDraftId();
  const owner = user ? { userId: user._id } : draftId ? { draftId } : null;

  let templates: { id: string; imageUrl: string }[] = [];
  if (owner) {
    await connectDB();
    const docs = await TemplateModel.find(owner)
      .sort({ order: 1, createdAt: 1 })
      .lean();
    templates = docs.map((t) => ({ id: String(t._id), imageUrl: t.imageUrl }));
  }

  // Sem conta, o que já foi preenchido vive no rascunho — sem isso, recarregar
  // a página no meio do fluxo perderia tudo que ainda não virou conta.
  const draft = user ? null : await getCampaignDraft();
  const content = user ?? draft;

  const plan = (user?.plan as "free" | "premium") ?? "free";
  const limit = PAYMENTS_ENABLED ? TEMPLATE_LIMITS[plan] : Infinity;

  return (
    <PainelSteps
      isLoggedIn={Boolean(user)}
      username={content?.username ?? ""}
      title={content?.title ?? ""}
      description={content?.description ?? ""}
      caption={content?.caption ?? ""}
      previewPhotoUrl={content?.previewPhotoUrl ?? ""}
      templates={templates}
      limit={limit}
      premiumPriceCents={PREMIUM_PRICE_CENTS}
    />
  );
}
