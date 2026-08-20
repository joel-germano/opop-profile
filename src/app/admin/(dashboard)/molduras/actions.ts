"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { TemplateModel } from "@/lib/models/template";
import { saveTemplateFromDataUrl, deleteTemplateFile } from "@/lib/save-template";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export type TemplateAdminState = { error: string } | { success: true } | null;

export async function replaceTemplateImageAction(
  templateId: string,
  _prevState: TemplateAdminState,
  formData: FormData
): Promise<TemplateAdminState> {
  if (!(await isAdminAuthenticated())) return { error: "Sessão de admin expirada." };

  const imageDataUrl = String(formData.get("imageDataUrl") ?? "");
  if (!imageDataUrl) return { error: "Escolha uma imagem." };

  await connectDB();
  const template = await TemplateModel.findById(templateId);
  if (!template) return { error: "Moldura não encontrada." };

  try {
    const newImageUrl = await saveTemplateFromDataUrl(imageDataUrl);
    const oldImageUrl = template.imageUrl;
    template.imageUrl = newImageUrl;
    await template.save();
    await deleteTemplateFile(oldImageUrl);
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    return {
      error:
        message === "Imagem maior que 1MB"
          ? "A imagem precisa ter no máximo 1MB."
          : "Não foi possível salvar a moldura.",
    };
  }

  revalidatePath("/admin/molduras");
  return { success: true };
}

export async function deleteTemplateAdminAction(templateId: string) {
  if (!(await isAdminAuthenticated())) return;

  await connectDB();
  const template = await TemplateModel.findById(templateId);
  if (!template) return;

  await deleteTemplateFile(template.imageUrl);
  await template.deleteOne();

  revalidatePath("/admin/molduras");
}
