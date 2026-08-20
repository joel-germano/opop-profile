import { Schema, model, models, type InferSchemaType } from "mongoose";

// Identidade leve de quem paga pra gerar uma foto de apoio a um Candidate.
// Não é um User (candidato/dono de página) — não tem username, painel,
// molduras próprias etc. Só email + (senha OU Google) + status de desbloqueio.
const supporterSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: { type: String },
    googleId: { type: String },
    name: { type: String },
    unlocked: { type: Boolean, default: false },
    unlockedAt: { type: Date },
  },
  { timestamps: true }
);

export type Supporter = InferSchemaType<typeof supporterSchema> & { _id: string };

export const SupporterModel = models.Supporter ?? model("Supporter", supporterSchema);
