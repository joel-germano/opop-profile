"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/lib/models/user";
import { getCurrentUser } from "@/lib/auth";
import { saveAvatarFromDataUrl, deleteAvatar } from "@/lib/save-avatar";

export type UpdateProfileState = { error: string } | { success: true } | null;

export async function updateProfileAction(
  _prevState: UpdateProfileState,
  formData: FormData
): Promise<UpdateProfileState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sessão expirada, faça login novamente." };

  const name = String(formData.get("name") ?? "").trim();
  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase()
    .replace(/^@/, "");
  const whatsapp = String(formData.get("whatsapp") ?? "").trim();
  const photoDataUrl = String(formData.get("photoDataUrl") ?? "");

  if (!name || !username || !whatsapp) {
    return { error: "Preencha todos os campos." };
  }
  if (!/^[a-z0-9_.]+$/.test(username)) {
    return {
      error: "Username só pode ter letras minúsculas, números, ponto e _.",
    };
  }

  await connectDB();

  const existing = await UserModel.findOne({
    username,
    _id: { $ne: user._id },
  }).select("_id");
  if (existing) {
    return { error: "Esse username já está em uso." };
  }

  const update: { name: string; username: string; whatsapp: string; photoUrl?: string } = {
    name,
    username,
    whatsapp,
  };

  try {
    if (photoDataUrl) {
      update.photoUrl = await saveAvatarFromDataUrl(photoDataUrl);
    }

    await UserModel.findByIdAndUpdate(user._id, update);

    if (update.photoUrl) {
      await deleteAvatar(user.photoUrl);
    }
  } catch {
    return { error: "Não foi possível salvar. Tente novamente." };
  }

  revalidatePath("/painel", "layout");
  return { success: true };
}
