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
    // Toda moldura gerada cria um post automaticamente (ver
    // generateFrameAction) — "private" é o padrão porque nem toda foto real
    // deveria ficar pública sem a pessoa escolher. Só "public" aparece na
    // galeria/carrossel do candidato (GalleryFeedModal, GalleryPreviewCarousel);
    // "private" só aparece na própria "Minha Galeria" do supporter dono.
    // O ranking/placar do candidato conta os dois — ver comentário em
    // getInviteSummary sobre "cada moldura gerada conta, pública ou não".
    visibility: { type: String, enum: ["private", "public"], default: "private" },
  },
  { timestamps: true }
);

// Gráfico de evolução (ver PresidenciaveisTrendChart) agrega posts por dia
// dentro de uma janela — sem índice em createdAt esse $match viraria uma
// varredura da coleção inteira a cada carregamento da página.
galleryPostSchema.index({ createdAt: -1 });

// Índice usado pela galeria pública por candidato (visibility + candidateSlug)
// e pela "Minha Galeria" (supporterId, todas as visibilidades).
galleryPostSchema.index({ candidateSlug: 1, visibility: 1, createdAt: -1 });
galleryPostSchema.index({ supporterId: 1, createdAt: -1 });

export type GalleryPost = InferSchemaType<typeof galleryPostSchema> & { _id: string };

export const GalleryPostModel = registerModel("GalleryPost", galleryPostSchema);
