"use server";

import { randomBytes } from "crypto";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { FrameInviteModel } from "@/lib/models/frame-invite";
import { GalleryPostModel } from "@/lib/models/gallery-post";
import { SupporterModel } from "@/lib/models/supporter";
import { getCurrentSupporter } from "@/lib/supporter-auth";
import { saveGalleryPhotoFromBlob } from "@/lib/save-gallery-photo";
import {
  buildInviteUrl,
  getInviteSummary,
  type InviteSummary,
} from "@/lib/frame-invites";
import { sendFrameInviteEmail } from "@/lib/email";

// 12 caracteres URL-safe (~72 bits) — o token é a única credencial do
// convite, então precisa ser aleatório o bastante pra ninguém varrer a faixa
// tentando resgatar convite dos outros.
function generateToken(): string {
  return randomBytes(9).toString("base64url");
}

export type InviteSummaryResult =
  | { ok: true; summary: InviteSummary }
  | { ok: false; error: string };

export async function getMyInviteSummaryAction(): Promise<InviteSummaryResult> {
  const supporter = await getCurrentSupporter();
  if (!supporter) return { ok: false, error: "Sessão expirada, identifique-se novamente." };

  const summary = await getInviteSummary(
    String(supporter._id),
    supporter.frameCredits ?? 0,
    supporter.reservedForGifts ?? 0
  );
  return { ok: true, summary };
}

export async function createFrameInviteAction(
  candidateSlug: string
): Promise<InviteSummaryResult> {
  const supporter = await getCurrentSupporter();
  if (!supporter) return { ok: false, error: "Sessão expirada, identifique-se novamente." };

  await connectDB();

  // Atômico de verdade (num document só, com $expr): reserva 1 vaga só se
  // `frameCredits - reservedForGifts >= 1`. Sem isso, um convite pending sem
  // reserva real deixava generateFrameAction (self-use) gastar o mesmo
  // crédito por baixo — o amigo resgatava depois e ganhava moldura de graça,
  // sem compra nenhuma por trás (era exatamente esse o bug).
  const reserved = await SupporterModel.findOneAndUpdate(
    {
      _id: supporter._id,
      $expr: { $gte: [{ $subtract: ["$frameCredits", "$reservedForGifts"] }, 1] },
    },
    { $inc: { reservedForGifts: 1 } },
    { new: true }
  );
  if (!reserved) {
    return { ok: false, error: "Você não tem molduras sobrando pra presentear." };
  }

  try {
    await FrameInviteModel.create({
      token: generateToken(),
      inviterSupporterId: supporter._id,
      inviterName: supporter.name || supporter.email,
      candidateSlug,
      status: "pending",
    });
  } catch (err) {
    console.error("[createFrameInviteAction]", err);
    // Devolve a reserva — sem isso, uma falha aqui trancaria 1 vaga que
    // nunca virou convite nenhum.
    await SupporterModel.findByIdAndUpdate(supporter._id, {
      $inc: { reservedForGifts: -1 },
    });
    return { ok: false, error: "Não foi possível gerar o convite. Tente novamente." };
  }

  const updated = await getInviteSummary(
    String(supporter._id),
    reserved.frameCredits ?? 0,
    reserved.reservedForGifts ?? 0
  );
  return { ok: true, summary: updated };
}

export async function sendFrameInviteEmailAction(
  token: string,
  email: string
): Promise<InviteSummaryResult> {
  const supporter = await getCurrentSupporter();
  if (!supporter) return { ok: false, error: "Sessão expirada, identifique-se novamente." };

  const to = email.trim().toLowerCase();
  if (!to || !to.includes("@")) return { ok: false, error: "Email inválido." };

  await connectDB();
  // Filtra pelo dono também: sem isso, qualquer pessoa logada poderia
  // disparar email usando o token de um convite alheio.
  const invite = await FrameInviteModel.findOne({
    token,
    inviterSupporterId: supporter._id,
    status: "pending",
  });
  if (!invite) return { ok: false, error: "Convite não encontrado ou já utilizado." };

  try {
    await sendFrameInviteEmail(to, {
      inviterName: supporter.name || "Alguém",
      inviteUrl: buildInviteUrl(invite.candidateSlug, invite.token),
    });
  } catch (err) {
    console.error("[sendFrameInviteEmailAction]", err);
    return { ok: false, error: "Não foi possível enviar o email agora. Tente de novo." };
  }

  invite.sentToEmail = to;
  invite.sentAt = new Date();
  await invite.save();

  const summary = await getInviteSummary(
    String(supporter._id),
    supporter.frameCredits ?? 0,
    supporter.reservedForGifts ?? 0
  );
  return { ok: true, summary };
}

export type RedeemResult = { ok: true } | { ok: false; error: string };

// Consome o convite e credita 1 moldura pro convidado (não desbloqueia
// geração ilimitada — o convidado gasta essa vaga do mesmo jeito que
// qualquer outra, ao efetivamente gerar em generateFrameAction). Só é
// chamado no momento em que a pessoa vai de fato tentar gerar a moldura —
// antes disso o link continua válido.
export async function redeemFrameInviteAction(token: string): Promise<RedeemResult> {
  const supporter = await getCurrentSupporter();
  if (!supporter) return { ok: false, error: "Identifique-se pra resgatar o convite." };

  await connectDB();

  const invite = await FrameInviteModel.findOne({ token }).select(
    "status inviterSupporterId"
  );
  if (!invite) return { ok: false, error: "Convite não encontrado." };
  if (invite.status !== "pending") {
    return { ok: false, error: "Esse convite já foi utilizado." };
  }
  if (String(invite.inviterSupporterId) === String(supporter._id)) {
    return { ok: false, error: "Você não pode resgatar o próprio convite." };
  }

  // Atômico de propósito: o filtro `status: "pending"` só casa uma vez, então
  // dois cliques simultâneos no mesmo link não conseguem resgatar duas vezes
  // um convite só.
  const claimed = await FrameInviteModel.findOneAndUpdate(
    { token, status: "pending" },
    {
      $set: {
        status: "used",
        usedBySupporterId: supporter._id,
        usedByEmail: supporter.email,
        usedAt: new Date(),
      },
    },
    { new: true }
  );
  if (!claimed) return { ok: false, error: "Esse convite já foi utilizado." };

  const rollbackInvite = async () => {
    await FrameInviteModel.findByIdAndUpdate(claimed._id, {
      $set: { status: "pending" },
      $unset: { usedBySupporterId: "", usedByEmail: "", usedAt: "" },
    });
  };

  // Converte a reserva de quem convidou (reservedForGifts) num gasto de
  // verdade (frameCredits) — é só agora, no resgate, que a compra original
  // é efetivamente debitada. Guard atômico (frameCredits/reservedForGifts
  // >= 1) por segurança: com createFrameInviteAction reservando certo isso
  // nunca deveria falhar, mas se falhar aqui é bug real, não "cair pra 0" em
  // silêncio — melhor recusar o resgate do que criar moldura sem lastro.
  const debitedGiver = await SupporterModel.findOneAndUpdate(
    {
      _id: invite.inviterSupporterId,
      frameCredits: { $gte: 1 },
      reservedForGifts: { $gte: 1 },
    },
    { $inc: { frameCredits: -1, reservedForGifts: -1 } }
  );
  if (!debitedGiver) {
    console.error(
      "[redeemFrameInviteAction] convite pending sem reserva correspondente no doador",
      { inviterSupporterId: String(invite.inviterSupporterId), token }
    );
    await rollbackInvite();
    return { ok: false, error: "Não foi possível resgatar agora. Tente novamente." };
  }

  try {
    // +1 moldura pro convidado — é isso que o convite "vale". A pessoa ainda
    // precisa gerar de fato (generateFrameAction) pra consumir essa vaga.
    await SupporterModel.findByIdAndUpdate(supporter._id, {
      $set: { unlocked: true, unlockedAt: new Date() },
      $inc: { frameCredits: 1 },
    });
  } catch (err) {
    // Devolve o convite pro estado anterior E a reserva de quem convidou —
    // sem isso, uma falha aqui queimaria a moldura de quem convidou sem
    // creditar ninguém.
    console.error("[redeemFrameInviteAction] rollback", err);
    await SupporterModel.findByIdAndUpdate(invite.inviterSupporterId, {
      $inc: { frameCredits: 1, reservedForGifts: 1 },
    });
    await rollbackInvite();
    return { ok: false, error: "Não foi possível resgatar agora. Tente novamente." };
  }

  return { ok: true };
}

export type GenerateFrameResult =
  | { ok: true; postId: string; imageUrl: string }
  | { ok: false; error: string; code?: "no-credits" };

// Consome 1 moldura e salva o resultado — obrigatório, não é mais opcional
// "postar na galeria" depois. Toda geração vira um GalleryPost "private" por
// padrão (a pessoa decide depois se torna pública, ver
// setGalleryPostVisibilityAction) e conta pro placar do candidato mesmo
// privada (ranking soma GalleryPost por candidateSlug sem filtrar
// visibilidade — só as vitrines públicas filtram).
export async function generateFrameAction(
  candidateSlug: string,
  imageFile: Blob
): Promise<GenerateFrameResult> {
  const supporter = await getCurrentSupporter();
  if (!supporter) return { ok: false, error: "Sessão expirada, identifique-se novamente." };
  if (!imageFile || imageFile.size === 0) {
    return { ok: false, error: "Nenhuma imagem pra salvar." };
  }

  await connectDB();

  // Atômico: só desconta se ainda sobra saldo LIVRE (filtro + $inc numa
  // única operação) — evita duas coisas ao mesmo tempo: (1) duas gerações
  // simultâneas da mesma pessoa descontando o mesmo crédito duas vezes
  // (clássico check-then-act); (2) gastar aqui um crédito que já tem um
  // convite "pending" reservado em cima dele (`reservedForGifts`) — sem o
  // `$expr`, dava pra criar um convite, gerar uma moldura pra si mesma
  // gastando o mesmo crédito, e o amigo resgatar depois ganhando uma
  // moldura sem nenhuma compra por trás.
  const debited = await SupporterModel.findOneAndUpdate(
    {
      _id: supporter._id,
      $expr: { $gte: [{ $subtract: ["$frameCredits", "$reservedForGifts"] }, 1] },
    },
    { $inc: { frameCredits: -1 } },
    { new: true }
  );
  if (!debited) {
    return {
      ok: false,
      code: "no-credits",
      error: "Você não tem molduras disponíveis. Compre mais pra continuar.",
    };
  }

  try {
    const imageUrl = await saveGalleryPhotoFromBlob(imageFile);
    const post = await GalleryPostModel.create({
      candidateSlug,
      supporterId: supporter._id,
      imageUrl,
      visibility: "private",
    });

    // Mesmo ledger usado pro saldo de convites (ver getInviteSummary): toda
    // geração — própria ou vinda de convite resgatado — vira uma entrada
    // aqui, então "quanto eu já usei" nunca diverge de frameCredits.
    await FrameInviteModel.create({
      token: generateToken(),
      inviterSupporterId: supporter._id,
      inviterName: supporter.name || supporter.email,
      candidateSlug,
      status: "used",
      selfUse: true,
      usedBySupporterId: supporter._id,
      usedByEmail: supporter.email,
      usedAt: new Date(),
    });

    return { ok: true, postId: String(post._id), imageUrl: post.imageUrl };
  } catch (err) {
    console.error("[generateFrameAction]", err);
    // Devolve o crédito — sem isso, uma falha de gravação "cobraria" uma
    // moldura que a pessoa nunca recebeu.
    await SupporterModel.findByIdAndUpdate(supporter._id, {
      $inc: { frameCredits: 1 },
    });
    return { ok: false, error: "Não foi possível salvar sua moldura. Tente novamente." };
  }
}

export type VisibilityResult =
  | { ok: true; visibility: "private" | "public" }
  | { ok: false; error: string };

export async function setGalleryPostVisibilityAction(
  postId: string,
  visibility: "private" | "public"
): Promise<VisibilityResult> {
  const supporter = await getCurrentSupporter();
  if (!supporter) return { ok: false, error: "Sessão expirada, identifique-se novamente." };
  if (!Types.ObjectId.isValid(postId)) return { ok: false, error: "Moldura não encontrada." };

  await connectDB();
  // Filtra pelo dono: ninguém torna pública (ou esconde) a moldura de outra
  // pessoa só por saber o id.
  const post = await GalleryPostModel.findOneAndUpdate(
    { _id: postId, supporterId: supporter._id },
    { $set: { visibility } },
    { new: true }
  ).select("visibility");
  if (!post) return { ok: false, error: "Moldura não encontrada." };

  return { ok: true, visibility: post.visibility as "private" | "public" };
}

export type MyGalleryItem = {
  id: string;
  candidateSlug: string;
  imageUrl: string;
  visibility: "private" | "public";
  createdAt: string;
};
export type MyGalleryPage = { items: MyGalleryItem[]; nextCursor: string | null };
export type MyGalleryResult = MyGalleryPage | { error: string };

const MY_GALLERY_PAGE_SIZE = 24;

// "Minha Galeria": todas as molduras que a própria pessoa já gerou, em
// qualquer candidato, pública ou privada — é o "pegar depois" que a compra
// promete, já que gerar de novo gastaria outra moldura. Paginação por
// cursor de _id, mesmo padrão de getGalleryFeedAction.
export async function getMyGalleryAction(cursor?: string | null): Promise<MyGalleryResult> {
  const supporter = await getCurrentSupporter();
  if (!supporter) return { error: "Sessão expirada, identifique-se novamente." };

  await connectDB();
  const query: Record<string, unknown> = { supporterId: supporter._id };
  if (cursor && Types.ObjectId.isValid(cursor)) {
    query._id = { $lt: new Types.ObjectId(cursor) };
  }

  const docs = await GalleryPostModel.find(query)
    .sort({ _id: -1 })
    .limit(MY_GALLERY_PAGE_SIZE)
    .select("candidateSlug imageUrl visibility createdAt")
    .lean();

  const items = docs.map((d) => ({
    id: String(d._id),
    candidateSlug: d.candidateSlug,
    imageUrl: d.imageUrl,
    visibility: d.visibility as "private" | "public",
    createdAt: d.createdAt.toISOString(),
  }));
  const nextCursor =
    items.length === MY_GALLERY_PAGE_SIZE ? items[items.length - 1].id : null;

  return { items, nextCursor };
}
