"use server";

import bcrypt from "bcryptjs";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { SupporterModel } from "@/lib/models/supporter";
import { SupporterPurchaseModel } from "@/lib/models/supporter-purchase";
import {
  createSupporterSession,
  destroySupporterSession,
  getCurrentSupporter,
} from "@/lib/supporter-auth";
import { verifyGoogleIdToken } from "@/lib/google-verify";
import {
  createPixChargePresidenciaveis,
  chargeCreditCardPresidenciaveis,
} from "@/lib/efi-presidenciaveis";
import { mapChargeStatus } from "@/lib/efi-charge-status";
import { getPresidenciaveisPriceCents } from "@/lib/premium-price";
import { GalleryPostModel } from "@/lib/models/gallery-post";
import { GALLERY_FEED_PAGE_SIZE, MAX_FRAME_QUANTITY } from "@/lib/presidenciaveis-constants";

function clampQuantity(raw: number): number {
  if (!Number.isFinite(raw)) return 1;
  return Math.min(MAX_FRAME_QUANTITY, Math.max(1, Math.floor(raw)));
}

export type IdentifyState = { error: string } | { ok: true; unlocked: boolean } | null;

export async function identifySupporterAction(
  _prevState: IdentifyState,
  formData: FormData
): Promise<IdentifyState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Preencha email e senha." };
  if (password.length < 6) return { error: "A senha precisa ter pelo menos 6 caracteres." };

  await connectDB();
  const existing = await SupporterModel.findOne({ email });

  if (existing) {
    if (!existing.passwordHash) {
      return { error: "Esse email já está associado a um login com Google." };
    }
    const valid = await bcrypt.compare(password, existing.passwordHash);
    if (!valid) return { error: "Senha incorreta." };

    await createSupporterSession(String(existing._id));
    return { ok: true, unlocked: existing.unlocked ?? false };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const supporter = await SupporterModel.create({ email, passwordHash });
  await createSupporterSession(String(supporter._id));
  return { ok: true, unlocked: false };
}

export async function loginWithGoogleAction(idToken: string): Promise<IdentifyState> {
  const googleUser = await verifyGoogleIdToken(idToken);
  if (!googleUser) return { error: "Não foi possível validar o login do Google." };

  await connectDB();
  let supporter = await SupporterModel.findOne({
    $or: [{ googleId: googleUser.googleId }, { email: googleUser.email }],
  });

  if (!supporter) {
    supporter = await SupporterModel.create({
      email: googleUser.email,
      googleId: googleUser.googleId,
      name: googleUser.name,
    });
  } else if (!supporter.googleId) {
    supporter.googleId = googleUser.googleId;
    await supporter.save();
  }

  await createSupporterSession(String(supporter._id));
  return { ok: true, unlocked: supporter.unlocked ?? false };
}

export async function logoutSupporterAction() {
  await destroySupporterSession();
}

export type PixChargeResult =
  | { ok: true; txid: string; pixCopiaECola: string; qrCodeImage: string }
  | { ok: false; error: string };

export async function createSupporterPixChargeAction(
  quantity: number = 1
): Promise<PixChargeResult> {
  const supporter = await getCurrentSupporter();
  if (!supporter) return { ok: false, error: "Sessão expirada, identifique-se novamente." };

  // Sem trava de "já desbloqueou": diferente do Premium, aqui uma pessoa já
  // liberada pode comprar de novo pra ter mais convites pra presentear (ver
  // GiftInviteModal → "Comprar mais convites"). Cada compra soma em
  // frameCredits, nunca substitui.

  const safeQuantity = clampQuantity(quantity);

  try {
    await connectDB();
    const unitPriceCents = await getPresidenciaveisPriceCents();
    const amountCents = unitPriceCents * safeQuantity;
    const charge = await createPixChargePresidenciaveis({
      amountCents,
      description:
        safeQuantity === 1
          ? "Eu Apoio — desbloqueio presidenciáveis"
          : `Eu Apoio — desbloqueio presidenciáveis (${safeQuantity} molduras)`,
    });

    await SupporterPurchaseModel.create({
      supporterId: supporter._id,
      method: "pix",
      amountCents,
      quantity: safeQuantity,
      status: "pending",
      externalId: charge.txid,
      pixCopiaECola: charge.pixCopiaECola,
    });

    return {
      ok: true,
      txid: charge.txid,
      pixCopiaECola: charge.pixCopiaECola,
      qrCodeImage: charge.qrCodeImage,
    };
  } catch (err) {
    console.error("[createSupporterPixChargeAction]", err);
    return { ok: false, error: "Não foi possível gerar o Pix agora. Tente novamente." };
  }
}

export type CreditCardState = { error: string } | { success: true } | null;

export async function chargeSupporterCreditCardAction(
  _prevState: CreditCardState,
  formData: FormData
): Promise<CreditCardState> {
  const supporter = await getCurrentSupporter();
  if (!supporter) return { error: "Sessão expirada, identifique-se novamente." };

  // Sem trava de "já desbloqueou" — ver comentário equivalente em
  // createSupporterPixChargeAction.

  const paymentToken = String(formData.get("paymentToken") ?? "");
  const cardName = String(formData.get("cardName") ?? "").trim();
  const cpf = String(formData.get("cpf") ?? "").trim();
  const phoneNumber = String(formData.get("phoneNumber") ?? "").trim();
  const quantity = clampQuantity(Number(formData.get("quantity") ?? 1));

  if (!paymentToken) return { error: "Não foi possível validar o cartão. Tente novamente." };
  if (!cardName || !cpf || !phoneNumber) {
    return { error: "Preencha nome impresso no cartão, CPF e telefone." };
  }

  try {
    await connectDB();
    const unitPriceCents = await getPresidenciaveisPriceCents();
    const amountCents = unitPriceCents * quantity;
    const charge = await chargeCreditCardPresidenciaveis({
      amountCents,
      description:
        quantity === 1
          ? "Eu Apoio — desbloqueio presidenciáveis"
          : `Eu Apoio — desbloqueio presidenciáveis (${quantity} molduras)`,
      paymentToken,
      customer: { name: cardName, cpf, email: supporter.email, phoneNumber },
    });

    const outcome = mapChargeStatus(charge.status);

    await SupporterPurchaseModel.create({
      supporterId: supporter._id,
      method: "credit",
      amountCents,
      quantity,
      status: outcome,
      externalId: charge.chargeId,
      paidAt: outcome === "paid" ? new Date() : undefined,
    });

    if (outcome === "failed") {
      return { error: "Cartão não aprovado. Verifique os dados ou tente outro cartão." };
    }

    // Ver comentário equivalente em painel/checkout/actions.ts: status não
    // conclusivo não pode virar "falhou", senão o cliente tenta de novo e
    // acaba pagando duas vezes.
    if (outcome === "pending") {
      console.warn(`[presidenciaveis/cartão] status não conclusivo da Efí: ${charge.status}`);
      return {
        error:
          "Seu pagamento está em análise pela operadora. Não tente de novo: assim que for aprovado, seu acesso é liberado automaticamente.",
      };
    }

    await SupporterModel.findByIdAndUpdate(supporter._id, {
      $set: { unlocked: true, unlockedAt: new Date() },
      $inc: { frameCredits: quantity },
    });

    return { success: true };
  } catch (err) {
    console.error("[chargeSupporterCreditCardAction]", err);
    return { error: "Não foi possível processar o pagamento agora. Tente novamente." };
  }
}

// "Postar na galeria" não existe mais como passo manual — toda geração já
// salva automaticamente (ver generateFrameAction em invite-actions.ts), como
// "private" por padrão. O que resta aqui é só a leitura das vitrines
// PÚBLICAS, sempre filtrada por `visibility: "public"` — sem esse filtro,
// fotos privadas vazariam pra galeria de qualquer visitante.

export async function getGalleryPreviewAction(
  candidateSlug: string
): Promise<{ imageUrl: string }[]> {
  await connectDB();
  const posts = await GalleryPostModel.find({ candidateSlug, visibility: "public" })
    .sort({ createdAt: -1 })
    .limit(5)
    .select("imageUrl")
    .lean();
  return posts.map((p) => ({ imageUrl: p.imageUrl }));
}

// `visibility` opcional: só vem preenchido no filtro "só as minhas" (ver
// onlyMine abaixo), pra mostrar o selo pública/privada — na vitrine pública
// normal é sempre "public" por construção do query, não vale o round-trip.
export type GalleryFeedItem = {
  id: string;
  imageUrl: string;
  visibility?: "private" | "public";
};
export type GalleryFeedPage = { items: GalleryFeedItem[]; nextCursor: string | null };

// Paginação por cursor de _id (não skip/limit): cada página pede só "o que
// vem depois do último _id que eu já vi". Isso mantém a query com custo
// proporcional ao tamanho da página, não ao número de posts já vistos — um
// skip(1000000) obrigaria o Mongo a varrer e descartar 1 milhão de docs a
// cada carregamento. _id do Mongo já é crescente por criação, então ordenar
// por ele é equivalente a ordenar por "mais novo primeiro" e usa o índice
// padrão (_id), sem precisar de índice composto extra.
export async function getGalleryFeedAction(
  candidateSlug: string,
  cursor?: string | null,
  // Filtro "só as minhas" dentro da vitrine pública: sai do padrão
  // `visibility: "public"` pra `supporterId` do dono da sessão — seguro
  // porque o id vem da sessão (não de input do cliente), então só mostra o
  // que é da própria pessoa (pública OU privada), nunca de outro visitante.
  onlyMine?: boolean
): Promise<GalleryFeedPage> {
  await connectDB();

  const query: Record<string, unknown> = { candidateSlug };
  if (onlyMine) {
    const supporter = await getCurrentSupporter();
    if (!supporter) return { items: [], nextCursor: null };
    query.supporterId = supporter._id;
  } else {
    query.visibility = "public";
  }
  if (cursor && Types.ObjectId.isValid(cursor)) {
    query._id = { $lt: new Types.ObjectId(cursor) };
  }

  const docs = await GalleryPostModel.find(query)
    .sort({ _id: -1 })
    .limit(GALLERY_FEED_PAGE_SIZE)
    .select(onlyMine ? "imageUrl visibility" : "imageUrl")
    .lean();

  const items = docs.map((d) => ({
    id: String(d._id),
    imageUrl: d.imageUrl,
    ...(onlyMine ? { visibility: d.visibility as "private" | "public" } : {}),
  }));
  const nextCursor =
    items.length === GALLERY_FEED_PAGE_SIZE ? items[items.length - 1].id : null;

  return { items, nextCursor };
}
