import { Schema, type InferSchemaType } from "mongoose";
import { registerModel } from "@/lib/models/register-model";

const templateSchema = new Schema(
  {
    // Um dos dois sempre presente: userId (conta de verdade) ou draftId
    // (rascunho anônimo, antes de logar/cadastrar — ver lib/draft.ts).
    // claimDraft() troca draftId por userId quando a conta é criada.
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    draftId: { type: String },
    imageUrl: { type: String, required: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export type Template = InferSchemaType<typeof templateSchema> & { _id: string };

export const TemplateModel = registerModel("Template", templateSchema);
