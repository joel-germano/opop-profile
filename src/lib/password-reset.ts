import "server-only";
import { randomBytes, createHash } from "crypto";

const RESET_TOKEN_DURATION_MS = 60 * 60 * 1000; // 1 hora

export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// Retorna o token puro (vai só no link do email) e o que fica salvo no banco
// (hash + validade) — assim quem tiver acesso ao banco não consegue forjar
// um link de redefinição a partir do que está armazenado.
export function createResetToken(): {
  token: string;
  tokenHash: string;
  expires: Date;
} {
  const token = randomBytes(32).toString("hex");
  return {
    token,
    tokenHash: hashResetToken(token),
    expires: new Date(Date.now() + RESET_TOKEN_DURATION_MS),
  };
}
