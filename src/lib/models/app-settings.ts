import { Schema, type InferSchemaType } from "mongoose";
import { registerModel } from "@/lib/models/register-model";

// Documento único (singleton) com chave fixa — sem isso teria que resolver
// "qual documento é o certo" toda leitura.
const appSettingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "global" },
    premiumPriceCents: { type: Number },
    presidenciaveisPriceCents: { type: Number },
  },
  { timestamps: true }
);

export type AppSettings = InferSchemaType<typeof appSettingsSchema> & { _id: string };

export const AppSettingsModel = registerModel("AppSettings", appSettingsSchema);
