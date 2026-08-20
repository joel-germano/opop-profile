import { Schema, model, models, type InferSchemaType } from "mongoose";

// Foto pública de quem gerou/compartilhou um card de apoio a um Candidate.
// Guarda por slug (não ObjectId) — o componente que posta já tem o slug em
// mãos, evita uma busca extra só pra achar o id do candidato.
const galleryPostSchema = new Schema(
  {
    candidateSlug: { type: String, required: true, index: true },
    imageUrl: { type: String, required: true },
  },
  { timestamps: true }
);

export type GalleryPost = InferSchemaType<typeof galleryPostSchema> & { _id: string };

export const GalleryPostModel = models.GalleryPost ?? model("GalleryPost", galleryPostSchema);
