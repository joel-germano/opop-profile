"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  TREND_RANGES,
  formatTrendDay,
  xAxisInterval,
  type TrendPoint,
} from "@/lib/candidate-trend";

type Series = { slug: string; name: string; color: string };

// Linhas do "resto do pelotão" — só contexto visual (mostra que tem gente
// disputando atrás dos líderes), por isso sem cor própria, sem rótulo e sem
// entrada na legenda. Mesma ideia do gráfico de pesquisa que serviu de
// referência: só quem lidera ganha destaque, o resto vira fundo.
const MUTED_LINE_COLOR = "#FFFFFF33";

function TrendTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { dataKey: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-[#1a1a1a] p-3 text-xs shadow-lg ring-1 ring-white/10">
      <p className="mb-1.5 font-bold text-white/50">{formatTrendDay(label ?? "")}</p>
      {payload
        .slice()
        .sort((a, b) => b.value - a.value)
        .map((entry) => (
          <p key={entry.dataKey} className="flex items-center gap-1.5 text-white">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: entry.color }}
              aria-hidden
            />
            <span className="tabular-nums font-bold">{entry.value}</span>
          </p>
        ))}
    </div>
  );
}

export function PresidenciaveisTrendChart({
  data,
  series,
  highlightCount = 3,
}: {
  data: TrendPoint[];
  series: Series[];
  highlightCount?: number;
}) {
  // Só oferece um período se existe mais dia do que ele mostra — sem isso,
  // "30 dias" e "Tudo" apareceriam idênticos com 5 dias de histórico.
  const availableRanges = useMemo(
    () => TREND_RANGES.filter((r, i) => i === 0 || data.length > TREND_RANGES[i - 1].days),
    [data.length]
  );
  const [rangeDays, setRangeDays] = useState<number>(
    () => availableRanges[availableRanges.length - 1].days
  );

  // Janela = os últimos N dias. É assim que gráfico de acompanhamento real
  // se comporta: os dias antigos saem pela esquerda em vez de espremer
  // tudo na mesma largura.
  const visible = useMemo(() => data.slice(-rangeDays), [data, rangeDays]);
  const interval = xAxisInterval(visible.length);

  const highlighted = series.slice(0, highlightCount);
  const muted = series.slice(highlightCount);

  return (
    <section className="w-full px-6">
      <div className="text-center">
        <span className="text-xs font-bold uppercase tracking-wide text-decor-coral">
          Evolução
        </span>
        <h2 className="mt-2 font-display text-2xl font-normal leading-tight tracking-wide text-white">
          A disputa dia a dia
        </h2>
        <p className="mt-3 text-base leading-snug text-white/60">
          O total acumulado de apoios de cada candidato, conforme os dias
          passam — sem pesquisa, sem estimativa. É só a contagem crescendo.
        </p>
      </div>

      <div className="mt-6 rounded-3xl bg-white/5 p-4 ring-1 ring-white/10">
        {availableRanges.length > 1 && (
          <div className="mb-3 flex justify-center gap-1.5">
            {availableRanges.map((range) => (
              <button
                key={range.days}
                type="button"
                onClick={() => setRangeDays(range.days)}
                aria-pressed={rangeDays === range.days}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                  rangeDays === range.days
                    ? "bg-white/15 text-white"
                    : "text-white/40 hover:bg-white/5 hover:text-white/70"
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        )}

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={visible} margin={{ top: 24, right: 40, left: 8, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.08)" />
              <XAxis
                dataKey="day"
                tickFormatter={formatTrendDay}
                interval={interval}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                dy={8}
              />
              <YAxis hide domain={[0, (max: number) => Math.ceil(max * 1.25 || 1)]} />
              <Tooltip content={<TrendTooltip />} cursor={{ stroke: "rgba(255,255,255,0.15)" }} />

              {muted.map((item) => (
                <Line
                  key={item.slug}
                  dataKey={item.slug}
                  stroke={MUTED_LINE_COLOR}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  isAnimationActive={false}
                />
              ))}

              {highlighted.map((item) => (
                <Line
                  key={item.slug}
                  dataKey={item.slug}
                  name={item.name}
                  stroke={item.color}
                  strokeWidth={2}
                  // Ponto só na ponta da linha: com 30/45 dias, um marcador
                  // por dia viraria uma fileira de bolinhas coladas.
                  dot={false}
                  activeDot={{ r: 5 }}
                  isAnimationActive={false}
                >
                  {/* Rótulo só no último ponto (o valor de hoje) — é o que
                      gráfico de acompanhamento real faz. Numerar todos os
                      pontos só funcionava com 3 dias na tela. */}
                  <LabelList
                    dataKey={item.slug}
                    position="right"
                    offset={8}
                    fill={item.color}
                    fontSize={12}
                    fontWeight={700}
                    content={(props) => {
                      const { x, y, value, index } = props as unknown as {
                        x: number;
                        y: number;
                        value: number;
                        index: number;
                      };
                      if (index !== visible.length - 1) return null;
                      return (
                        <text
                          x={x + 8}
                          y={y}
                          dy={4}
                          fill={item.color}
                          fontSize={12}
                          fontWeight={700}
                        >
                          {value}
                        </text>
                      );
                    }}
                  />
                </Line>
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Legenda só pros destacados — as linhas cinzas são só o "resto do
            pelotão", não pedem identidade própria aqui (já aparecem, com
            nome, no ranking logo acima). */}
        <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1.5 border-t border-white/10 pt-3">
          {highlighted.map((item) => (
            <div key={item.slug} className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: item.color }}
                aria-hidden
              />
              <span className="text-xs font-medium text-white/70">{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
