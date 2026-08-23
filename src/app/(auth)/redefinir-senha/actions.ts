"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/lib/models/user";
import { createSession } from "@/lib/auth";
import { hashResetToken } from "@/lib/password-reset";

export type ResetPasswordState = { error: string } | null;

export async function resetPasswordAction(
  _prevState: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  const token = String(formData.get("token") ?? "");
  const senha = String(formData.get("senha") ?? "");
  const confirmarSenha = String(formData.get("confirmarSenha") ?? "");

  if (!token) {
    return { error: "Link inválido. Peça um novo link de redefinição." };
  }
  if (!senha || !confirmarSenha) {
    return { error: "Preencha os dois campos de senha." };
  }
  if (senha.length < 6) {
    return { error: "A senha precisa ter pelo menos 6 caracteres." };
  }
  if (senha !== confirmarSenha) {
    return { error: "As senhas não conferem." };
  }

  await connectDB();
  const user = await UserModel.findOne({
    resetPasswordTokenHash: hashResetToken(token),
    resetPasswordExpires: { $gt: new Date() },
  });

  if (!user) {
    return { error: "Esse link expirou ou já foi usado. Peça um novo." };
  }

  user.passwordHash = await bcrypt.hash(senha, 10);
  user.resetPasswordTokenHash = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  await createSession(String(user._id));
  redirect("/painel");
}
