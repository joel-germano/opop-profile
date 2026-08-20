import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { CandidateModel } from "@/lib/models/candidate";
import { CandidateTemplateModel } from "@/lib/models/candidate-template";
import { GalleryPostModel } from "@/lib/models/gallery-post";
import { getCurrentSupporter } from "@/lib/supporter-auth";
import { GALLERY_PAGE_SIZE } from "@/lib/presidenciaveis-constants";
import { PresidentialCandidatePage } from "@/components/PresidentialCandidatePage";

export default async function CandidateDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;

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

  const supporterCount = await GalleryPostModel.countDocuments({ candidateSlug: slug });
  const galleryTotalPages = Math.max(1, Math.ceil(supporterCount / GALLERY_PAGE_SIZE));
  const galleryPage = Math.min(
    Math.max(1, parseInt(pageParam ?? "1", 10) || 1),
    galleryTotalPages
  );

  const galleryDocs = await GalleryPostModel.find({ candidateSlug: slug })
    .sort({ createdAt: -1 })
    .skip((galleryPage - 1) * GALLERY_PAGE_SIZE)
    .limit(GALLERY_PAGE_SIZE)
    .select("imageUrl")
    .lean();

  const supporter = await getCurrentSupporter();

  return (
    <PresidentialCandidatePage
      candidate={{ name: candidate.name, photoUrl: candidate.photoUrl, slug: candidate.slug }}
      templates={templates}
      initialUnlocked={supporter?.unlocked ?? false}
      gnClientId={process.env.GN_ACCOUNT_ID ?? ""}
      googleClientId={process.env.GOOGLE_CLIENT_ID ?? ""}
      galleryPosts={galleryDocs.map((p) => ({ id: String(p._id), imageUrl: p.imageUrl }))}
      supporterCount={supporterCount}
      galleryPage={galleryPage}
      galleryTotalPages={galleryTotalPages}
    />
  );
}
