import { Schema, type InferSchemaType } from "mongoose";
import { registerModel } from "@/lib/models/register-model";

// Molduras de um Candidate — separado do Template (que pertence a um User)
// de propósito, já que essa é uma modalidade paralela e admin-gerenciada.
const candidateTemplateSchema = new Schema(
  {
    candidateId: { type: Schema.Types.ObjectId, ref: "Candidate", required: true },
    imageUrl: { type: String, required: true },
  },
  { timestamps: true }
);

export type CandidateTemplate = InferSchemaType<typeof candidateTemplateSchema> & {
  _id: string;
};

export const CandidateTemplateModel =
  registerModel("CandidateTemplate", candidateTemplateSchema);
