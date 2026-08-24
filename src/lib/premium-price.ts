import { connectDB } from "@/lib/db";
import { AppSettingsModel } from "@/lib/models/app-settings";
import { DEFAULT_PREMIUM_PRICE_CENTS } from "@/lib/plans";
import { DEFAULT_PRESIDENCIAVEIS_PRICE_CENTS } from "@/lib/presidenciaveis-constants";

// Fica num arquivo separado de plans.ts porque puxa o mongoose (connectDB) —
// plans.ts é importado por componentes client (PremiumUpsellModal) e não
// pode carregar nada server-only, senão o build do Turbopack quebra tentando
// empacotar módulos Node (fs, net, tls...) pro navegador.
export async function getPremiumPriceCents(): Promise<number> {
  await connectDB();
  const settings = await AppSettingsModel.findOne({ key: "global" }).select(
    "premiumPriceCents"
  );
  return settings?.premiumPriceCents ?? DEFAULT_PREMIUM_PRICE_CENTS;
}

export async function getPresidenciaveisPriceCents(): Promise<number> {
  await connectDB();
  const settings = await AppSettingsModel.findOne({ key: "global" }).select(
    "presidenciaveisPriceCents"
  );
  return settings?.presidenciaveisPriceCents ?? DEFAULT_PRESIDENCIAVEIS_PRICE_CENTS;
}
