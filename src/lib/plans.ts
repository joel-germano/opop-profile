// Chave única pra ligar/desligar a cobrança: com false, ninguém esbarra no
// limite de molduras nem precisa virar Premium pra usar tudo.
export const PAYMENTS_ENABLED = true;

export const PREMIUM_PRICE_CENTS = 500; // R$ 5,00

export const TEMPLATE_LIMITS: Record<"free" | "premium", number> = {
  free: 1,
  premium: Infinity,
};
