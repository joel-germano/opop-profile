import Image from "next/image";
import Link from "next/link";
import { Crown } from "lucide-react";
import { CtaButton } from "@/components/CtaButton";
import type { RankedCandidate } from "@/components/CandidatesRanking";
import {
  CANDIDATE_BADGE_TEXT_COLOR,
  candidateColor,
  contrastTextColor,
} from "@/lib/candidate-colors";
import { formatCompactNumber } from "@/lib/format";
import { FloatingParticles } from "@/components/FloatingParticles";
import { RankingAccordion } from "@/components/RankingAccordion";
import { ModelsMarquee } from "@/components/ModelsMarquee";

// Hero de impacto: o topo do ranking em cima do próprio candidato — quem
// abre a página vê primeiro quem está ganhando, não um texto explicando o
// conceito. O choque emocional ("meu candidato não tá em 1º") é a isca; a
// explicação de como o placar funciona vem depois, mais abaixo na página.
export function PresidenciaveisRankHero({
  top3,
  rest,
}: {
  top3: RankedCandidate[];
  rest: RankedCandidate[];
}) {
  if (top3.length < 3) return null;
  const [first, second, third] = top3;
  const firstColor = candidateColor(first.color);

  return (
    <section className="relative w-full overflow-hidden bg-[#000D2F]">
      {/* Sem `fill`/object-cover: a imagem mantém a proporção original
          (quadrada) e some inteira na largura da coluna, sem cortar topo ou
          base. `aspect-square` faz esse wrapper acompanhar exatamente a altura
          renderizada da imagem (responsiva), então o degradê logo abaixo cobre
          a mesma área sempre, não um valor fixo em pixel. */}
      <div className="relative aspect-square w-full">
        <Image
          src="/presidenciaveis-hero-bg.jpg"
          alt=""
          fill
          priority
          sizes="(min-width: 768px) 480px, 100vw"
          className="object-cover"
        />
        {/* #000D2F é o mesmo azul do rodapé da imagem — o degradê termina
            opaco nessa cor exatamente onde a imagem termina, e a seção usa a
            mesma cor de fundo logo abaixo, então a transição fica contínua,
            sem marcar onde a foto acaba. */}
        <div className="absolute inset-0 bg-linear-to-b from-transparent to-[#000D2F]" />
      </div>

      <div
        className="relative z-10 mt-[-100%] flex flex-col items-center px-3 pb-8 text-center sm:px-4"
        style={{ paddingTop: "max(2rem, env(safe-area-inset-top))" }}
      >
        <span className="relative z-10 inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/20 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
          Placar ao vivo
        </span>

        <div className="mt-8 flex items-center gap-3" aria-hidden>
          <span className="h-px w-8 bg-linear-to-r from-transparent to-white/60" />
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-white">
            1º lugar
          </span>
          <span className="h-px w-8 bg-linear-to-l from-transparent to-white/60" />
        </div>

        <Link
          href={`/presidenciaveis/${first.slug}`}
          className="mt-4 flex w-full max-w-72 flex-col items-center transition active:scale-95"
        >
          <div className="relative">
            {/* Só na área do 1º lugar, de propósito — é o destaque que
                precisa desse toque a mais; nos demais ficaria poluído. */}
            <FloatingParticles color={firstColor} className="-inset-10" />

            {/* Radar: três anéis do tamanho do círculo, saindo em sequência
                (delay escalonado) e crescendo pra fora até sumir — ver
                keyframe `radar-wave` em globals.css. Só um contorno (sem
                preenchimento) pra ler como onda, não como mancha. */}
            {[0, 0.8, 1.6].map((delay) => (
              <span
                key={delay}
                className="animate-radar-wave absolute inset-0 rounded-full border-2"
                style={
                  {
                    borderColor: firstColor,
                    "--radar-delay": `${delay}s`,
                  } as React.CSSProperties
                }
                aria-hidden
              />
            ))}

            <div
              className="relative h-28 w-28 overflow-hidden rounded-full ring-4 sm:h-36 sm:w-36"
              style={{ "--tw-ring-color": firstColor } as React.CSSProperties}
            >
              <Image
                src={first.photoUrl}
                alt=""
                fill
                sizes="144px"
                priority
                className="object-cover"
              />
            </div>
            <Crown
              size={30}
              strokeWidth={2}
              fill="currentColor"
              className="absolute -top-3 left-1/2 -translate-x-1/2 -rotate-12 drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)] sm:-top-4"
              style={{ color: firstColor }}
              aria-hidden
            />
            {/* Pill sólida: é o número mais alto da página e precisa gritar mais
                que o nome — os apoios é que são a prova social, não o rosto.
                Centralizada na borda de baixo do círculo, metade dentro da
                foto, metade fora. */}
            <span
              className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 whitespace-nowrap rounded-full px-3 py-1 text-xs shadow-lg sm:px-4 sm:py-1.5 sm:text-sm"
              style={{ backgroundColor: firstColor, color: contrastTextColor(firstColor) }}
            >
              <span className="tabular-nums">
                {formatCompactNumber(first.supporters)}
              </span>{" "}
              apoios
            </span>
          </div>

          <span className="mt-8 max-w-full text-balance text-xl font-bold leading-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] sm:text-2xl">
            {first.name}
            {first.party && (
              <span className="font-normal text-white/60">
                {" "}
                - {first.party}
              </span>
            )}
          </span>
        </Link>

        {/* Isola o 1º lugar do resto — sem essa linha o olho lê o pódio
            inteiro como um bloco só, e o líder perde o destaque de "sozinho
            lá em cima". */}
        <span className="mt-8 h-px w-24 bg-linear-to-r from-transparent via-white/30 to-transparent" />

        <div className="mt-5 flex w-full max-w-72 items-start justify-center gap-3 sm:gap-5">
          {[second, third].map((candidate, i) => {
            const color = candidateColor(candidate.color);
            return (
              <Link
                key={candidate.slug}
                href={`/presidenciaveis/${candidate.slug}`}
                className="flex w-1/2 min-w-0 flex-col items-center transition active:scale-95"
              >
                <div className="relative">
                  <div
                    className="relative h-20 w-20 overflow-hidden rounded-full ring-3 sm:h-24 sm:w-24"
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
                    className="absolute top-0 left-1/2 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-[11px] font-bold ring-2 ring-white"
                    style={{ backgroundColor: color, color: CANDIDATE_BADGE_TEXT_COLOR }}
                  >
                    {i + 2}º
                  </span>
                  {/* Mesmo tratamento do 1º lugar: pill de apoios cravada na
                      borda de baixo do círculo, metade dentro metade fora —
                      libera a linha que antes ficava só pra isso. */}
                  <span
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 whitespace-nowrap rounded-full px-2.5 py-1 text-xs shadow-lg"
                    style={{ backgroundColor: color, color: contrastTextColor(color) }}
                  >
                    <span className="tabular-nums">
                      {formatCompactNumber(candidate.supporters)}
                    </span>{" "}
                    apoios
                  </span>
                </div>

                <span className="mt-6 max-w-full truncate text-sm font-bold leading-tight text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]">
                  {candidate.name}
                </span>
                {candidate.party && (
                  <span className="text-[11px] text-white/50">
                    {candidate.party}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        <RankingAccordion rest={rest} scaleMax={first.supporters} />

        {/* h2, não h1: a página já tem seu H1 principal logo abaixo (mantido
            intacto por pedido) — dois H1 quebraria a hierarquia de heading.
            Gasoek One só existe num peso único (não é fonte variável) — não
            dá pra "afinar" via font-weight. O jeito real de aliviar o peso
            visual sem trocar de fonte é abrir o tracking (letras respiram
            mais, densidade cai) e baixar um pouco a opacidade do branco. */}
        <h2
          className="mt-10 max-w-sm font-display font-normal text-white/85 leading-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]"
          style={{ fontSize: "clamp(1.375rem, 6.5vw, 1.875rem)" }}
        >
          A pesquisa eleitoral de verdade está aqui
        </h2>

        <p className="mt-3 max-w-sm text-sm leading-snug text-white/60">
          Escolha seu candidato, adquira sua moldura e mostre publicamente de
          que lado você está. Cada novo apoio pode mudar a posição do
          ranking.
        </p>

        {/* CTA da hero, separado do "Apoiar meu candidato" mais abaixo na
            página — ali é sobre confirmar o apoio; aqui é sobre o produto em
            si (a moldura) e o efeito dela (empurrar o candidato no placar),
            que é o gancho que fez a pessoa rolar até aqui. */}
        <CtaButton
          href="#escolha"
          title="Quero minha moldura"
          subtitle="e levar meu candidato ao topo"
          className="mt-6 max-w-xs"
        />
      </div>

      {/* Fecha a hero mostrando o produto em si (as molduras prontas). O
          `-mt-16` puxa a faixa pra debaixo do CTA — como o bloco de conteúdo
          acima tem z-10, o botão fica por cima das artes. O degradê só existe
          no topo (mesmo azul da hero, bem espalhado pra sumir suave debaixo
          do botão); embaixo a faixa termina crua, sem fade nem cor por cima —
          é o corte seco do fim da hero. */}
      <ModelsMarquee
        className="-mt-16 h-72 w-full"
        fadeClassName="bg-[linear-gradient(to_bottom,#000D2F_0%,transparent_75%)]"
      />
    </section>
  );
}
