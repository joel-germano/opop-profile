"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/lib/models/user";
import { createSession, createPendingGoogleSignup } from "@/lib/auth";
import { verifyGoogleIdToken } from "@/lib/google-verify";

export type LoginState = { error: string } | null;

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const senha = String(formData.get("senha") ?? "");

  if (!email || !senha) {
    return { error: "Preencha email e senha." };
  }

  await connectDB();
  const user = await UserModel.findOne({ email });
  if (!user) {
    return { error: "Email ou senha incorretos." };
  }
  if (!user.passwordHash) {
    return { error: "Essa conta usa login com Google. Entre pelo botão do Google." };
  }

  const senhaValida = await bcrypt.compare(senha, user.passwordHash);
  if (!senhaValida) {
    return { error: "Email ou senha incorretos." };
  }

  await createSession(String(user._id));
  redirect("/painel");
}

export type GoogleAuthState = { error: string } | null;

export async function loginOrRegisterWithGoogleAction(idToken: string): Promise<GoogleAuthState> {
  const googleUser = await verifyGoogleIdToken(idToken);
  if (!googleUser) return { error: "Não foi possível validar o login do Google." };

  await connectDB();
  const existing = await UserModel.findOne({
    $or: [{ googleId: googleUser.googleId }, { email: googleUser.email }],
  });

  if (existing) {
    if (!existing.googleId) {
      existing.googleId = googleUser.googleId;
      await existing.save();
    }
    await createSession(String(existing._id));
    redirect("/painel");
  }

  // Ainda faltam username/whatsapp/foto — guarda o que o Google confirmou e
  // manda pra tela que completa o resto antes de criar a conta de verdade.
  await createPendingGoogleSignup({
    email: googleUser.email,
    name: googleUser.name,
    googleId: googleUser.googleId,
  });
  redirect("/cadastro/completar");
}
