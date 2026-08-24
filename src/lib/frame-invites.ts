import "server-only";
import { connectDB } from "@/lib/db";
import { FrameInviteModel } from "@/lib/models/frame-invite";
import { SITE_URL } from "@/lib/site";

export type InviteSummaryItem = {
  id: string;
  token: string;
  url: string;
  status: "pending" | "used" | "revoked";
  sentToEmail: string | null;
  usedByEmail: string | null;
  usedAt: string | null;
  createdAt: string;
  // true quando a própria pessoa consumiu a vaga (outro modelo de moldura
  // pra ela mesma), não um convite resgatado por um amigo.
  selfUse: boolean;
};

export type InviteSummary = {
  /** Saldo comprado que ainda não foi debitado por autouso (frameCredits). */
  total: number;
  /** Vagas presas em convites pending ainda não resgatados (reservedForGifts). */
  reserved: number;
  /** Vagas que ainda dá pra transformar em convite (ou gerar pra si mesmo). */
  available: number;
  invites: InviteSummaryItem[];
};

export function buildInviteUrl(candidateSlug: string, token: string): string {
  return `${SITE_URL}/presidenciaveis/${candidateSlug}?convite=${token}`;
}

// Saldo + histórico de convites de um Supporter. `frameCredits` já vem
// líquido de autouso (generateFrameAction debita na hora, atomicamente) e
// `reservedForGifts` já vem líquido de convite pending (createFrameInviteAction
// reserva na hora, também atomicamente) — `available` é só a subtração dos
// dois campos do próprio Supporter, sem precisar contar FrameInvite pra
// calcular saldo (a contagem de docs aqui é só pro histórico exibido).
export async function getInviteSummary(
  supporterId: string,
  frameCredits: number,
  reservedForGifts: number
): Promise<InviteSummary> {
  await connectDB();

  const docs = await FrameInviteModel.find({
    inviterSupporterId: supporterId,
    status: { $ne: "revoked" },
  })
    .sort({ createdAt: -1 })
    .lean();

  const total = frameCredits ?? 0;
  const reserved = reservedForGifts ?? 0;
  const available = Math.max(0, total - reserved);

  return {
    total,
    reserved,
    available,
    invites: docs.map((d) => ({
      id: String(d._id),
      token: d.token,
      url: buildInviteUrl(d.candidateSlug, d.token),
      status: d.status as "pending" | "used" | "revoked",
      sentToEmail: d.sentToEmail ?? null,
      usedByEmail: d.usedByEmail ?? null,
      usedAt: d.usedAt ? d.usedAt.toISOString() : null,
      createdAt: d.createdAt.toISOString(),
      selfUse: d.selfUse ?? false,
    })),
  };
}

export type InviteContext = { token: string; inviterName: string };

// Lê o ?convite=... da URL e devolve o convite só se ele ainda vale. Não
// marca nada como usado — quem consome é redeemFrameInviteAction, no momento
// em que o convidado realmente vai gerar a moldura.
export async function getInviteContext(
  token: string | undefined,
  candidateSlug: string
): Promise<InviteContext | null> {
  if (!token) return null;

  await connectDB();
  const invite = await FrameInviteModel.findOne({
    token,
    candidateSlug,
    status: "pending",
  })
    .select("token inviterName")
    .lean();

  if (!invite) return null;

  return { token: invite.token, inviterName: invite.inviterName || "Um amigo" };
}
