import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/lib/models/user";
import { TemplateModel } from "@/lib/models/template";
import { CampaignPageClient } from "@/components/CampaignPageClient";
import { getCurrentUser } from "@/lib/auth";
import { DEFAULT_CAPTION } from "@/lib/constants";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

// Título/descrição por campanha — pareiam com a imagem de opengraph-image.tsx
// (mesma pasta) pra deixar o card de compartilhamento inteiro personalizado,
// não só a imagem. Sem usuário, cai no metadata genérico do layout raiz.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  await connectDB();
  const user = await UserModel.findOne({ username: id.toLowerCase() })
    .select("title description")
    .lean();
  if (!user) return {};

  const title = user.title || undefined;
  const description = user.description || SITE_DESCRIPTION;

  // Next NÃO faz merge profundo de `openGraph`/`twitter` com o metadata do
  // layout raiz — o que não for repetido aqui (type, siteName, card...) some
  // em vez de herdar. `images` continua vindo sozinho de opengraph-image.tsx
  // /twitter-image.tsx (arquivos especiais nesta mesma pasta).
  return {
    title,
    description,
    openGraph: { title, description, type: "website", siteName: SITE_NAME },
    twitter: { title, description, card: "summary_large_image" },
  };
}

// Soma aleatória (3 a 7) aplicada ao contador de visitas a cada carregamento
// da página pública — ver visitCount no schema de User.
function randomVisitIncrement() {
  return 3 + Math.floor(Math.random() * 5);
}

export default async function CampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  await connectDB();
  const [user, viewer] = await Promise.all([
    UserModel.findOneAndUpdate(
      { username: id.toLowerCase() },
      { $inc: { visitCount: randomVisitIncrement() } },
      { new: true }
    ).select(
      "name username photoUrl title description caption coverUrl visitCount"
    ),
    getCurrentUser(),
  ]);
  if (!user) notFound();

  const templateDocs = await TemplateModel.find({ userId: user._id })
    .sort({ order: 1, createdAt: 1 })
    .lean();

  const templates = templateDocs.map((t, i) => ({
    id: i + 1,
    name: `Modelo ${i + 1}`,
    src: t.imageUrl,
  }));

  return (
    <CampaignPageClient
      templates={templates}
      user={{
        name: user.name,
        username: user.username,
        photoUrl: user.photoUrl,
        title: user.title,
        description: user.description,
        caption: user.caption || DEFAULT_CAPTION,
        coverUrl: user.coverUrl,
        visitCount: user.visitCount,
      }}
      isViewerLoggedIn={Boolean(viewer)}
      viewerName={viewer?.name}
      viewerEmail={viewer?.email}
      viewerPhotoUrl={viewer?.photoUrl}
    />
  );
}
