import { getPremiumPriceCents, getPresidenciaveisPriceCents } from "@/lib/premium-price";
import { AdminSettingsForm } from "@/components/AdminSettingsForm";

export default async function AdminConfiguracoesPage() {
  const [premiumPriceCents, presidenciaveisPriceCents] = await Promise.all([
    getPremiumPriceCents(),
    getPresidenciaveisPriceCents(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Configurações
        </h1>
        <p className="mt-1 text-sm text-white/60">
          Valores usados no checkout — mudar aqui não exige deploy.
        </p>
      </div>

      <AdminSettingsForm
        initialPremiumPriceCents={premiumPriceCents}
        initialPresidenciaveisPriceCents={presidenciaveisPriceCents}
      />
    </div>
  );
}
