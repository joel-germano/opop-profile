import Link from "next/link";
import Image from "next/image";
import { Medal, Trophy } from "lucide-react";
import { CANDIDATE_BADGE_TEXT_COLOR, candidateColor } from "@/lib/candidate-colors";
import { formatCompactNumber } from "@/lib/format";

export type RankedCandidate = {
  slug: string;
  name: string;
  photoUrl: string;
  party: string;
  color: string;
  supporters: number;
};

// Pódio: 2º à esquerda, 1º ao centro (maior), 3º à direita — índices sobre a
// lista já ordenada por apoios.
const PODIUM_ORDER = [1, 0, 2];

// A cor de cada posição agora vem do próprio candidato (candidateColor) —
// aqui só ficam o que NÃO depende de quem está em cada lugar: tamanho do
// avatar (1º maior) e o ícone (troféu no topo, medalha nos outros dois).
const PODIUM_STYLE = [
  { avatar: "h-20 w-20 sm:h-24 sm:w-24", icon: Trophy },
  { avatar: "h-14 w-14 sm:h-18 sm:w-18", icon: Medal },
  { avatar: "h-14 w-14 sm:h-18 sm:w-18", icon: Medal },
];

export function CandidatesRanking({ ranking }: { ranking: RankedCandidate[] }) {
  // Enquanto ninguém pontuou, a ordem é arbitrária (empate em zero) — mostrar
  // pódio e posições aí coroaria um "líder" que não existe. Nesse caso o card
  // sai sem pódio, sem numeração e sem barra de proporção.
  const hasScores = ranking.some((c) => c.supporters > 0);
  const showPodium = hasScores && ranking.length >= 3;
  const podium = ranking.slice(0, 3);
  const rest = showPodium ? ranking.slice(3) : ranking;
  // Escala pelo líder: a maior barra ocupa a pill inteira, então a comparação
  // entre candidatos continua proporcional mesmo com números baixos.
  const max = Math.max(...ranking.map((c) => c.supporters), 1);

  return (
    <div className="w-full overflow-hidden rounded-3xl bg-linear-to-b from-primary-dark via-primary to-secondary ring-1 ring-white/15">
      {showPodium && (
        <div className="px-4 pb-10 pt-7">
          <div className="mx-auto flex max-w-xs items-end justify-center gap-2">
            {PODIUM_ORDER.map((position) => {
              const candidate = podium[position];
              const style = PODIUM_STYLE[position];
              const Icon = style.icon;
              const color = candidateColor(candidate.color);

              return (
                <Link
                  key={candidate.slug}
                  href={`/presidenciaveis/${candidate.slug}`}
                  className="flex min-w-0 flex-1 flex-col items-center transition active:scale-95"
                >
                  <div
                    className={`relative overflow-hidden rounded-full ring-3 ${style.avatar}`}
                    style={{ "--tw-ring-color": color } as React.CSSProperties}
                  >
                    <Image
                      src={candidate.photoUrl}
                      alt=""
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  </div>

                  <span
                    className="-mt-3 flex h-7 items-center justify-center rounded-full px-2.5 text-xs font-bold ring-3 ring-primary-dark"
                    style={{ backgroundColor: color, color: CANDIDATE_BADGE_TEXT_COLOR }}
                  >
                    #{position + 1}
                  </span>

                  <Icon
                    size={position === 0 ? 22 : 16}
                    strokeWidth={2}
                    className="mt-2"
                    style={{ color }}
                    aria-hidden
                  />

                  <span className="mt-1.5 line-clamp-2 text-center text-xs font-bold leading-tight text-white">
                    {candidate.name}
                  </span>
                  {candidate.party && (
                    <span className="text-[10px] text-white/50">{candidate.party}</span>
                  )}
                  <span className="mt-1 text-sm font-bold tabular-nums" style={{ color }}>
                    {formatCompactNumber(candidate.supporters)}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div
        className={`bg-black/25 px-3 pb-4 ${
          showPodium ? "-mt-5 rounded-t-[2.5rem] pt-6" : "pt-4"
        }`}
      >
        <div className="flex items-baseline justify-between px-3 pb-2">
          <span className="text-[11px] font-bold uppercase tracking-wide text-white/50">
            {showPodium ? "Demais candidatos" : "Todos os candidatos"}
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wide text-white/50">
            Apoios
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {rest.map((candidate, index) => (
            <Link
              key={candidate.slug}
              href={`/presidenciaveis/${candidate.slug}`}
              className="relative overflow-hidden rounded-full bg-white/10 transition active:scale-[0.98] hover:bg-white/15"
            >
              {/* Preenchimento proporcional ao número de apoios, na cor do
                  próprio candidato — mantém a leitura de grandeza que a lista
                  de pills sozinha não dá, e reforça a identidade de cada um. */}
              {hasScores && (
                <span
                  className="absolute inset-y-0 left-0"
                  style={{
                    width: `${(candidate.supporters / max) * 100}%`,
                    backgroundColor: `${candidateColor(candidate.color)}26`,
                  }}
                  aria-hidden
                />
              )}

              <div className="relative flex items-center gap-3 py-2 pl-3 pr-4">
                {hasScores && (
                  <span className="w-6 shrink-0 text-xs font-bold text-white/50 tabular-nums">
                    #{index + (showPodium ? 4 : 1)}
                  </span>
                )}

                <div
                  className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full ring-2"
                  style={{
                    "--tw-ring-color": candidateColor(candidate.color),
                  } as React.CSSProperties}
                >
                  <Image
                    src={candidate.photoUrl}
                    alt=""
                    fill
                    sizes="36px"
                    className="object-cover"
                  />
                </div>

                <span className="min-w-0 flex-1 truncate text-sm font-bold text-white">
                  {candidate.name}
                  {candidate.party && (
                    <span className="ml-1.5 text-xs font-normal text-white/50">
                      {candidate.party}
                    </span>
                  )}
                </span>

                <span className="shrink-0 text-sm font-bold text-white tabular-nums">
                  {formatCompactNumber(candidate.supporters)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
