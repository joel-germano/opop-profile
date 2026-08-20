"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { CandidateModel } from "@/lib/models/candidate";
import { CandidateTemplateModel } from "@/lib/models/candidate-template";
import { GalleryPostModel } from "@/lib/models/gallery-post";
import { saveAvatarFromDataUrl, deleteAvatar } from "@/lib/save-avatar";
import { saveTemplateFromDataUrl, deleteTemplateFile } from "@/lib/save-template";
import { deleteGalleryPhotoFile } from "@/lib/save-gallery-photo";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export type CandidateFormState = { error: string } | { success: true } | null;

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createCandidateAction(
  _prevState: CandidateFormState,
  formData: FormData
): Promise<CandidateFormState> {
  if (!(await isAdminAuthenticated())) return { error: "Sessão de admin expirada." };

  const name = String(formData.get("name") ?? "").trim();
  const photoDataUrl = String(formData.get("photoDataUrl") ?? "");
  const rawSlug = String(formData.get("slug") ?? "").trim();
  const slug = slugify(rawSlug || name);

  if (!name || !slug) return { error: "Preencha o nome." };
  if (!photoDataUrl) return { error: "Escolha uma foto do candidato." };

  await connectDB();
  const existing = await CandidateModel.findOne({ slug }).select("_id");
  if (existing) return { error: "Já existe um candidato com esse slug." };

  let candidateId: string;
  try {
    const photoUrl = await saveAvatarFromDataUrl(photoDataUrl);
    const candidate = await CandidateModel.create({ name, slug, photoUrl });
    candidateId = String(candidate._id);
  } catch {
    return { error: "Não foi possível criar o candidato. Tente novamente." };
  }

  revalidatePath("/admin/presidenciaveis");
  redirect(`/admin/presidenciaveis/${candidateId}`);
}

export async function updateCandidateAction(
  candidateId: string,
  _prevState: CandidateFormState,
  formData: FormData
): Promise<CandidateFormState> {
  if (!(await isAdminAuthenticated())) return { error: "Sessão de admin expirada." };

  const name = String(formData.get("name") ?? "").trim();
  const rawSlug = String(formData.get("slug") ?? "").trim();
  const slug = slugify(rawSlug || name);
  const photoDataUrl = String(formData.get("photoDataUrl") ?? "");

  if (!name || !slug) return { error: "Preencha o nome." };

  await connectDB();
  const existing = await CandidateModel.findOne({ slug, _id: { $ne: candidateId } }).select(
    "_id"
  );
  if (existing) return { error: "Já existe outro candidato com esse slug." };

  const candidate = await CandidateModel.findById(candidateId);
  if (!candidate) return { error: "Candidato não encontrado." };

  candidate.name = name;
  candidate.slug = slug;

  try {
    if (photoDataUrl) {
      const oldPhotoUrl = candidate.photoUrl;
      candidate.photoUrl = await saveAvatarFromDataUrl(photoDataUrl);
      await candidate.save();
      await deleteAvatar(oldPhotoUrl);
    } else {
      await candidate.save();
    }
  } catch {
    return { error: "Não foi possível salvar. Tente novamente." };
  }

  revalidatePath("/admin/presidenciaveis");
  return { success: true };
}

export async function deleteCandidateAction(candidateId: string) {
  if (!(await isAdminAuthenticated())) return;

  await connectDB();
  const candidate = await CandidateModel.findById(candidateId).select("photoUrl slug");
  if (!candidate) return;

  const templates = await CandidateTemplateModel.find({ candidateId }).select("imageUrl");
  for (const template of templates) {
    await deleteTemplateFile(template.imageUrl);
  }
  await CandidateTemplateModel.deleteMany({ candidateId });

  const galleryPosts = await GalleryPostModel.find({ candidateSlug: candidate.slug }).select(
    "imageUrl"
  );
  for (const post of galleryPosts) {
    await deleteGalleryPhotoFile(post.imageUrl);
  }
  await GalleryPostModel.deleteMany({ candidateSlug: candidate.slug });

  await deleteAvatar(candidate.photoUrl);
  await CandidateModel.findByIdAndDelete(candidateId);

  revalidatePath("/admin/presidenciaveis");
  redirect("/admin/presidenciaveis");
}

export type TemplateFormState = { error: string } | { success: true } | null;

export async function addCandidateTemplateAction(
  candidateId: string,
  _prevState: TemplateFormState,
  formData: FormData
): Promise<TemplateFormState> {
  if (!(await isAdminAuthenticated())) return { error: "Sessão de admin expirada." };

  const imageDataUrl = String(formData.get("imageDataUrl") ?? "");
  if (!imageDataUrl) return { error: "Escolha uma imagem." };

  await connectDB();
  try {
    const imageUrl = await saveTemplateFromDataUrl(imageDataUrl);
    await CandidateTemplateModel.create({ candidateId, imageUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    return {
      error:
        message === "Imagem maior que 1MB"
          ? "A imagem precisa ter no máximo 1MB."
          : "Não foi possível salvar a moldura.",
    };
  }

  revalidatePath(`/admin/presidenciaveis/${candidateId}`);
  return { success: true };
}

export async function deleteCandidateTemplateAction(templateId: string) {
  if (!(await isAdminAuthenticated())) return;

  await connectDB();
  const template = await CandidateTemplateModel.findById(templateId);
  if (!template) return;

  await deleteTemplateFile(template.imageUrl);
  await template.deleteOne();

  revalidatePath("/admin/presidenciaveis");
}

export async function deleteGalleryPostAction(postId: string) {
  if (!(await isAdminAuthenticated())) return;

  await connectDB();
  const post = await GalleryPostModel.findById(postId);
  if (!post) return;

  await deleteGalleryPhotoFile(post.imageUrl);
  await post.deleteOne();

  revalidatePath("/admin/presidenciaveis");
}
