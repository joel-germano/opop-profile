"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { AppSettingsModel } from "@/lib/models/app-settings";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export type UpdateSettingsState = { error: string } | { success: true } | null;

function parsePriceCents(raw: FormDataEntryValue | null): number | null {
  const reais = String(raw ?? "")
    .trim()
    .replace(",", ".");
  const cents = Math.round(Number(reais) * 100);
  return Number.isFinite(cents) && cents > 0 ? cents : null;
}

export async function updatePremiumPriceAction(
  _prevState: UpdateSettingsState,
  formData: FormData
): Promise<UpdateSettingsState> {
  if (!(await isAdminAuthenticated())) return { error: "Sessão de admin expirada." };

  const priceCents = parsePriceCents(formData.get("premiumPrice"));
  if (priceCents === null) return { error: "Informe um valor válido." };

  await connectDB();
  await AppSettingsModel.findOneAndUpdate(
    { key: "global" },
    { premiumPriceCents: priceCents },
    { upsert: true }
  );

  revalidatePath("/admin/configuracoes");
  revalidatePath("/painel");
  revalidatePath("/painel/checkout");
  return { success: true };
}

export async function updatePresidenciaveisPriceAction(
  _prevState: UpdateSettingsState,
  formData: FormData
): Promise<UpdateSettingsState> {
  if (!(await isAdminAuthenticated())) return { error: "Sessão de admin expirada." };

  const priceCents = parsePriceCents(formData.get("presidenciaveisPrice"));
  if (priceCents === null) return { error: "Informe um valor válido." };

  await connectDB();
  await AppSettingsModel.findOneAndUpdate(
    { key: "global" },
    { presidenciaveisPriceCents: priceCents },
    { upsert: true }
  );

  revalidatePath("/admin/configuracoes");
  revalidatePath("/presidenciaveis/[slug]", "page");
  return { success: true };
}
