import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { TEMPLATE_LIMITS } from "@/lib/plans";
import { getPremiumPriceCents } from "@/lib/premium-price";
import { CheckoutForm } from "@/components/CheckoutForm";
import { BackButton } from "@/components/BackButton";
import { formatBrl } from "@/lib/card-format";

export default async function CheckoutPage() {
  const user = await getCurrentUser();

  // /painel não exige mais login (ver painel/layout.tsx), mas essa tela
  // continua exigindo conta de verdade — se protege sozinha.
  if (!user) redirect("/login?next=%2Fpainel%2Fcheckout");

  if (user.plan === "premium") {
    return (
      <div className="flex flex-col gap-6">
        <BackButton />

        <div className="flex flex-col items-center gap-4 rounded-3xl bg-success/10 p-6 text-center ring-1 ring-success/30">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success text-white">
            <Check size={28} strokeWidth={2.5} />
          </span>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">
              Você já é Premium
            </h1>
            <p className="mt-1 text-sm text-white/60">
              Obrigado pelo apoio! Sua conta já tem molduras ilimitadas.
            </p>
          </div>
          <Link
            href="/painel"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-bold text-black transition active:scale-[0.98] hover:bg-brand-light"
          >
            Voltar ao painel
            <ArrowRight size={16} strokeWidth={2.5} />
          </Link>
        </div>
      </div>
    );
  }

  const efiEnvironment = process.env.GN_ENDPOINT?.includes("-h.") ? "sandbox" : "production";
  const premiumPriceCents = await getPremiumPriceCents();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <BackButton />
        <h1 className="mt-4 text-lg font-bold tracking-tight text-white">
          Tornar-se Premium
        </h1>
      </div>

      {/* Resumo do pedido sempre visível: o valor não pode depender de a
          pessoa lembrar do que leu na tela anterior. */}
      <div className="flex items-center gap-4 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-brand to-brand-light text-black">
          <Sparkles size={20} strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white">Opop Premium</p>
          <p className="text-xs text-white/50">
            Molduras ilimitadas · hoje você tem {TEMPLATE_LIMITS.free}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-base font-bold text-white">
            R$ {formatBrl(premiumPriceCents)}
          </p>
          <p className="text-xs text-white/40">/mês</p>
        </div>
      </div>

      <CheckoutForm
        gnClientId={process.env.GN_ACCOUNT_ID ?? ""}
        efiEnvironment={efiEnvironment}
        priceCents={premiumPriceCents}
      />
    </div>
  );
}
