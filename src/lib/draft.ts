import "server-only";
import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import { TemplateModel } from "@/lib/models/template";
import { CampaignDraftModel } from "@/lib/models/campaign-draft";
import { UserModel } from "@/lib/models/user";
import { deletePreviewPhoto } from "@/lib/save-preview-photo";
import { deleteCover } from "@/lib/save-cover";
import { DRAFT_ID_COOKIE } from "@/lib/constants";

const DRAFT_ID_DURATION_SECONDS = 60 * 60 * 24 * 30; // 30 dias

// Identifica quem ainda não tem conta — dono provisório das molduras e do
// conteúdo da campanha enviados antes de logar/cadastrar. Só lê o cookie,
// nunca cria um novo (usar em Server Components, que não podem escrevê-lo).
export async function getDraftId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(DRAFT_ID_COOKIE)?.value ?? null;
}

// Mesma coisa, mas cria o cookie na hora se ainda não existir — só pode
// rodar em Server Action/Route Handler (onde dá pra escrever cookie).
export async function getOrCreateDraftId(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(DRAFT_ID_COOKIE)?.value;
  if (existing) return existing;

  const id = randomBytes(16).toString("hex");
  cookieStore.set(DRAFT_ID_COOKIE, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DRAFT_ID_DURATION_SECONDS,
  });
  return id;
}

// Lê o rascunho de conteúdo da campanha (passo "Link da campanha" +
// Legenda) do rascunho atual, se existir.
export async function getCampaignDraft() {
  const draftId = await getDraftId();
  if (!draftId) return null;

  await connectDB();
  return CampaignDraftModel.findOne({ draftId }).lean();
}

// Transfere tudo que foi montado em modo rascunho (molduras + título/
// descrição/legenda) pro usuário recém-autenticado — chamar logo depois de
// createSession() em qualquer fluxo de login/cadastro. O username em si já
// devia ter sido usado na criação da conta (ver getCampaignDraft).
//
// Devolve `true` se realmente veio de um rascunho (a pessoa passou pelo
// fluxo de publicação) — os fluxos de login/cadastro usam isso pra saber
// se mandam pra tela de sucesso ou pro /painel normal.
export async function claimDraft(userId: string): Promise<boolean> {
  const draftId = await getDraftId();
  if (!draftId) return false;

  await connectDB();

  await TemplateModel.updateMany(
    { draftId },
    { $set: { userId }, $unset: { draftId: "" } }
  );

  const campaignDraft = await CampaignDraftModel.findOne({ draftId }).lean();
  if (campaignDraft) {
    const update: Record<string, string> = {
      title: campaignDraft.title || "",
      description: campaignDraft.description || "",
      caption: campaignDraft.caption || "",
    };

    // Foto de prévia e capa do rascunho só sobrescrevem as da conta se
    // existirem — senão, logar numa conta que já tinha as suas apagaria à
    // toa. Quando as duas existem, o arquivo antigo sai pra não virar órfão.
    if (campaignDraft.previewPhotoUrl || campaignDraft.coverUrl) {
      const existing = await UserModel.findById(userId)
        .select("previewPhotoUrl coverUrl")
        .lean();

      if (campaignDraft.previewPhotoUrl) {
        if (existing?.previewPhotoUrl) {
          await deletePreviewPhoto(existing.previewPhotoUrl);
        }
        update.previewPhotoUrl = campaignDraft.previewPhotoUrl;
      }

      if (campaignDraft.coverUrl) {
        if (existing?.coverUrl) await deleteCover(existing.coverUrl);
        update.coverUrl = campaignDraft.coverUrl;
        update.coverPreviewPhotoUrl = campaignDraft.coverPreviewPhotoUrl || "";
      }
    }

    await UserModel.findByIdAndUpdate(userId, { $set: update });
    await CampaignDraftModel.deleteOne({ draftId });
  }

  const cookieStore = await cookies();
  cookieStore.delete(DRAFT_ID_COOKIE);
  return true;
}
