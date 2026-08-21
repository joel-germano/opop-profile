import { Schema, model, models, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    whatsapp: { type: String, trim: true, default: "" },
    photoUrl: { type: String, required: true },
    // Opcional: contas criadas via Google podem não ter senha — login só
    // pelo Google até o usuário decidir cadastrar uma (não implementado).
    passwordHash: { type: String },
    googleId: { type: String },
    plan: { type: String, enum: ["free", "premium"], default: "free" },
    premiumSince: { type: Date },
  },
  { timestamps: true }
);

export type User = InferSchemaType<typeof userSchema> & { _id: string };

export const UserModel = models.User ?? model("User", userSchema);
