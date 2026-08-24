"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/lib/models/user";
import { TemplateModel } from "@/lib/models/template";
import { deleteAvatar } from "@/lib/save-avatar";
import { deleteTemplateFile } from "@/lib/save-template";
import { deletePreviewPhoto } from "@/lib/save-preview-photo";
import { deleteCover } from "@/lib/save-cover";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export type UpdateUserState = { error: string } | { success: true } | null;

export async function updateUserAction(
  userId: string,
  _prevState: UpdateUserState,
  formData: FormData
): Promise<UpdateUserState> {
  if (!(await isAdminAuthenticated())) return { error: "Sessão de admin expirada." };

  const name = String(formData.get("name") ?? "").trim();
  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase()
    .replace(/^@/, "");
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const whatsapp = String(formData.get("whatsapp") ?? "").trim();
  const plan = String(formData.get("plan") ?? "free");

  if (!name || !username || !email || !whatsapp) {
    return { error: "Preencha todos os campos." };
  }
  if (plan !== "free" && plan !== "premium") {
    return { error: "Plano inválido." };
  }

  await connectDB();

  const existing = await UserModel.findOne({
    _id: { $ne: userId },
    $or: [{ email }, { username }],
  }).select("_id");
  if (existing) {
    return { error: "Já existe outra conta com esse email ou username." };
  }

  const update: Record<string, unknown> = { name, username, email, whatsapp, plan };
  if (plan === "premium") {
    const current = await UserModel.findById(userId).select("plan premiumSince");
    if (current?.plan !== "premium") update.premiumSince = new Date();
  } else {
    update.premiumSince = undefined;
  }

  await UserModel.findByIdAndUpdate(userId, update);

  revalidatePath("/admin/criadores");
  return { success: true };
}

export async function deleteUserAction(userId: string) {
  if (!(await isAdminAuthenticated())) return;

  await connectDB();
  const user = await UserModel.findById(userId).select("photoUrl previewPhotoUrl coverUrl");
  if (!user) return;

  const templates = await TemplateModel.find({ userId }).select("imageUrl");
  for (const template of templates) {
    await deleteTemplateFile(template.imageUrl);
  }
  await TemplateModel.deleteMany({ userId });
  await deleteAvatar(user.photoUrl);
  if (user.previewPhotoUrl) await deletePreviewPhoto(user.previewPhotoUrl);
  if (user.coverUrl) await deleteCover(user.coverUrl);
  await UserModel.findByIdAndDelete(userId);

  revalidatePath("/admin/criadores");
  redirect("/admin/criadores");
}
