import { Schema, type InferSchemaType } from "mongoose";
import { registerModel } from "@/lib/models/register-model";

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
    // Total de molduras compradas somando todas as compras pagas (1 usada
    // por ela mesma + o resto pra presentear, ver GiftInviteCard). Cresce a
    // cada compra confirmada, cai se uma compra é reembolsada — nunca é
    // "setado", sempre incrementado/decrementado (ver webhook do Pix e
    // chargeSupporterCreditCardAction).
    frameCredits: { type: Number, default: 0 },
    // Quantas dessas frameCredits estão presas em convites "pending" ainda
    // não resgatados (ver createFrameInviteAction) — sem isso, gerar uma
    // moldura pra si mesma (generateFrameAction) podia gastar o crédito que
    // já tinha um convite pendente em cima dele: o amigo resgatava depois e
    // ganhava uma moldura de graça, sem nenhuma compra por trás. Sobe ao
    // criar o convite, desce ao resgatar (vira gasto de verdade) ou revogar
    // (devolve a vaga).
    reservedForGifts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export type Supporter = InferSchemaType<typeof supporterSchema> & { _id: string };

export const SupporterModel = registerModel("Supporter", supporterSchema);
