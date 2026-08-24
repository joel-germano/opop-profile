import { Images } from "lucide-react";
import { HomeShowcaseCarousel } from "@/components/HomeShowcaseCarousel";
import { SHOWCASE_ITEMS } from "@/lib/showcase-items";

// Mesmo carrossel da home (reaproveitado, não duplicado), só que aqui vira
// vitrine: "isso já foi feito por gente de verdade" antes de explicar o
// porquê do placar, na seção logo abaixo.
export function PresidenciaveisGallery() {
  return (
    <section className="w-full">
      <div className="px-6 text-center">
        <span className="text-xs font-bold uppercase tracking-wide text-decor-coral">
          Galeria de apoio
        </span>
        <h2 className="mt-2 font-display text-2xl font-normal leading-tight tracking-wide text-white">
          Molduras que já ganharam rosto
        </h2>
        <p className="mt-3 text-base leading-snug text-white/60">
          Cada arte aqui é de alguém que já confirmou o apoio e está
          ajudando a levar seu candidato ao topo do placar.
        </p>
      </div>

      <div className="mt-6">
        <HomeShowcaseCarousel items={SHOWCASE_ITEMS} hideDetails />
      </div>

      {/* Sem onClick de propósito — visual pronto, a galeria completa ainda
          não tem pra onde levar (mesmo padrão do botão no card de
          apoiadores, logo acima). */}
      <div className="mt-4 px-6">
        <button
          type="button"
          className="flex w-full items-center justify-center gap-1.5 rounded-full bg-danger/10 py-3 text-xs font-bold text-danger-light transition active:scale-95 hover:bg-danger/15"
        >
          <Images size={15} strokeWidth={2} />
          Ver galeria completa
        </button>
      </div>
    </section>
  );
}
