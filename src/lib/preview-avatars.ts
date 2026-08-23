// Avatares placeholder (fotos geradas por IA, public/personas/) usados em
// prévias ilustrativas espalhadas pelo app (passo "Modelo de legenda",
// prévia de publicação no login/cadastro) — não representam pessoas reais.

// Suba este número sempre que trocar qualquer arquivo em public/personas/
// mantendo o mesmo nome. Sem isso, navegador/service worker/CDN continuam
// servindo a imagem antiga, já que a URL não mudou (mesmo padrão de
// PERSONA_ICON_VERSION em lib/assets.ts).
const PERSONAS_VERSION = 3;

export const PREVIEW_AVATARS = [
  "01",
  "03",
  "04",
  "05",
  "06",
  "07",
  "08",
  "09",
  "10",
  "11",
  "12",
  "13",
  "14",
  "15",
].map((n) => `/personas/${n}.png?v=${PERSONAS_VERSION}`);

export function randomPreviewAvatar(): string {
  return PREVIEW_AVATARS[Math.floor(Math.random() * PREVIEW_AVATARS.length)];
}
