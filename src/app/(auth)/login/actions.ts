"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/lib/models/user";
import { createSession } from "@/lib/auth";

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

  const senhaValida = await bcrypt.compare(senha, user.passwordHash);
  if (!senhaValida) {
    return { error: "Email ou senha incorretos." };
  }

  await createSession(String(user._id));
  redirect("/painel");
}
