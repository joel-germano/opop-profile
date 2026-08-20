"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/lib/models/user";
import { createSession } from "@/lib/auth";
import { saveAvatarFromDataUrl } from "@/lib/save-avatar";

export type RegisterState = { error: string } | null;

export async function registerAction(
  _prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const name = String(formData.get("name") ?? "").trim();
  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase()
    .replace(/^@/, "");
  const whatsapp = String(formData.get("whatsapp") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const senha = String(formData.get("senha") ?? "");
  const confirmarSenha = String(formData.get("confirmarSenha") ?? "");
  const photoDataUrl = String(formData.get("photoDataUrl") ?? "");

  if (!name || !username || !whatsapp || !email || !senha) {
    return { error: "Preencha todos os campos." };
  }
  if (!photoDataUrl) {
    return { error: "Escolha uma foto de perfil." };
  }
  if (senha.length < 6) {
    return { error: "A senha precisa ter pelo menos 6 caracteres." };
  }
  if (senha !== confirmarSenha) {
    return { error: "As senhas não conferem." };
  }
  if (!/^[a-z0-9_.]+$/.test(username)) {
    return {
      error: "Username só pode ter letras minúsculas, números, ponto e _.",
    };
  }

  await connectDB();

  const existing = await UserModel.findOne({
    $or: [{ email }, { username }],
  }).select("email username");
  if (existing) {
    return {
      error:
        existing.email === email
          ? "Já existe uma conta com esse email."
          : "Esse username já está em uso.",
    };
  }

  const passwordHash = await bcrypt.hash(senha, 10);

  let userId: string;
  try {
    const photoUrl = await saveAvatarFromDataUrl(photoDataUrl);
    const user = await UserModel.create({
      name,
      username,
      whatsapp,
      email,
      photoUrl,
      passwordHash,
    });
    userId = String(user._id);
  } catch {
    return { error: "Não foi possível criar a conta. Tente novamente." };
  }

  await createSession(userId);
  redirect("/painel");
}
