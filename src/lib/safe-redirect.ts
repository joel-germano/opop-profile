const ALLOWED_NEXT_PATHS = new Set(["/painel/checkout"]);

// Único destino pós-login/cadastro que aceitamos via `next` — lista fechada
// em vez de validar formato, pra não abrir espaço de open redirect.
export function resolveNextPath(next: string | null | undefined): string | null {
  return next && ALLOWED_NEXT_PATHS.has(next) ? next : null;
}
