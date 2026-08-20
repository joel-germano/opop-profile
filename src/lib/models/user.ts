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
    whatsapp: { type: String, required: true, trim: true },
    photoUrl: { type: String, required: true },
    passwordHash: { type: String, required: true },
    plan: { type: String, enum: ["free", "premium"], default: "free" },
    premiumSince: { type: Date },
  },
  { timestamps: true }
);

export type User = InferSchemaType<typeof userSchema> & { _id: string };

export const UserModel = models.User ?? model("User", userSchema);
