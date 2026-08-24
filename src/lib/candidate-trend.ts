export type DailyPostRow = { _id: { slug: string; day: string }; count: number };

export type TrendPoint = { day: string } & Record<string, number | string>;

// Janela máxima que o gráfico busca no banco. Existe por eficiência: sem
// isso, a agregação varreria a coleção inteira a cada carregamento da página
// (que é force-dynamic), crescendo pra sempre junto com os apoios. Com o
// limite, o trabalho é sempre proporcional à janela, não ao histórico todo.
export const TREND_WINDOW_DAYS = 90;

// Períodos que o usuário pode escolher no gráfico. Só aparecem os que cabem
// nos dias realmente disponíveis (ver `availableRanges`).
export const TREND_RANGES = [
  { days: 7, label: "7 dias" },
  { days: 30, label: "30 dias" },
  { days: TREND_WINDOW_DAYS, label: "Tudo" },
] as const;

// Cada linha do gráfico é cumulativa (apoios acumulados até aquele dia, não
// só os daquele dia) — é assim que pesquisa/placar de campanha sempre é
// lido: "quantos apoios ele tem até agora", não um valor solto por dia.
//
// `rows` já vem agrupado por dia+candidato do MongoDB e limitado à janela
// (ver aggregate em page.tsx). `baseline` é quanto cada candidato já tinha
// ANTES do primeiro dia da janela — sem isso a linha começaria do zero e o
// valor final não bateria com o total do ranking. Dias sem post novo
// repetem o total anterior (forward-fill), senão a linha cairia pra zero.
export function buildCandidateTrend(
  rows: DailyPostRow[],
  slugs: string[],
  baseline: Map<string, number> = new Map()
): { days: string[]; data: TrendPoint[] } {
  const days = Array.from(new Set(rows.map((r) => r._id.day))).sort();

  const countsBySlugAndDay = new Map<string, Map<string, number>>();
  for (const row of rows) {
    if (!countsBySlugAndDay.has(row._id.slug)) {
      countsBySlugAndDay.set(row._id.slug, new Map());
    }
    countsBySlugAndDay.get(row._id.slug)!.set(row._id.day, row.count);
  }

  const cumulativeBySlug = new Map<string, number>(
    slugs.map((s) => [s, baseline.get(s) ?? 0])
  );
  const data: TrendPoint[] = days.map((day) => {
    const point: TrendPoint = { day };
    for (const slug of slugs) {
      const newToday = countsBySlugAndDay.get(slug)?.get(day) ?? 0;
      const cumulative = (cumulativeBySlug.get(slug) ?? 0) + newToday;
      cumulativeBySlug.set(slug, cumulative);
      point[slug] = cumulative;
    }
    return point;
  });

  return { days, data };
}

const MONTHS_PT = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

// "2026-08-23" -> "23-ago." — mesmo formato do print de referência que o
// usuário mandou (dia-mês abreviado).
export function formatTrendDay(isoDay: string): string {
  const [, month, day] = isoDay.split("-");
  const monthAbbrev = MONTHS_PT[Number(month) - 1] ?? month;
  return `${day}-${monthAbbrev}.`;
}

// Quantos rótulos de data cabem no eixo X sem virar borrão. O recharts
// desenha 1 rótulo a cada `interval + 1` pontos — com 45 dias e nenhum
// intervalo, seriam 45 datas espremidas numa coluna de ~400px.
const MAX_X_LABELS = 5;

export function xAxisInterval(pointCount: number): number {
  if (pointCount <= MAX_X_LABELS) return 0;
  return Math.ceil(pointCount / MAX_X_LABELS) - 1;
}
