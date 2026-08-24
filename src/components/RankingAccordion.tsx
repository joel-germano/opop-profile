"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import type { RankedCandidate } from "@/components/CandidatesRanking";
import { candidateColor } from "@/lib/candidate-colors";
import { formatCompactNumber } from "@/lib/format";

// Quantos rostos aparecem empilhados no estado fechado antes de virar "+N".
const PREVIEW_FACES = 4;

// O 1º, 2º e 3º já ganharam o pódio grande logo acima — isto é só o "resto
// do mundo" (4º em diante). Fica fechado por padrão de propósito: expandir
// o hero com uma lista comprida empurraria a headline e o CTA pra fora da
// primeira dobra, então a pessoa escolhe abrir só se quiser ir fundo.
//
// `scaleMax` é a contagem do líder geral (não a do 4º colocado): as barras
// aqui precisam ficar proporcionais ao pódio lá em cima, senão o 4º lugar
// apareceria com a barra cheia e daria a impressão de estar ganhando.
export function RankingAccordion({
  rest,
  scaleMax,
}: {
  rest: RankedCandidate[];
  scaleMax: number;
}) {
  const [open, setOpen] = useState(false);

  if (rest.length === 0) return null;

  const max = Math.max(scaleMax, ...rest.map((c) => c.supporters), 1);
  const faces = rest.slice(0, PREVIEW_FACES);
  const overflow = rest.length - faces.length;

  return (
    <div className="mt-7 w-full overflow-hidden rounded-2xl bg-linear-to-b from-white/12 to-white/5 ring-1 ring-white/15">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="ranking-completo"
        className="group flex w-full flex-wrap items-center gap-3 px-3 py-3.5 text-left transition hover:bg-white/5 sm:px-4"
      >
        {/* Rostos de quem está escondido: dá um motivo concreto pra abrir
            ("cadê o meu candidato?") em vez de um rótulo genérico. */}
        <div className="flex shrink-0 -space-x-2.5">
          {faces.map((candidate) => (
            <div
              key={candidate.slug}
              className="relative h-9 w-9 overflow-hidden rounded-full ring-2"
              style={
                { "--tw-ring-color": candidateColor(candidate.color) } as React.CSSProperties
              }
            >
              <Image
                src={candidate.photoUrl}
                alt=""
                fill
                sizes="36px"
                className="object-cover"
              />
            </div>
          ))}
          {overflow > 0 && (
            <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-[11px] font-bold text-white ring-2 ring-white/30">
              +{overflow}
            </span>
          )}
        </div>

        {/* Abaixo de 380px o texto não cabe ao lado dos avatares + chevron
            (sobram ~118px e o título quebra feio), então ele desce pra uma
            segunda linha inteira: `order-3` + `w-full` mandam ele pro fim do
            wrap, e os avatares/chevron ficam sozinhos na primeira linha. */}
        <span className="min-w-0 flex-1 max-xs:order-3 max-xs:w-full max-xs:flex-none">
          <span className="block text-sm font-bold leading-tight text-white">
            {open ? "Fechar ranking" : "Ver ranking completo"}
          </span>
          <span className="block text-xs leading-tight text-white/50">
            mais {rest.length}{" "}
            {rest.length === 1 ? "candidato na disputa" : "candidatos na disputa"}
          </span>
        </span>

        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition group-hover:bg-white/20 max-xs:ml-auto">
          <ChevronDown
            size={18}
            strokeWidth={2.5}
            className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      {/* Truque do grid-template-rows: anima altura de 0 até o conteúdo real
          sem precisar medir pixels em JS (e sem "pular" no primeiro render). */}
      <div
        id="ranking-completo"
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-1.5 border-t border-white/10 px-3 pb-3 pt-3">
            {rest.map((candidate, index) => {
              const color = candidateColor(candidate.color);
              return (
                <Link
                  key={candidate.slug}
                  href={`/presidenciaveis/${candidate.slug}`}
                  className="relative overflow-hidden rounded-xl bg-white/5 transition active:scale-[0.98] hover:bg-white/10"
                >
                  <span
                    className="absolute inset-y-0 left-0"
                    style={{
                      width: `${(candidate.supporters / max) * 100}%`,
                      backgroundColor: `${color}2E`,
                    }}
                    aria-hidden
                  />
                  <div className="relative flex items-center gap-3 py-2 pl-2.5 pr-4">
                    <span className="w-6 shrink-0 text-center text-xs font-bold tabular-nums text-white/40">
                      {index + 4}º
                    </span>
                    <div
                      className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full ring-2"
                      style={{ "--tw-ring-color": color } as React.CSSProperties}
                    >
                      <Image
                        src={candidate.photoUrl}
                        alt=""
                        fill
                        sizes="36px"
                        className="object-cover"
                      />
                    </div>
                    <span className="min-w-0 flex-1 truncate text-left text-sm font-bold text-white">
                      {candidate.name}
                      {candidate.party && (
                        <span className="ml-1.5 text-xs font-normal text-white/40">
                          {candidate.party}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 text-sm font-bold tabular-nums text-white">
                      {formatCompactNumber(candidate.supporters)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
