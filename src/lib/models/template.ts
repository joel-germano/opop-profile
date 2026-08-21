import { Schema, model, models, type InferSchemaType } from "mongoose";

const templateSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    imageUrl: { type: String, required: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export type Template = InferSchemaType<typeof templateSchema> & { _id: string };

export const TemplateModel = models.Template ?? model("Template", templateSchema);
