import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { connectDB } from "@/lib/db";
import { CandidateModel } from "@/lib/models/candidate";
import { CandidateTemplateModel } from "@/lib/models/candidate-template";
import { GalleryPostModel } from "@/lib/models/gallery-post";
import { AdminCandidateEditForm } from "@/components/AdminCandidateEditForm";
import { AdminCandidateTemplatesManager } from "@/components/AdminCandidateTemplatesManager";
import { AdminGalleryModeration } from "@/components/AdminGalleryModeration";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { deleteCandidateAction } from "../actions";

export default async function AdminEditCandidatePage({
  params,
}: {
  params: Promise<{ candidateId: string }>;
}) {
  const { candidateId } = await params;

  await connectDB();
  const candidate = await CandidateModel.findById(candidateId)
    .select("name slug photoUrl")
    .lean();
  if (!candidate) notFound();

  const templates = await CandidateTemplateModel.find({ candidateId })
    .sort({ createdAt: 1 })
    .lean();

  const galleryPosts = await GalleryPostModel.find({ candidateSlug: candidate.slug })
    .sort({ createdAt: -1 })
    .lean();

  return (
    <div className="flex flex-col gap-10">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-normal tracking-wide text-white">
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
        initialSlug={candidate.slug}
        initialPhotoUrl={candidate.photoUrl}
      />

      <div className="flex flex-col gap-3">
        <h2 className="font-heading text-xl font-normal tracking-wide text-white">
          Molduras
        </h2>
        <AdminCandidateTemplatesManager
          candidateId={candidateId}
          templates={templates.map((t) => ({ id: String(t._id), imageUrl: t.imageUrl }))}
        />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="font-heading text-xl font-normal tracking-wide text-white">
          Galeria ({galleryPosts.length})
        </h2>
        <AdminGalleryModeration
          posts={galleryPosts.map((p) => ({ id: String(p._id), imageUrl: p.imageUrl }))}
        />
      </div>
    </div>
  );
}
