import { Schema, model, models, type InferSchemaType } from "mongoose";

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
  models.CandidateTemplate ?? model("CandidateTemplate", candidateTemplateSchema);
