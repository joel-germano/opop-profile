import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { TrendingUp, Users } from "lucide-react";
import { connectDB } from "@/lib/db";
import { CandidateModel } from "@/lib/models/candidate";
import { GalleryPostModel } from "@/lib/models/gallery-post";
import { SupporterPurchaseModel } from "@/lib/models/supporter-purchase";
import { getPresidenciaveisPriceCents } from "@/lib/premium-price";
import { formatCompactNumber } from "@/lib/format";
import { candidateColor, contrastTextColor } from "@/lib/candidate-colors";
import {
  buildCandidateTrend,
  TREND_WINDOW_DAYS,
  type DailyPostRow,
} from "@/lib/candidate-trend";
import { PLACEHOLDER_SUPPORTER_AVATARS } from "@/lib/placeholder-avatars";
import { AvatarCarousel } from "@/components/AvatarCarousel";
import { CtaButton } from "@/components/CtaButton";
import { PresidenciaveisGallery } from "@/components/PresidenciaveisGallery";
import { PresidenciaveisFooter } from "@/components/PresidenciaveisFooter";
import { PresidenciaveisImpact } from "@/components/PresidenciaveisImpact";
import { PresidenciaveisRankHero } from "@/components/PresidenciaveisRankHero";
import { PresidenciaveisSteps } from "@/components/PresidenciaveisSteps";
import { PresidenciaveisTrendChart } from "@/components/PresidenciaveisTrendChart";
import { PresidenciaveisTrust } from "@/components/PresidenciaveisTrust";

// O placar precisa refletir o banco a cada acesso — sem isso o Next
// prerenderiza a rota no build e congela os números. `dynamic` continua
// válido aqui porque cacheComponents está desligado (ver next.config.ts).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Termômetro do apoio popular",
  description:
    "Um placar de apoio construído por pessoas reais, não por amostra: cada apoio contabilizado é alguém que confirmou o apoio e publicou a própria foto com a moldura do candidato.",
};

// 5 rostos a mais que os da home, só pra fileira não sobrar com espaço vazio
// nessa seção (que é maior/full-width) — não mexe no array compartilhado
// (PLACEHOLDER_SUPPORTER_AVATARS), a home continua com os 10 de sempre.
const EXTRA_SOCIAL_PROOF_AVATARS = [8, 15, 20, 28, 36].map(
  (seed) => `https://i.pravatar.cc/80?img=${seed}`,
);
const SOCIAL_PROOF_AVATARS = [
  ...PLACEHOLDER_SUPPORTER_AVATARS,
  ...EXTRA_SOCIAL_PROOF_AVATARS,
];

export default async function PresidenciaveisPage() {
  await connectDB();
  // Subtração em dias de calendário (não em milissegundos): "90 dias atrás"
  // é uma data, não um múltiplo fixo de 86.400.000ms — o mesmo padrão de
  // `new Date()` em render que os footers já usam.
  const trendWindowStart = new Date();
  trendWindowStart.setDate(trendWindowStart.getDate() - TREND_WINDOW_DAYS);
  const [candidates, supporterCounts, priceCents, revenueAgg, dailyPosts] =
    await Promise.all([
      CandidateModel.find({}).sort({ name: 1 }).lean(),
      GalleryPostModel.aggregate<{ _id: string; count: number }>([
        { $group: { _id: "$candidateSlug", count: { $sum: 1 } } },
      ]),
      getPresidenciaveisPriceCents(),
      // Soma real do que já foi cobrado com sucesso (só "paid" — "refunded"
      // devolveu o dinheiro, "pending"/"failed" nunca chegou a entrar).
      SupporterPurchaseModel.aggregate<{ total: number }>([
        { $match: { status: "paid" } },
        { $group: { _id: null, total: { $sum: "$amountCents" } } },
      ]),
      // Apoios por dia e por candidato — base do gráfico de evolução (ver
      // buildCandidateTrend, que transforma isso em série acumulada). O
      // $match limita à janela e usa o índice de createdAt: o custo fica
      // proporcional à janela, não ao histórico inteiro (que só cresce).
      GalleryPostModel.aggregate<DailyPostRow>([
        { $match: { createdAt: { $gte: trendWindowStart } } },
        {
          $group: {
            _id: {
              slug: "$candidateSlug",
              day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.day": 1 } },
      ]),
    ]);
  const totalRaisedCents = revenueAgg[0]?.total ?? 0;

  // Ranking real de apoio: conta os posts na galeria por candidato — um por
  // apoiador que pagou e publicou a própria foto (ver GalleryPostModel), não
  // voto auto-declarado. É o mesmo dado exibido como supporterCount na página
  // de cada candidato, então placar e galeria nunca divergem.
  const supportersBySlug = new Map(
    supporterCounts.map((c) => [c._id, c.count]),
  );
  const ranking = candidates
    .map((candidate) => ({
      slug: candidate.slug,
      name: candidate.name,
      photoUrl: candidate.photoUrl,
      party: candidate.party || "",
      color: candidate.color || "",
      supporters: supportersBySlug.get(candidate.slug) ?? 0,
    }))
    .sort((a, b) => b.supporters - a.supporters);

  const totalSupporters = ranking.reduce((sum, c) => sum + c.supporters, 0);
  const hasCandidates = ranking.length > 0;
  // Com todo mundo empatado em zero, "1º lugar" seria arbitrário e coroaria
  // alguém que não liderou nada — nesse caso nem o pódio nem o "resto do
  // ranking" (que só faz sentido como apêndice do pódio) aparecem.
  const top3 = totalSupporters > 0 ? ranking.slice(0, 3) : [];
  const rest = top3.length === 3 ? ranking.slice(3) : [];

  // Gráfico de evolução: usa a mesma ordem do ranking (líder primeiro), e só
  // aparece com pelo menos 2 dias distintos de dados — com um dia só, uma
  // "linha do tempo" seria só um ponto parado, sem mostrar evolução nenhuma.
  //
  // A baseline é o que cada candidato já tinha ANTES da janela: total do
  // ranking menos o que entrou dentro dela. Sem isso o acumulado começaria
  // do zero e o último ponto da linha não bateria com o número do pódio.
  const windowCountsBySlug = new Map<string, number>();
  for (const row of dailyPosts) {
    windowCountsBySlug.set(
      row._id.slug,
      (windowCountsBySlug.get(row._id.slug) ?? 0) + row.count
    );
  }
  const trendBaseline = new Map(
    ranking.map((c) => [
      c.slug,
      c.supporters - (windowCountsBySlug.get(c.slug) ?? 0),
    ])
  );
  const trend = buildCandidateTrend(
    dailyPosts,
    ranking.map((c) => c.slug),
    trendBaseline
  );
  const trendSeries = ranking.map((c) => ({
    slug: c.slug,
    name: c.name,
    color: candidateColor(c.color),
  }));
  const showTrendChart = hasCandidates && trend.days.length >= 2;

  return (
    <div className="flex flex-1 min-h-screen overflow-x-hidden bg-[#2A2A2A]">
      <div className="hidden md:block flex-1 bg-[#2A2A2A]" />

      <main
        className="flex w-full flex-col items-center gap-14 overflow-x-hidden pb-14 md:w-120 md:flex-none border-x border-white/10 bg-[#2A2A2A]"
        style={{
          paddingTop: "max(2.5rem, env(safe-area-inset-top))",
          paddingBottom: "max(3.5rem, env(safe-area-inset-bottom))",
          paddingLeft: "env(safe-area-inset-left)",
          paddingRight: "env(safe-area-inset-right)",
        }}
      >
        {top3.length === 3 && (
          // Puxa pra cima o paddingTop do <main> (pensado pras seções
          // normais) só aqui, pra a imagem do hero encostar no topo real da
          // tela — o respiro pro notch/status bar volta a existir dentro do
          // próprio componente, no padding do seu conteúdo.
          <div
            className="w-full"
            style={{
              marginTop: "calc(-1 * max(2.5rem, env(safe-area-inset-top)))",
            }}
          >
            <PresidenciaveisRankHero top3={top3} rest={rest} />
          </div>
        )}

        <section className="w-full px-6 text-center">
          {/* "Placar ao vivo" já está na hero, logo acima — repetir aqui
              seria redundante, a página inteira já estabeleceu isso. */}
          <h1
            className="font-display font-normal leading-tight tracking-wide text-white"
            style={{ fontSize: "clamp(1.75rem, 8vw, 2.5rem)" }}
          >
            Quem apoia de verdade
            <br />
            <span className="text-decor-lime">aparece aqui</span>
          </h1>

          <p className="mt-4 text-base leading-snug text-white/60">
            Pesquisas eleitorais trabalham com amostras e estimativas. Aqui é
            diferente: cada apoio no placar representa uma pessoa que decidiu
            participar e colocar a própria cara na campanha.
          </p>

          {hasCandidates && totalSupporters > 0 && (
            // p-6 saiu daqui e foi pro wrapper interno de baixo, só em volta
            // do texto/avatares/número — o personagem fica fora dessa área
            // com padding, direto filho deste card sem padding nenhum, então
            // `right-0`/`bottom-0` nele encosta na borda de verdade, sem
            // depender de nenhuma sutileza de "containing block".
            <div className="relative mt-7 rounded-3xl bg-white/5 text-left ring-1 ring-white/10">
              {/* rounded-br-3xl + overflow-hidden só nesse wrapper (não no
                  card inteiro): acompanha exatamente a curva do canto
                  inferior direito do card onde os dois se encontram, sem
                  cortar o resto do personagem, que continua livre pra subir
                  por cima do topo. */}
              <div className="pointer-events-none absolute right-0 bottom-0 z-10 w-28 overflow-hidden rounded-br-3xl select-none sm:w-36">
                <Image
                  src="/personagem-apoiador.png"
                  alt=""
                  width={420}
                  height={799}
                  className="h-auto w-full"
                />
              </div>

              <div className="p-6">
                <div className="relative z-20 max-w-[84%]">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-decor-lime/15 text-decor-lime">
                    <Users size={20} strokeWidth={2} />
                  </div>
                  <h2 className="mt-4 text-lg font-bold text-white">
                    Veja quem apoia de verdade
                  </h2>
                  <p className="mt-1 text-sm leading-snug text-white/60">
                    Cada rosto aqui é alguém que pagou e publicou a própria foto
                    com a moldura do candidato.
                  </p>
                </div>

                {/* Placeholder por enquanto (rostos da home + mais 5) — vira
                    a fileira de apoiadores reais assim que a galeria tiver
                    gente suficiente. Carrossel: arrasta normal no mobile
                    (scroll nativo), chevrons só no desktop — ver
                    AvatarCarousel.tsx. Sem padding-right: passa a largura
                    toda por baixo do personagem de propósito, pra sumir e
                    reaparecer atrás dele. */}
                <div className="relative z-0 mt-4">
                  <AvatarCarousel avatars={SOCIAL_PROOF_AVATARS} />
                </div>

                <div className="relative z-20 mt-4 flex max-w-[84%] flex-col gap-1">
                  {/* Placar em tempo real ainda não está ligado — o número
                      já sai formatado como "1,2 mil" / "1,5 mi" via
                      formatCompactNumber, pronto pra quando passar a mudar
                      sozinho. Fonte menor no mobile (text-4xl) e max-w-[84%]
                      no container (mesmo limite do bloco de texto lá em
                      cima): sem isso, "1,8 mil" em text-6xl ficava largo
                      demais e passava por cima do personagem no canto. */}
                  <span className="text-4xl font-bold leading-none text-white sm:text-6xl">
                    {formatCompactNumber(totalSupporters)}
                  </span>
                  <span className="whitespace-nowrap text-xs leading-tight text-white/45">
                    Apoios com molduras
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* CTA colado no card de prova social (era uma seção separada, com
              o texto genérico "Apoiar meu candidato") — reaproveita o mesmo
              formato de duas linhas da hero, então quem viu os apoiadores
              reais aqui embaixo já encontra o convite pra fazer parte logo
              em seguida, sem precisar rolar até uma seção nova. */}
          {hasCandidates && (
            <>
              {totalSupporters === 0 && (
                <p className="mt-5 rounded-2xl bg-white/5 p-4 text-center text-sm leading-snug text-white/60 ring-1 ring-white/10">
                  <strong className="font-bold text-white">
                    A disputa ainda não começou.
                  </strong>{" "}
                  Ninguém pontuou até agora — o primeiro apoio de cada candidato
                  abre o placar.
                </p>
              )}

              <CtaButton
                href="#escolha"
                title="Quero minha moldura"
                subtitle="e levar meu candidato ao topo"
                className="mt-6"
              />
            </>
          )}

          {!hasCandidates && (
            <p className="text-center text-white/50">
              Nenhum candidato cadastrado ainda.
            </p>
          )}
        </section>

        <PresidenciaveisGallery />

        {showTrendChart && (
          <PresidenciaveisTrendChart data={trend.data} series={trendSeries} />
        )}

        <PresidenciaveisTrust priceCents={priceCents} />

        <PresidenciaveisSteps priceCents={priceCents} />

        {hasCandidates && (
          <section id="escolha" className="w-full scroll-mt-6 px-6">
            <div className="text-center">
              <span className="text-xs font-bold uppercase tracking-wide text-decor-coral">
                Sua vez
              </span>
              <h2 className="mt-2 font-display text-2xl font-normal leading-tight tracking-wide text-white">
                Escolha seu candidato
              </h2>
              <p className="mt-3 text-base leading-snug text-white/60">
                {totalSupporters > 0
                  ? "Enquanto você lê isso, o placar continua se mexendo. Quem some do topo some porque a torcida do outro apareceu."
                  : "O placar está zerado para todo mundo. Quem aparecer primeiro define de quem é a largada."}
              </p>
            </div>

            {/* Mesma ordem do ranking — `ranking` já vem ordenado por
                apoios (ver .sort logo no início da função), então o grid
                não precisa reordenar nada, só mapear direto. */}
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {ranking.map((candidate, index) => {
                const color = candidateColor(candidate.color);
                return (
                  <Link
                    key={candidate.slug}
                    href={`/presidenciaveis/${candidate.slug}`}
                    className="flex flex-col items-center gap-2 rounded-2xl bg-white/5 p-4 ring-1 transition active:scale-95 hover:bg-white/10"
                    style={
                      {
                        "--tw-ring-color": `${color}4d`,
                        boxShadow: `0 4px 16px -8px ${color}66`,
                      } as React.CSSProperties
                    }
                  >
                    <div className="relative">
                      <div
                        className="relative h-20 w-20 overflow-hidden rounded-full ring-2"
                        style={
                          { "--tw-ring-color": color } as React.CSSProperties
                        }
                      >
                        <Image
                          src={candidate.photoUrl}
                          alt=""
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </div>
                      {totalSupporters > 0 && (
                        <span
                          className="absolute -bottom-1 left-1/2 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full text-[11px] font-bold ring-3 ring-[#2A2A2A]"
                          style={{
                            backgroundColor: color,
                            color: contrastTextColor(color),
                          }}
                        >
                          {index + 1}º
                        </span>
                      )}
                    </div>
                    <span className="mt-1 text-center text-sm font-bold leading-tight text-white">
                      {candidate.name}
                    </span>
                    {candidate.party && (
                      <span className="-mt-1 text-xs text-white/40">
                        {candidate.party}
                      </span>
                    )}
                    <span
                      className="flex items-center gap-1 text-xs font-bold"
                      style={{ color }}
                    >
                      <Users size={12} strokeWidth={2} />
                      {formatCompactNumber(candidate.supporters)}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {hasCandidates && (
          <section className="w-full px-6">
            <div className="rounded-3xl bg-linear-to-b from-primary/30 to-transparent p-6 text-center ring-1 ring-primary/40">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-decor-lime/15 text-decor-lime">
                <TrendingUp size={20} strokeWidth={2} />
              </div>
              <h2 className="mt-4 font-display text-2xl font-normal leading-tight tracking-wide text-white">
                Um apoio muda o placar
              </h2>
              <p className="mt-3 text-base leading-snug text-white/70">
                Nenhum candidato sobe sozinho. Sobe quando a torcida dele
                resolve aparecer, e some quando ela acha que alguém já fez isso
                por ela.
              </p>
            </div>
            <CtaButton
              href="#escolha"
              title="Quero minha moldura"
              subtitle="e levar meu candidato ao topo"
              className="mt-4"
            />
          </section>
        )}

        <PresidenciaveisImpact totalRaisedCents={totalRaisedCents} />

        <PresidenciaveisFooter />
      </main>

      <div className="hidden md:block flex-1 bg-[#2A2A2A]" />
    </div>
  );
}
