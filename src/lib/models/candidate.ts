import { Schema, type InferSchemaType } from "mongoose";
import { registerModel } from "@/lib/models/register-model";

// Candidato à presidência — entidade PARALELA ao User/candidato-de-campanha
// já existente. Cadastrado só pelo admin (não é self-service via /cadastro).
const candidateSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    photoUrl: { type: String, required: true },
  },
  { timestamps: true }
);

export type Candidate = InferSchemaType<typeof candidateSchema> & { _id: string };

export const CandidateModel = registerModel("Candidate", candidateSchema);
