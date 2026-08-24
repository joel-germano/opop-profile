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
    party: { type: String, trim: true, default: "" },
    // Cor de marca do candidato (hex, ex: "#DC2626") — usada nas bordas,
    // coroa e destaques do ranking em vez de uma cor genérica fixa. Vazio
    // cai no fallback definido em candidate-colors.ts.
    color: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

export type Candidate = InferSchemaType<typeof candidateSchema> & { _id: string };

export const CandidateModel = registerModel("Candidate", candidateSchema);
