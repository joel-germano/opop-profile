// Traduz o status que a Efí devolve numa cobrança de cartão para o status
// que guardamos no banco.
//
// O ponto sensível é o "resto": tratar qualquer coisa diferente de aprovado
// como `failed` faz o registro MENTIR quando a cobrança cai em análise
// antifraude — o dinheiro pode ter sido retido, mas a linha em
// /admin/pagamentos diz "failed", então ninguém investiga. Por isso só
// marcamos `failed` no que é recusa comprovada; o desconhecido vira
// `pending`, que é honesto e chama atenção para conferência manual.

export type ChargeOutcome = "paid" | "failed" | "pending";

// Autorizado/pago — libera o produto.
const PAID = new Set(["approved", "paid", "settled"]);

// Recusa ou encerramento sem cobrança — seguro dizer ao cliente que não
// passou, porque nada foi retido.
const FAILED = new Set(["unpaid", "canceled", "cancelled", "refused", "expired"]);

export function mapChargeStatus(efiStatus: string): ChargeOutcome {
  const status = efiStatus.toLowerCase();
  if (PAID.has(status)) return "paid";
  if (FAILED.has(status)) return "failed";
  return "pending";
}
