"use server";

import { redirect } from "next/navigation";
import { verifyAdminCredentials, createAdminSession } from "@/lib/admin-auth";

export type AdminLoginState = { error: string } | null;

export async function loginAdminAction(
  _prevState: AdminLoginState,
  formData: FormData
): Promise<AdminLoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { error: "Preencha usuário e senha." };
  }

  if (!verifyAdminCredentials(username, password)) {
    return { error: "Usuário ou senha incorretos." };
  }

  await createAdminSession();
  redirect("/admin");
}
