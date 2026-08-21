"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { TemplateModel } from "@/lib/models/template";
import { getCurrentUser } from "@/lib/auth";
import { saveTemplateFromDataUrl, deleteTemplateFile } from "@/lib/save-template";
import { TEMPLATE_LIMITS } from "@/lib/plans";

export type TemplateActionState = { error: string } | { success: true } | null;

export async function addTemplateAction(
  _prevState: TemplateActionState,
  formData: FormData
): Promise<TemplateActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sessão expirada, faça login novamente." };

  const imageDataUrl = String(formData.get("imageDataUrl") ?? "");
  if (!imageDataUrl) return { error: "Escolha uma imagem." };

  await connectDB();

  // Limite reforçado aqui, no servidor — a UI já evita mostrar o botão de
  // adicionar acima do limite, mas isso sozinho não impede uma chamada
  // direta à action.
  const limit = TEMPLATE_LIMITS[user.plan as "free" | "premium"] ?? TEMPLATE_LIMITS.free;
  const count = await TemplateModel.countDocuments({ userId: user._id });
  if (count >= limit) {
    return {
      error:
        user.plan === "free"
          ? "Contas free podem ter só 1 moldura. Torne-se Premium pra adicionar mais."
          : `Limite de ${limit} molduras atingido.`,
    };
  }

  try {
    const imageUrl = await saveTemplateFromDataUrl(imageDataUrl);
    // Novas molduras entram no fim da lista, não em `order: 0` — senão
    // pulariam pra frente de tudo que o usuário já reordenou manualmente.
    await TemplateModel.create({ userId: user._id, imageUrl, order: count });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    return {
      error:
        message === "Imagem maior que 1MB"
          ? "A imagem precisa ter no máximo 1MB."
          : "Não foi possível salvar a moldura. Tente novamente.",
    };
  }

  revalidatePath("/painel/configuracoes");
  return { success: true };
}

export async function deleteTemplateAction(templateId: string) {
  const user = await getCurrentUser();
  if (!user) return;

  await connectDB();
  const template = await TemplateModel.findOne({ _id: templateId, userId: user._id });
  if (!template) return;

  await deleteTemplateFile(template.imageUrl);
  await template.deleteOne();

  revalidatePath("/painel/configuracoes");
}

export async function reorderTemplatesAction(orderedIds: string[]) {
  const user = await getCurrentUser();
  if (!user) return;

  await connectDB();

  // Só reordena molduras que realmente pertencem ao usuário — o array vem
  // do cliente, então não dá pra confiar cegamente nos ids.
  const owned = await TemplateModel.find({
    _id: { $in: orderedIds },
    userId: user._id,
  }).select("_id");
  const ownedIds = new Set(owned.map((t) => String(t._id)));

  const operations = orderedIds
    .filter((id) => ownedIds.has(id))
    .map((id, index) => ({
      updateOne: {
        filter: { _id: id, userId: user._id },
        update: { $set: { order: index } },
      },
    }));

  if (operations.length > 0) {
    await TemplateModel.bulkWrite(operations);
  }

  revalidatePath("/painel/configuracoes");
}
