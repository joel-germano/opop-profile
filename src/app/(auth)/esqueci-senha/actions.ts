"use server";

import { connectDB } from "@/lib/db";
import { UserModel } from "@/lib/models/user";
import { createResetToken } from "@/lib/password-reset";
import { sendPasswordResetEmail } from "@/lib/email";
import { SITE_URL } from "@/lib/site";

export type ForgotPasswordState = { error: string } | { success: true } | null;

export async function requestPasswordResetAction(
  _prevState: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!email) {
    return { error: "Preencha seu email." };
  }

  await connectDB();
  const user = await UserModel.findOne({ email });

  // Conta só-Google não tem senha pra redefinir — avisa direto, do mesmo
  // jeito que o login já faz (ver loginAction), em vez de fingir sucesso.
  if (user && !user.passwordHash) {
    return {
      error: "Essa conta usa login com Google. Entre pelo botão do Google.",
    };
  }

  // Pra email sem conta nenhuma, sempre responde com sucesso — senão dá pra
  // usar essa tela pra descobrir quais emails têm conta na plataforma.
  if (user) {
    const { token, tokenHash, expires } = createResetToken();
    user.resetPasswordTokenHash = tokenHash;
    user.resetPasswordExpires = expires;
    await user.save();

    const resetUrl = `${SITE_URL}/redefinir-senha?token=${token}`;
    await sendPasswordResetEmail(email, resetUrl);
  }

  return { success: true };
}
