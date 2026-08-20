"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
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
  const senha = String(formData.get("senha") ?? "");
  const photoDataUrl = String(formData.get("photoDataUrl") ?? "");

  if (!name || !username || !whatsapp) {
    return { error: "Preencha todos os campos." };
  }
  if (!photoDataUrl) {
    return { error: "Escolha uma foto de perfil." };
  }
  if (senha && senha.length < 6) {
    return { error: "A senha precisa ter pelo menos 6 caracteres (ou deixe em branco)." };
  }
  if (!/^[a-z0-9_.]+$/.test(username)) {
    return {
      error: "Username só pode ter letras minúsculas, números, ponto e _.",
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
    const passwordHash = senha ? await bcrypt.hash(senha, 10) : undefined;

    const user = await UserModel.create({
      name,
      username,
      whatsapp,
      email: pending.email,
      googleId: pending.googleId,
      photoUrl,
      passwordHash,
    });
    userId = String(user._id);
  } catch {
    return { error: "Não foi possível criar a conta. Tente novamente." };
  }

  await clearPendingGoogleSignup();
  await createSession(userId);
  redirect("/painel");
}
