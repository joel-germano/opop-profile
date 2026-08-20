import { Schema, model, models, type InferSchemaType } from "mongoose";

const paymentSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    method: { type: String, enum: ["pix", "credit"], required: true },
    amountCents: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "paid", "refunded", "failed"],
      default: "pending",
    },
    // txid (Pix) ou charge_id (cartão) — id da cobrança na Efí.
    externalId: { type: String, required: true, unique: true },
    pixCopiaECola: { type: String },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

export type Payment = InferSchemaType<typeof paymentSchema> & { _id: string };

export const PaymentModel = models.Payment ?? model("Payment", paymentSchema);
