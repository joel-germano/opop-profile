"use server";

import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/lib/models/user";
import {
  createSession,
  getPendingGoogleSignup,
  clearPendingGoogleSignup,
} from "@/lib/auth";
import { saveAvatarFromDataUrl } from "@/lib/save-avatar";

export type CompleteSignupState = { error: string } | null;

export async function completeGoogleSignupAction(
  _prevState: CompleteSignupState,
  formData: FormData
): Promise<CompleteSignupState> {
  const pending = await getPendingGoogleSignup();
  if (!pending) {
    return { error: "Sessão expirada. Volte e entre com o Google de novo." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase()
    .replace(/^@/, "");
  const whatsapp = String(formData.get("whatsapp") ?? "").trim();
  const photoDataUrl = String(formData.get("photoDataUrl") ?? "");

  if (!name || !username) {
    return { error: "Preencha todos os campos." };
  }
  if (!photoDataUrl) {
    return { error: "Escolha uma foto de perfil." };
  }
  if (!/^[a-z0-9_.-]+$/.test(username)) {
    return {
      error: "Username só pode ter letras minúsculas, números, ponto, _ e -.",
    };
  }

  await connectDB();

  const existing = await UserModel.findOne({
    $or: [{ email: pending.email }, { username }],
  }).select("email username");
  if (existing) {
    return {
      error:
        existing.email === pending.email
          ? "Já existe uma conta com esse email."
          : "Esse username já está em uso.",
    };
  }

  let userId: string;
  try {
    const photoUrl = await saveAvatarFromDataUrl(photoDataUrl);

    const user = await UserModel.create({
      name,
      username,
      whatsapp,
      email: pending.email,
      googleId: pending.googleId,
      photoUrl,
    });
    userId = String(user._id);
  } catch {
    return { error: "Não foi possível criar a conta. Tente novamente." };
  }

  await clearPendingGoogleSignup();
  await createSession(userId);
  redirect("/painel");
}
