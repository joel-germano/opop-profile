const compactNumberFormatter = new Intl.NumberFormat("pt-BR", {
  notation: "compact",
  compactDisplay: "short",
});

// "7,4 mil", "1 mi" etc — mesma abreviação usada em contadores de audiência
// pra número grande não estourar o layout do badge.
export function formatCompactNumber(value: number) {
  return compactNumberFormatter.format(value);
}
