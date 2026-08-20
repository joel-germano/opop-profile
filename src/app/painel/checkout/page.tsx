import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { PREMIUM_PRICE_CENTS } from "@/lib/plans";
import { CheckoutForm } from "@/components/CheckoutForm";

export default async function CheckoutPage() {
  const user = await getCurrentUser();

  if (!user) return null; // já redirecionado pelo layout/proxy do /painel

  if (user.plan === "premium") {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="font-heading text-3xl font-normal tracking-wide text-white">
          Você já é Premium
        </h1>
        <p className="text-base text-white/60">
          Obrigado pelo apoio! Sua conta já está no plano Premium.
        </p>
        <Link
          href="/painel"
          className="flex h-14 w-full max-w-xs items-center justify-center rounded-full bg-brand text-base font-semibold text-black transition active:scale-95 hover:bg-brand-light"
        >
          Voltar ao painel
        </Link>
      </div>
    );
  }

  const efiEnvironment = process.env.GN_ENDPOINT?.includes("-h.") ? "sandbox" : "production";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-3xl font-normal tracking-wide text-white">
          Tornar-se Premium
        </h1>
        <p className="mt-2 text-base text-white/60">
          Apoie o projeto e desbloqueie os recursos Premium por{" "}
          <span className="font-bold text-brand-light">
            R$ {(PREMIUM_PRICE_CENTS / 100).toFixed(2).replace(".", ",")}
          </span>
          .
        </p>
      </div>

      <CheckoutForm gnClientId={process.env.GN_ACCOUNT_ID ?? ""} efiEnvironment={efiEnvironment} />
    </div>
  );
}
