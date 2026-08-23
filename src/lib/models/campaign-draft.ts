import { Schema, type InferSchemaType } from "mongoose";
import { registerModel } from "@/lib/models/register-model";

// Rascunho do conteúdo da campanha (título, descrição, link e legenda)
// preenchido em /painel antes de existir conta — identificado pelo mesmo
// draftId usado pelas molduras (ver lib/draft.ts). Some assim que é
// reivindicado por uma conta de verdade (claimDraft em lib/draft.ts).
const campaignDraftSchema = new Schema(
  {
    draftId: { type: String, required: true, unique: true },
    username: { type: String, trim: true, lowercase: true, default: "" },
    title: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    caption: { type: String, trim: true, default: "" },
    previewPhotoUrl: { type: String, trim: true, default: "" },
    coverUrl: { type: String, trim: true, default: "" },
    coverPreviewPhotoUrl: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

export type CampaignDraft = InferSchemaType<typeof campaignDraftSchema> & { _id: string };

export const CampaignDraftModel = registerModel("CampaignDraft", campaignDraftSchema);
