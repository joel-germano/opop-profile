import { Schema, type InferSchemaType } from "mongoose";
import { registerModel } from "@/lib/models/register-model";

// Foto pública de quem gerou/compartilhou um card de apoio a um Candidate.
// Guarda por slug (não ObjectId) — o componente que posta já tem o slug em
// mãos, evita uma busca extra só pra achar o id do candidato.
const galleryPostSchema = new Schema(
  {
    candidateSlug: { type: String, required: true, index: true },
    supporterId: { type: Schema.Types.ObjectId, ref: "Supporter" },
    imageUrl: { type: String, required: true },
  },
  { timestamps: true }
);

// Um apoiador só pode ter uma foto na galeria de um mesmo candidato — reforçado
// em postToGalleryAction (findOne antes do create). Sem índice único aqui: já
// existem posts reais de antes desse campo existir, sem supporterId, e vários
// deles colidem num índice único (mesmo com sparse) por terem o campo ausente
// no mesmo candidato.

export type GalleryPost = InferSchemaType<typeof galleryPostSchema> & { _id: string };

export const GalleryPostModel = registerModel("GalleryPost", galleryPostSchema);
