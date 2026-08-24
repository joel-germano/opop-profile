import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { CandidateModel } from "@/lib/models/candidate";
import { CandidateTemplateModel } from "@/lib/models/candidate-template";
import { GalleryPostModel } from "@/lib/models/gallery-post";
import { getCurrentSupporter } from "@/lib/supporter-auth";
import { GALLERY_PREVIEW_SIZE } from "@/lib/presidenciaveis-constants";
import { getPresidenciaveisPriceCents } from "@/lib/premium-price";
import { getInviteContext, getInviteSummary } from "@/lib/frame-invites";
import { PresidentialCandidatePage } from "@/components/PresidentialCandidatePage";

export default async function CandidateDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ convite?: string }>;
}) {
  const { slug } = await params;
  const { convite } = await searchParams;

  await connectDB();
  const candidate = await CandidateModel.findOne({ slug: slug.toLowerCase() }).lean();
  if (!candidate) notFound();

  const templateDocs = await CandidateTemplateModel.find({ candidateId: candidate._id })
    .sort({ createdAt: 1 })
    .lean();

  const templates = templateDocs.map((t, i) => ({
    id: i + 1,
    name: `Modelo ${i + 1}`,
    src: t.imageUrl,
  }));

  // Ranking/placar: conta toda moldura gerada, pública ou privada — é o
  // "cada compra aumenta o ranking do candidato". Só as vitrines (abaixo)
  // filtram por visibility: "public"; essa contagem, não.
  const supporterCount = await GalleryPostModel.countDocuments({ candidateSlug: slug });

  // Só a prévia (carrossel abaixo do botão "Escolha sua foto"); a galeria
  // completa carrega no modal, sob demanda, paginada por cursor
  // (getGalleryFeedAction) — nunca os posts inteiros de uma vez. Filtrado
  // por "public": é vitrine visível pra qualquer visitante, moldura privada
  // não pode aparecer aqui.
  const previewDocs = await GalleryPostModel.find({ candidateSlug: slug, visibility: "public" })
    .sort({ _id: -1 })
    .limit(GALLERY_PREVIEW_SIZE)
    .select("imageUrl")
    .lean();

  const supporter = await getCurrentSupporter();
  const priceCents = await getPresidenciaveisPriceCents();
  const supporterShareCount = supporter
    ? await GalleryPostModel.countDocuments({ supporterId: supporter._id })
    : 0;

  // Convite só é considerado se ainda estiver pendente e for desse candidato
  // — link já usado (ou de outro candidato) cai fora aqui e a página se
  // comporta como uma visita normal.
  const invite = await getInviteContext(convite, slug);

  // Saldo de convites de quem já comprou — alimenta o GiftInviteCard.
  const inviteSummary = supporter
    ? await getInviteSummary(
        String(supporter._id),
        supporter.frameCredits ?? 0,
        supporter.reservedForGifts ?? 0
      )
    : null;

  return (
    <PresidentialCandidatePage
      candidate={{ name: candidate.name, photoUrl: candidate.photoUrl, slug: candidate.slug }}
      templates={templates}
      initialFrameCredits={supporter?.frameCredits ?? 0}
      gnClientId={process.env.GN_ACCOUNT_ID ?? ""}
      googleClientId={process.env.GOOGLE_CLIENT_ID ?? ""}
      galleryPreview={previewDocs.map((p) => ({ id: String(p._id), imageUrl: p.imageUrl }))}
      supporterCount={supporterCount}
      priceCents={priceCents}
      supporter={supporter ? { name: supporter.name ?? null, email: supporter.email } : null}
      supporterShareCount={supporterShareCount}
      invite={invite}
      inviteSummary={inviteSummary}
    />
  );
}
