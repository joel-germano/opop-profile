"use server";

import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { SupporterModel } from "@/lib/models/supporter";
import { SupporterPurchaseModel } from "@/lib/models/supporter-purchase";
import { createSupporterSession, getCurrentSupporter } from "@/lib/supporter-auth";
import { verifyGoogleIdToken } from "@/lib/google-verify";
import {
  createPixChargePresidenciaveis,
  chargeCreditCardPresidenciaveis,
} from "@/lib/efi-presidenciaveis";
import { PRESIDENCIAVEIS_PRICE_CENTS } from "@/lib/presidenciaveis-constants";
import { mapChargeStatus } from "@/lib/efi-charge-status";
import { GalleryPostModel } from "@/lib/models/gallery-post";
import { saveGalleryPhotoFromDataUrl } from "@/lib/save-gallery-photo";

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

export type PixChargeResult =
  | { ok: true; txid: string; pixCopiaECola: string; qrCodeImage: string }
  | { ok: false; error: string };

export async function createSupporterPixChargeAction(): Promise<PixChargeResult> {
  const supporter = await getCurrentSupporter();
  if (!supporter) return { ok: false, error: "Sessão expirada, identifique-se novamente." };

  // Trava contra cobrança duplicada (mesma do checkout Premium): quem já
  // desbloqueou não tem o que pagar de novo.
  if (supporter.unlocked) {
    return { ok: false, error: "Seu acesso já está liberado — nada a pagar." };
  }

  try {
    await connectDB();
    const charge = await createPixChargePresidenciaveis({
      amountCents: PRESIDENCIAVEIS_PRICE_CENTS,
      description: "Eu Apoio — desbloqueio presidenciáveis",
    });

    await SupporterPurchaseModel.create({
      supporterId: supporter._id,
      method: "pix",
      amountCents: PRESIDENCIAVEIS_PRICE_CENTS,
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

  // Mesma trava do Pix — no cartão é ainda mais crítica: cobra na hora.
  if (supporter.unlocked) {
    return { error: "Seu acesso já está liberado — nada a pagar." };
  }

  const paymentToken = String(formData.get("paymentToken") ?? "");
  const cardName = String(formData.get("cardName") ?? "").trim();
  const cpf = String(formData.get("cpf") ?? "").trim();
  const phoneNumber = String(formData.get("phoneNumber") ?? "").trim();

  if (!paymentToken) return { error: "Não foi possível validar o cartão. Tente novamente." };
  if (!cardName || !cpf || !phoneNumber) {
    return { error: "Preencha nome impresso no cartão, CPF e telefone." };
  }

  try {
    await connectDB();
    const charge = await chargeCreditCardPresidenciaveis({
      amountCents: PRESIDENCIAVEIS_PRICE_CENTS,
      description: "Eu Apoio — desbloqueio presidenciáveis",
      paymentToken,
      customer: { name: cardName, cpf, email: supporter.email, phoneNumber },
    });

    const outcome = mapChargeStatus(charge.status);

    await SupporterPurchaseModel.create({
      supporterId: supporter._id,
      method: "credit",
      amountCents: PRESIDENCIAVEIS_PRICE_CENTS,
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
      unlocked: true,
      unlockedAt: new Date(),
    });

    return { success: true };
  } catch (err) {
    console.error("[chargeSupporterCreditCardAction]", err);
    return { error: "Não foi possível processar o pagamento agora. Tente novamente." };
  }
}

export type GalleryPostState = { error: string } | { success: true } | null;

export async function postToGalleryAction(
  candidateSlug: string,
  formData: FormData
): Promise<GalleryPostState> {
  const supporter = await getCurrentSupporter();
  if (!supporter?.unlocked) return { error: "É preciso desbloquear antes de postar." };

  const imageDataUrl = String(formData.get("imageDataUrl") ?? "");
  if (!imageDataUrl) return { error: "Nenhuma imagem pra postar." };

  await connectDB();

  // Reforçado aqui e também pelo índice único no schema (candidateSlug +
  // supporterId) — um apoiador só pode ter uma foto por candidato na galeria.
  const existing = await GalleryPostModel.findOne({
    candidateSlug,
    supporterId: supporter._id,
  }).select("_id");
  if (existing) {
    return { error: "Você já postou uma foto na galeria desse candidato." };
  }

  try {
    const imageUrl = await saveGalleryPhotoFromDataUrl(imageDataUrl);
    await GalleryPostModel.create({ candidateSlug, supporterId: supporter._id, imageUrl });
    return { success: true };
  } catch (err) {
    if (err instanceof Error && "code" in err && err.code === 11000) {
      return { error: "Você já postou uma foto na galeria desse candidato." };
    }
    console.error("[postToGalleryAction]", err);
    return { error: "Não foi possível postar na galeria. Tente novamente." };
  }
}

export async function hasPostedToGalleryAction(candidateSlug: string): Promise<boolean> {
  const supporter = await getCurrentSupporter();
  if (!supporter) return false;

  await connectDB();
  const existing = await GalleryPostModel.findOne({
    candidateSlug,
    supporterId: supporter._id,
  }).select("_id");
  return Boolean(existing);
}

export async function getGalleryPreviewAction(
  candidateSlug: string
): Promise<{ imageUrl: string }[]> {
  await connectDB();
  const posts = await GalleryPostModel.find({ candidateSlug })
    .sort({ createdAt: -1 })
    .limit(5)
    .select("imageUrl")
    .lean();
  return posts.map((p) => ({ imageUrl: p.imageUrl }));
}
