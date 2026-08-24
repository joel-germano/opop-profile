// Cor usada quando o candidato ainda não tem `color` definido no /admin —
// o próprio cyan de marca do site, neutro o bastante pra não parecer erro.
export const FALLBACK_CANDIDATE_COLOR = "#47C1F1";

// Texto escuro fixo — usado só nos badges de posição (nº do pódio), que são
// pequenos e sempre legíveis em qualquer cor das que o admin cadastra hoje.
export const CANDIDATE_BADGE_TEXT_COLOR = "#0B1220";

export function candidateColor(color: string | undefined | null): string {
  return color || FALLBACK_CANDIDATE_COLOR;
}

// Texto sobre uma área maior de cor sólida (pill de "N apoios") precisa de
// contraste calculado, não um tom fixo: amarelo/laranja claro pedem texto
// escuro, vermelho/verde/azul pedem branco. YIQ é a heurística de contraste
// perceptual mais simples pra isso — 160 (um pouco acima do 128 padrão) é o
// ponto que separa exatamente o amarelo (#FACC15, ~197) do resto da paleta
// pedida (vermelho ~92, verde ~137, azuis ~128-156, laranja ~144).
export function contrastTextColor(hex: string): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return "#FFFFFF";

  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 160 ? CANDIDATE_BADGE_TEXT_COLOR : "#FFFFFF";
}
