"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/lib/models/user";
import { createSession } from "@/lib/auth";
import { getCampaignDraft, claimDraft } from "@/lib/draft";
import { saveAvatarFromDataUrl } from "@/lib/save-avatar";
import { resolveNextPath } from "@/lib/safe-redirect";
import { generateUniqueUsername } from "@/lib/generate-username";

export type RegisterState = { error: string } | null;

export async function registerAction(
  _prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const name = String(formData.get("name") ?? "").trim();
  const whatsapp = String(formData.get("whatsapp") ?? "").replace(/\D/g, "");
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const senha = String(formData.get("senha") ?? "");
  const photoDataUrl = String(formData.get("photoDataUrl") ?? "");

  // O link (username) normalmente vem do passo "Link da campanha" em
  // /painel, guardado no rascunho antes de existir conta. Mas nem todo mundo
  // passa por ali antes de se cadastrar — quem cria a conta direto ainda não
  // tem link nenhum escolhido, e nesse caso geramos um provisório (ver
  // generateUniqueUsername) pra pessoa trocar depois em /painel.
  const draft = await getCampaignDraft();
  const draftUsername = (draft?.username ?? "").trim().toLowerCase();

  if (!name || !email || !senha) {
    return { error: "Preencha todos os campos." };
  }
  if (!photoDataUrl) {
    return { error: "Escolha uma foto de perfil." };
  }
  if (senha.length < 6) {
    return { error: "A senha precisa ter pelo menos 6 caracteres." };
  }
  if (draftUsername && !/^[a-z0-9_.-]+$/.test(draftUsername)) {
    return {
      error: "Link só pode ter letras minúsculas, números, ponto, _ e -.",
    };
  }

  await connectDB();

  const username = draftUsername || (await generateUniqueUsername(name));

  const existing = await UserModel.findOne({
    $or: [{ email }, { username }],
  }).select("email username");
  if (existing) {
    return {
      error:
        existing.email === email
          ? "Já existe uma conta com esse email."
          : "Esse link já está em uso. Volte e escolha outro.",
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

  const next = resolveNextPath(String(formData.get("next") ?? ""));
  const claimed = await claimDraft(userId);
  await createSession(userId);
  redirect(next ?? (claimed ? "/painel/sucesso" : "/painel"));
}
