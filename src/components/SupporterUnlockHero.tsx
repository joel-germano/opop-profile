import Image from "next/image";
import { X } from "lucide-react";

const ICON_ROWS = 6;
const ICONS_PER_ROW = 6;

// Cabeçalho do checkout — substitui o título "Desbloquear" genérico por um
// visual que já vende o porquê (candidato no topo do placar) e mostra o
// preço de cara. Fundo com o ícone de moldura repetido em linhas que andam
// em loop infinito (mesma técnica de AvatarCarousel.tsx: lista duplicada +
// translateX(-50%), sem salto no loop), alternando direção por linha.
//
// `compact` reusa o mesmo fundo/logo em versão reduzida (sem preço) como CTA
// acima do card de pagamento, na etapa "pay" — quem chega ali já viu o preço
// na etapa de identificação, então esse cabeçalho é só reforço visual.
export function SupporterUnlockHero({
  priceCents,
  onClose,
  compact = false,
}: {
  priceCents?: number;
  onClose: () => void;
  compact?: boolean;
}) {
  const reais = priceCents !== undefined ? Math.floor(priceCents / 100) : 0;
  const cents = priceCents !== undefined ? String(priceCents % 100).padStart(2, "0") : "00";
  const rows = compact ? 3 : ICON_ROWS;

  return (
    <div
      className={`relative shrink-0 overflow-hidden bg-secondary text-center ${
        compact ? "px-6 pb-5 pt-5" : "px-6 pb-8 pt-6"
      }`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex flex-col justify-center gap-2 opacity-15"
      >
        {Array.from({ length: rows }).map((_, row) => (
          <div
            key={row}
            className={`flex w-fit flex-none gap-2 ${
              row % 2 === 0 ? "animate-marquee-left" : "animate-marquee-right"
            }`}
          >
            {Array.from({ length: ICONS_PER_ROW * 2 }).map((_, i) => (
              <Image
                key={i}
                src="/icone-moldura.svg"
                alt=""
                width={compact ? 48 : 80}
                height={compact ? 48 : 80}
                className="flex-none"
              />
            ))}
          </div>
        ))}
      </div>

      {/* Apaga os ícones de baixo pra cima — embaixo eles somem no fundo
          roxo, em cima ficam visíveis normalmente. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-linear-to-t from-secondary from-0% to-transparent to-65%"
      />

      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/20 text-white transition active:scale-90 hover:bg-black/30"
      >
        <X size={16} strokeWidth={2} />
      </button>

      <div className="relative">
        <Image
          src="/logo-persona-politico.png"
          alt=""
          width={140}
          height={140}
          priority={!compact}
          className={compact ? "mx-auto h-auto w-20" : "mx-auto h-auto w-32"}
        />

        <p
          className={
            compact
              ? "mt-1 text-xs font-extrabold uppercase tracking-wide text-white"
              : "mt-2 text-lg font-extrabold uppercase tracking-wide text-white"
          }
        >
          Seu candidato
        </p>
        <p
          className={
            compact
              ? "-mt-1 font-display text-3xl font-normal uppercase leading-none text-decor-lime"
              : "-mt-1 font-display text-5xl font-normal uppercase leading-none text-decor-lime"
          }
        >
          no topo
        </p>

        {!compact && (
          <>
            <p className="mt-5 flex items-center justify-center text-white">
              <span className="text-xl font-bold">R$</span>
              <span className="font-sans text-8xl font-extrabold leading-none">{reais}</span>
              <span className="text-xl font-bold">,{cents}</span>
            </p>

            <p className="mt-3 text-sm font-medium text-white/80">
              Cada apoio vale uma moldura para seu perfil
            </p>
          </>
        )}
      </div>
    </div>
  );
}
