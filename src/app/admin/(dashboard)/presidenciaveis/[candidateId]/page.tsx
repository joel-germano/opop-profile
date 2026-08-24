import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { connectDB } from "@/lib/db";
import { CandidateModel } from "@/lib/models/candidate";
import { CandidateTemplateModel } from "@/lib/models/candidate-template";
import { GalleryPostModel } from "@/lib/models/gallery-post";
import { AdminCandidateEditForm } from "@/components/AdminCandidateEditForm";
import { AdminCandidateTemplatesManager } from "@/components/AdminCandidateTemplatesManager";
import { AdminGalleryModeration } from "@/components/AdminGalleryModeration";
import { AdminPagination } from "@/components/AdminPagination";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { parsePage, totalPagesFor } from "@/lib/admin-pagination";
import { deleteCandidateAction } from "../actions";

// Grade de miniaturas — múltiplo de 3 e 4 colunas (breakpoints do grid
// abaixo) pra última linha não sobrar torta.
const GALLERY_PAGE_SIZE = 24;

export default async function AdminEditCandidatePage({
  params,
  searchParams,
}: {
  params: Promise<{ candidateId: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { candidateId } = await params;
  const { page: pageParam } = await searchParams;
  const page = parsePage(pageParam);

  await connectDB();
  const candidate = await CandidateModel.findById(candidateId)
    .select("name slug photoUrl party color")
    .lean();
  if (!candidate) notFound();

  const templates = await CandidateTemplateModel.find({ candidateId })
    .sort({ createdAt: 1 })
    .lean();

  const [galleryTotal, galleryPosts] = await Promise.all([
    GalleryPostModel.countDocuments({ candidateSlug: candidate.slug }),
    GalleryPostModel.find({ candidateSlug: candidate.slug })
      .sort({ createdAt: -1 })
      .skip((page - 1) * GALLERY_PAGE_SIZE)
      .limit(GALLERY_PAGE_SIZE)
      .lean(),
  ]);
  const galleryTotalPages = totalPagesFor(galleryTotal, GALLERY_PAGE_SIZE);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Editar candidato
        </h1>
        <form action={deleteCandidateAction.bind(null, candidateId)}>
          <ConfirmSubmitButton
            confirmMessage={`Excluir ${candidate.name}? Isso também apaga todas as molduras dele(a).`}
            ariaLabel="Excluir candidato"
            className="flex items-center gap-2 rounded-full bg-red-500/15 px-4 py-2 text-sm font-medium text-red-400 transition active:scale-95 hover:bg-red-500/25"
          >
            <Trash2 size={15} strokeWidth={1.75} />
            Excluir
          </ConfirmSubmitButton>
        </form>
      </div>

      <AdminCandidateEditForm
        candidateId={candidateId}
        initialName={candidate.name}
        initialParty={candidate.party || ""}
        initialColor={candidate.color || ""}
        initialSlug={candidate.slug}
        initialPhotoUrl={candidate.photoUrl}
      />

      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-bold tracking-tight text-white">
          Molduras
        </h2>
        <AdminCandidateTemplatesManager
          candidateId={candidateId}
          templates={templates.map((t) => ({ id: String(t._id), imageUrl: t.imageUrl }))}
        />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-bold tracking-tight text-white">
          Galeria ({galleryTotal})
        </h2>
        <AdminGalleryModeration
          posts={galleryPosts.map((p) => ({ id: String(p._id), imageUrl: p.imageUrl }))}
        />
        <AdminPagination
          page={page}
          totalPages={galleryTotalPages}
          basePath={`/admin/presidenciaveis/${candidateId}`}
        />
      </div>
    </div>
  );
}
