"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, Sparkles, X } from "lucide-react";
import { TEMPLATE_LIMITS } from "@/lib/plans";

type Props = {
  priceCents: number;
  isLoggedIn: boolean;
  onClose: () => void;
};

// Aparece quando uma conta free tenta enviar a 2ª moldura — o "Atualizar"
// manda pro checkout já existente, passando primeiro por login/cadastro
// (com `next=/painel/checkout`) se a pessoa ainda não tiver conta.
export function PremiumUpsellModal({ priceCents, isLoggedIn, onClose }: Props) {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleUpgrade = () => {
    if (isLoggedIn) {
      router.push("/painel/checkout");
      return;
    }
    router.push(`/cadastro?next=${encodeURIComponent("/painel/checkout")}`);
  };

  // Separado pra dar hierarquia tipográfica no preço: "R$" e os centavos
  // ficam pequenos, o valor cheio domina.
  const reais = Math.floor(priceCents / 100);
  const cents = String(priceCents % 100).padStart(2, "0");

  // Vem do mesmo lugar que a regra de verdade (ver addTemplateAction), pra
  // o texto nunca desencontrar do limite realmente aplicado.
  const freeLimit = TEMPLATE_LIMITS.free;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="premium-modal-title"
      className="fixed inset-0 z-70 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-sm flex-col overflow-y-auto rounded-t-3xl bg-[#1c1c1c] shadow-2xl shadow-black/60 ring-1 ring-white/10 sm:rounded-3xl"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <button
          type="button"
          aria-label="Fechar"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 transition active:scale-90 hover:bg-white/20 hover:text-white"
        >
          <X size={15} strokeWidth={2} />
        </button>

        {/* Puxador do bottom sheet — só no mobile, onde o modal sobe de baixo */}
        <div className="flex justify-center pb-1 pt-2.5 sm:hidden">
          <div className="h-1 w-9 rounded-full bg-white/20" />
        </div>

        <div className="flex flex-col items-center gap-5 px-6 pb-6 pt-6 text-center sm:pb-8">
          <div className="relative flex h-16 w-16 items-center justify-center">
            <div
              aria-hidden
              className="absolute inset-0 rounded-full bg-brand/25 blur-xl"
            />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-brand to-brand-light text-black">
              <Sparkles size={28} strokeWidth={2} />
            </div>
          </div>

          <div>
            <p className="text-xs font-bold tracking-widest text-brand-light uppercase">
              Premium
            </p>
            <h2
              id="premium-modal-title"
              className="mt-2 text-xl font-bold tracking-tight text-white"
            >
              Molduras ilimitadas pra sua campanha
            </h2>
          </div>

          {/* Comparação enxuta em vez de parágrafo: deixa a diferença entre
              os planos explícita de bater o olho. */}
          <div className="flex w-full items-stretch gap-2">
            <div className="flex-1 rounded-2xl bg-white/5 px-3 py-3">
              <p className="text-[11px] font-semibold tracking-wide text-white/40 uppercase">
                Free
              </p>
              <p className="mt-1 text-sm font-medium text-white/60">
                {freeLimit} moldura
              </p>
            </div>
            <div className="flex-1 rounded-2xl bg-brand/10 px-3 py-3 ring-1 ring-brand/30">
              <p className="text-[11px] font-semibold tracking-wide text-brand-light uppercase">
                Premium
              </p>
              <p className="mt-1 flex items-center justify-center gap-1 text-sm font-bold text-white">
                <Check size={14} strokeWidth={3} className="text-brand-light" />
                Ilimitadas
              </p>
            </div>
          </div>

          <div className="flex items-baseline justify-center gap-0.5">
            <span className="text-xl font-semibold text-white/70">R$</span>
            <span className="text-5xl font-bold tracking-tight text-white">
              {reais}
            </span>
            <span className="text-xl font-semibold text-white/70">
              ,{cents}
            </span>
            <span className="ml-1 text-sm font-medium text-white/40">/mês</span>
          </div>

          <div className="flex w-full flex-col gap-3">
            <button
              type="button"
              onClick={handleUpgrade}
              className="flex h-13 w-full items-center justify-center gap-2 rounded-full bg-brand text-base font-bold text-black transition active:scale-[0.98] hover:bg-brand-light"
            >
              <Sparkles size={18} strokeWidth={2.5} />
              Quero ser Premium
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-semibold text-white/50 transition hover:text-white"
            >
              Agora não
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
