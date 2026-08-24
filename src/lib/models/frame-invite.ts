import { Schema, type InferSchemaType } from "mongoose";
import { registerModel } from "@/lib/models/register-model";

// Convite que um Supporter que já pagou gera pra presentear uma moldura a um
// amigo. O token vai na URL (?convite=...), então precisa ser aleatório o
// bastante pra não ser adivinhado — ver createFrameInviteAction.
//
// Cada convite (pending OU used) consome uma vaga do saldo comprado; só
// "revoked" devolve a vaga. O saldo é calculado contando convites — exceto
// quando `selfUse` é true, caso em que a vaga já foi debitada direto de
// `Supporter.frameCredits` (decremento atômico em generateFrameAction, pra
// evitar corrida de double-spend numa geração própria). Ver getInviteSummary
// em src/lib/frame-invites.ts: contar esses registros de novo ali daria
// desconto duplo da mesma vaga.
const frameInviteSchema = new Schema(
  {
    token: { type: String, required: true, unique: true },
    inviterSupporterId: {
      type: Schema.Types.ObjectId,
      ref: "Supporter",
      required: true,
      index: true,
    },
    // Snapshot do nome de quem convidou — evita um join só pra escrever
    // "Fulano te convidou" na tela do convidado.
    inviterName: { type: String },
    // De qual candidato o convite partiu: o link leva o amigo pra mesma
    // página, não pra uma genérica.
    candidateSlug: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "used", "revoked"],
      default: "pending",
      index: true,
    },
    // Preenchido quando o convite é enviado por email (registro de pra quem
    // foi). WhatsApp e "copiar link" não têm destinatário conhecido.
    sentToEmail: { type: String },
    sentAt: { type: Date },
    usedBySupporterId: { type: Schema.Types.ObjectId, ref: "Supporter" },
    usedByEmail: { type: String },
    usedAt: { type: Date },
    // true quando é a própria pessoa consumindo a vaga (outro modelo de
    // moldura pra ela mesma, ver spendFrameCreditForSelfAction) — nesse caso
    // já nasce "used", sem passar por link/token de convite de verdade.
    selfUse: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export type FrameInvite = InferSchemaType<typeof frameInviteSchema> & { _id: string };

export const FrameInviteModel = registerModel("FrameInvite", frameInviteSchema);
