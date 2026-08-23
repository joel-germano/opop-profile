"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { destroySession, getCurrentUser } from "@/lib/auth";
import { getDraftId, getOrCreateDraftId } from "@/lib/draft";
import { connectDB } from "@/lib/db";
import { TemplateModel } from "@/lib/models/template";
import { CampaignDraftModel } from "@/lib/models/campaign-draft";
import { UserModel } from "@/lib/models/user";
import { saveTemplateFromDataUrl, deleteTemplateFile } from "@/lib/save-template";
import { deleteAvatar } from "@/lib/save-avatar";
import {
  savePreviewPhotoFromDataUrl,
  deletePreviewPhoto,
} from "@/lib/save-preview-photo";
import { saveCoverFromDataUrl, deleteCover } from "@/lib/save-cover";
import { PAYMENTS_ENABLED, TEMPLATE_LIMITS } from "@/lib/plans";
import { slugifyUsername } from "@/lib/slug";

export async function logoutAction(redirectTo: string = "/login") {
  await destroySession();
  redirect(redirectTo);
}

// Apaga a conta e tudo que só faz sentido junto com ela (molduras, foto de
// perfil). Registros de pagamento (Payment) ficam — são histórico financeiro,
// não pertencem só à conta.
export async function deleteAccountAction() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  await connectDB();

  const templates = await TemplateModel.find({ userId: user._id });
  await Promise.all(templates.map((t) => deleteTemplateFile(t.imageUrl)));
  await TemplateModel.deleteMany({ userId: user._id });

  await deleteAvatar(user.photoUrl);
  if (user.previewPhotoUrl) await deletePreviewPhoto(user.previewPhotoUrl);
  if (user.coverUrl) await deleteCover(user.coverUrl);
  await UserModel.deleteOne({ _id: user._id });

  await destroySession();
  redirect("/");
}

// Dono das molduras: usuário de verdade se tiver sessão, senão o rascunho
// anônimo (cookie). `write` cria o cookie de rascunho na hora se precisar
// (só vale dentro de Server Action); pra leitura (sem escrever cookie) usa
// getDraftId direto, que não cria nada.
async function getOwnerFilter(): Promise<{ userId: string } | { draftId: string }> {
  const user = await getCurrentUser();
  if (user) return { userId: user._id };
  return { draftId: await getOrCreateDraftId() };
}

async function getReadOnlyOwnerFilter(): Promise<
  { userId: string } | { draftId: string } | null
> {
  const user = await getCurrentUser();
  if (user) return { userId: user._id };
  const draftId = await getDraftId();
  return draftId ? { draftId } : null;
}

export type TemplateActionState =
  | { error: string; limitReached?: true }
  | { success: true }
  | null;

export async function addTemplateAction(
  _prevState: TemplateActionState,
  formData: FormData
): Promise<TemplateActionState> {
  const imageDataUrl = String(formData.get("imageDataUrl") ?? "");
  if (!imageDataUrl) return { error: "Escolha uma imagem." };

  await connectDB();
  const owner = await getOwnerFilter();
  const count = await TemplateModel.countDocuments(owner);

  // Limite reforçado aqui, no servidor — a UI já evita mostrar o botão de
  // adicionar acima do limite, mas isso sozinho não impede uma chamada
  // direta à action. Desativado temporariamente (ver PAYMENTS_ENABLED).
  if (PAYMENTS_ENABLED) {
    const user = await getCurrentUser();
    const plan = (user?.plan as "free" | "premium") ?? "free";
    const limit = TEMPLATE_LIMITS[plan] ?? TEMPLATE_LIMITS.free;
    if (count >= limit) {
      return {
        error:
          plan === "free"
            ? "Contas free podem ter só 1 moldura. Torne-se Premium pra adicionar mais."
            : `Limite de ${limit} molduras atingido.`,
        limitReached: true,
      };
    }
  }

  try {
    const imageUrl = await saveTemplateFromDataUrl(imageDataUrl);
    // Novas molduras entram no fim da lista, não em `order: 0` — senão
    // pulariam pra frente de tudo que já foi reordenado manualmente.
    await TemplateModel.create({ ...owner, imageUrl, order: count });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    return {
      error:
        message === "Imagem maior que 1MB"
          ? "A imagem precisa ter no máximo 1MB."
          : "Não foi possível salvar a moldura. Tente novamente.",
    };
  }

  revalidatePath("/painel");
  return { success: true };
}

export async function deleteTemplateAction(templateId: string) {
  const owner = await getReadOnlyOwnerFilter();
  if (!owner) return;

  await connectDB();
  const template = await TemplateModel.findOne({ _id: templateId, ...owner });
  if (!template) return;

  await deleteTemplateFile(template.imageUrl);
  await template.deleteOne();

  revalidatePath("/painel");
}

export async function reorderTemplatesAction(orderedIds: string[]) {
  const owner = await getReadOnlyOwnerFilter();
  if (!owner) return;

  await connectDB();

  // Só reordena molduras que realmente pertencem a esse dono — o array vem
  // do cliente, então não dá pra confiar cegamente nos ids.
  const owned = await TemplateModel.find({
    _id: { $in: orderedIds },
    ...owner,
  }).select("_id");
  const ownedIds = new Set(owned.map((t) => String(t._id)));

  const operations = orderedIds
    .filter((id) => ownedIds.has(id))
    .map((id, index) => ({
      updateOne: {
        filter: { _id: id, ...owner },
        update: { $set: { order: index } },
      },
    }));

  if (operations.length > 0) {
    await TemplateModel.bulkWrite(operations);
  }

  revalidatePath("/painel");
}

export type PreviewPhotoState =
  | { error: string }
  | { success: true; photoUrl: string }
  | null;

// Foto personalizada da prévia do passo "Modelo de legenda". Igual às
// molduras, funciona com ou sem conta: logado grava no próprio User, sem
// conta grava no rascunho (que depois migra junto no claimDraft).
export async function savePreviewPhotoAction(
  dataUrl: string
): Promise<PreviewPhotoState> {
  if (!dataUrl) return { error: "Escolha uma imagem." };

  await connectDB();
  const user = await getCurrentUser();

  let photoUrl: string;
  try {
    photoUrl = await savePreviewPhotoFromDataUrl(dataUrl);
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    return {
      error:
        message === "Imagem maior que 1MB"
          ? "A imagem precisa ter no máximo 1MB."
          : "Não foi possível salvar a foto. Tente novamente.",
    };
  }

  // Só uma foto personalizada por dono — a anterior é apagada do disco pra
  // não acumular arquivo que ninguém mais referencia.
  if (user) {
    if (user.previewPhotoUrl) await deletePreviewPhoto(user.previewPhotoUrl);
    await UserModel.findByIdAndUpdate(user._id, { $set: { previewPhotoUrl: photoUrl } });
  } else {
    const draftId = await getOrCreateDraftId();
    const existing = await CampaignDraftModel.findOne({ draftId })
      .select("previewPhotoUrl")
      .lean();
    if (existing?.previewPhotoUrl) await deletePreviewPhoto(existing.previewPhotoUrl);
    await CampaignDraftModel.findOneAndUpdate(
      { draftId },
      { $set: { previewPhotoUrl: photoUrl } },
      { upsert: true }
    );
  }

  revalidatePath("/painel");
  return { success: true, photoUrl };
}

// Remove a foto personalizada: apaga o arquivo do disco E limpa o campo, nos
// dois donos possíveis. Sem isso o arquivo ficaria órfão em public/uploads.
export async function deletePreviewPhotoAction() {
  await connectDB();
  const user = await getCurrentUser();

  if (user) {
    if (user.previewPhotoUrl) await deletePreviewPhoto(user.previewPhotoUrl);
    await UserModel.findByIdAndUpdate(user._id, { $set: { previewPhotoUrl: "" } });
  } else {
    const draftId = await getDraftId();
    if (!draftId) return;

    const draft = await CampaignDraftModel.findOne({ draftId })
      .select("previewPhotoUrl")
      .lean();
    if (draft?.previewPhotoUrl) await deletePreviewPhoto(draft.previewPhotoUrl);
    await CampaignDraftModel.updateOne({ draftId }, { $set: { previewPhotoUrl: "" } });
  }

  revalidatePath("/painel");
}

export type CoverState = { error: string } | { success: true; coverUrl: string } | null;

// Capa da campanha, refeita a cada "Publicar" (ver compositeCoverDataUrl).
// Como toda gravação gera nome novo, a anterior é apagada aqui — senão cada
// republicação deixaria um arquivo órfão em public/uploads/covers.
// `sourcePhotoUrl` é a foto usada pra montar a capa (persona ou upload) —
// salva junto pra imagem OG poder mostrar a MESMA foto que está dentro da
// capa, em vez de cair pra photoUrl (a do cadastro, que pode ser outra
// pessoa/foto — ver og-image-shared.tsx).
export async function saveCoverAction(
  dataUrl: string,
  sourcePhotoUrl: string
): Promise<CoverState> {
  if (!dataUrl) return { error: "Capa vazia." };

  await connectDB();
  const user = await getCurrentUser();

  let coverUrl: string;
  try {
    coverUrl = await saveCoverFromDataUrl(dataUrl);
  } catch {
    return { error: "Não foi possível gerar a capa da campanha." };
  }

  const update = { coverUrl, coverPreviewPhotoUrl: sourcePhotoUrl };

  if (user) {
    if (user.coverUrl) await deleteCover(user.coverUrl);
    await UserModel.findByIdAndUpdate(user._id, { $set: update });
  } else {
    const draftId = await getOrCreateDraftId();
    const existing = await CampaignDraftModel.findOne({ draftId })
      .select("coverUrl")
      .lean();
    if (existing?.coverUrl) await deleteCover(existing.coverUrl);
    await CampaignDraftModel.findOneAndUpdate(
      { draftId },
      { $set: update },
      { upsert: true }
    );
  }

  revalidatePath("/painel");
  return { success: true, coverUrl };
}

export type PublishDraftState = { error: string } | { success: true } | null;

type PublishInput = {
  title: string;
  description: string;
  username: string;
  caption: string;
};

function validatePublishInput(
  input: PublishInput
): { title: string; username: string; description: string; caption: string } | { error: string } {
  const title = input.title.trim();
  const username = slugifyUsername(input.username);

  if (!title) return { error: "Preencha o título da campanha." };
  if (!username) return { error: "Escolha o link da sua campanha." };
  if (!/^[a-z0-9_.-]+$/.test(username)) {
    return { error: "Link só pode ter letras minúsculas, números, ponto, _ e -." };
  }

  return {
    title,
    username,
    description: input.description.trim(),
    caption: input.caption.trim(),
  };
}

// Chamado ao clicar "Publicar" no último passo, sem sessão — grava título/
// descrição/link/legenda no rascunho (mesmo draftId das molduras). A conta
// em si só nasce depois, no /login ou /cadastro; lá, claimDraft() aplica
// esses campos no usuário recém-criado (ver lib/draft.ts).
export async function savePublishDraftAction(
  input: PublishInput
): Promise<PublishDraftState> {
  const validated = validatePublishInput(input);
  if ("error" in validated) return validated;
  const { title, username, description, caption } = validated;

  await connectDB();

  // Checagem antecipada — a definitiva é feita de novo na hora de criar a
  // conta, mas assim a pessoa já sabe se o link está livre antes de logar.
  const usernameTaken = await UserModel.exists({ username });
  if (usernameTaken) {
    return { error: "Esse link já está em uso. Escolha outro." };
  }

  const draftId = await getOrCreateDraftId();
  await CampaignDraftModel.findOneAndUpdate(
    { draftId },
    { $set: { username, title, description, caption } },
    { upsert: true }
  );

  return { success: true };
}

// Mesma coisa, mas pra quem já está logado — aplica direto na conta, sem
// passar pelo rascunho nem por login/cadastro de novo.
export async function publishForCurrentUserAction(
  input: PublishInput
): Promise<PublishDraftState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sessão expirada. Faça login novamente." };

  const validated = validatePublishInput(input);
  if ("error" in validated) return validated;
  const { title, username, description, caption } = validated;

  await connectDB();

  if (username !== user.username) {
    const usernameTaken = await UserModel.exists({
      username,
      _id: { $ne: user._id },
    });
    if (usernameTaken) {
      return { error: "Esse link já está em uso. Escolha outro." };
    }
  }

  await UserModel.findByIdAndUpdate(user._id, {
    $set: { username, title, description, caption },
  });

  revalidatePath("/painel");
  return { success: true };
}
