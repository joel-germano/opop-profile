import { Schema, type InferSchemaType } from "mongoose";
import { registerModel } from "@/lib/models/register-model";

// Cobrança paralela ao Payment (que é do fluxo Premium/User) — paga uma vez,
// desbloqueia a Supporter pra sempre (não é por candidato/geração).
const supporterPurchaseSchema = new Schema(
  {
    supporterId: { type: Schema.Types.ObjectId, ref: "Supporter", required: true },
    method: { type: String, enum: ["pix", "credit"], required: true },
    amountCents: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "paid", "refunded", "failed"],
      default: "pending",
    },
    externalId: { type: String, required: true, unique: true },
    pixCopiaECola: { type: String },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

export type SupporterPurchase = InferSchemaType<typeof supporterPurchaseSchema> & {
  _id: string;
};

export const SupporterPurchaseModel =
  registerModel("SupporterPurchase", supporterPurchaseSchema);
