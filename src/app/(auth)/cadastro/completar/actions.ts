"use server";

import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/lib/models/user";
import {
  createSession,
  getPendingGoogleSignup,
  clearPendingGoogleSignup,
} from "@/lib/auth";
import { getCampaignDraft, claimDraft } from "@/lib/draft";
import { saveAvatarFromDataUrl } from "@/lib/save-avatar";
import { resolveNextPath } from "@/lib/safe-redirect";
import { generateUniqueUsername } from "@/lib/generate-username";

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
  const whatsapp = String(formData.get("whatsapp") ?? "").replace(/\D/g, "");
  const photoDataUrl = String(formData.get("photoDataUrl") ?? "");

  // O link (username) normalmente vem do passo "Link da campanha" em
  // /painel, guardado no rascunho antes de existir conta. Quem cria a conta
  // direto pelo Google sem passar por ali ainda não tem link escolhido — aí
  // geramos um provisório (ver generateUniqueUsername) pra trocar depois.
  const draft = await getCampaignDraft();
  const draftUsername = (draft?.username ?? "").trim().toLowerCase();

  if (!name) {
    return { error: "Preencha todos os campos." };
  }
  if (!photoDataUrl) {
    return { error: "Escolha uma foto de perfil." };
  }
  if (draftUsername && !/^[a-z0-9_.-]+$/.test(draftUsername)) {
    return {
      error: "Link só pode ter letras minúsculas, números, ponto, _ e -.",
    };
  }

  await connectDB();

  const username = draftUsername || (await generateUniqueUsername(name));

  const existing = await UserModel.findOne({
    $or: [{ email: pending.email }, { username }],
  }).select("email username");
  if (existing) {
    return {
      error:
        existing.email === pending.email
          ? "Já existe uma conta com esse email."
          : "Esse link já está em uso. Volte e escolha outro.",
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
  const next = resolveNextPath(pending.next);
  const claimed = await claimDraft(userId);
  await createSession(userId);
  redirect(next ?? (claimed ? "/painel/sucesso" : "/painel"));
}
