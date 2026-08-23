"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/lib/models/user";
import { createSession, createPendingGoogleSignup } from "@/lib/auth";
import { claimDraft } from "@/lib/draft";
import { verifyGoogleIdToken } from "@/lib/google-verify";
import { resolveNextPath } from "@/lib/safe-redirect";

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

  const next = resolveNextPath(String(formData.get("next") ?? ""));
  const claimed = await claimDraft(String(user._id));
  await createSession(String(user._id));
  redirect(next ?? (claimed ? "/painel/sucesso" : "/painel"));
}

export type GoogleAuthState = { error: string } | null;

export async function loginOrRegisterWithGoogleAction(
  idToken: string,
  next?: string | null
): Promise<GoogleAuthState> {
  const googleUser = await verifyGoogleIdToken(idToken);
  if (!googleUser) return { error: "Não foi possível validar o login do Google." };

  const safeNext = resolveNextPath(next);

  await connectDB();
  const existing = await UserModel.findOne({
    $or: [{ googleId: googleUser.googleId }, { email: googleUser.email }],
  });

  if (existing) {
    if (!existing.googleId) {
      existing.googleId = googleUser.googleId;
      await existing.save();
    }
    const claimed = await claimDraft(String(existing._id));
    await createSession(String(existing._id));
    redirect(safeNext ?? (claimed ? "/painel/sucesso" : "/painel"));
  }

  // Ainda faltam username/whatsapp/foto — guarda o que o Google confirmou e
  // manda pra tela que completa o resto antes de criar a conta de verdade.
  await createPendingGoogleSignup({
    email: googleUser.email,
    name: googleUser.name,
    googleId: googleUser.googleId,
    next: safeNext ?? undefined,
  });
  redirect("/cadastro/completar");
}
