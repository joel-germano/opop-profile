// Usado só se nunca configurado no /admin — o valor de verdade fica no
// AppSettingsModel (ver getPresidenciaveisPriceCents em premium-price.ts).
export const DEFAULT_PRESIDENCIAVEIS_PRICE_CENTS = 300; // R$ 3,00

// Teto de quantas molduras dá pra comprar de uma vez no desbloqueio (1 pra
// si + o resto pra presentear). Sem teto, um valor absurdo digitado por
// engano vira uma cobrança de cartão gigante sem confirmação nenhuma.
export const MAX_FRAME_QUANTITY = 10;

// Carrossel abaixo do botão "Escolha sua foto": só uma prévia, sem paginação.
export const GALLERY_PREVIEW_SIZE = 6;

// Modal "galeria completa": 8 linhas x 3 colunas por página, carregadas por
// scroll infinito (ver GalleryFeedModal + getGalleryFeedAction). Paginação
// por cursor de _id, não skip/limit — continua O(1) mesmo com 1 milhão de posts.
export const GALLERY_FEED_PAGE_SIZE = 24;
