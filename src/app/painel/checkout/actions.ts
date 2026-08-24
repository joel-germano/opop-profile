"use server";

import { connectDB } from "@/lib/db";
import { PaymentModel } from "@/lib/models/payment";
import { UserModel } from "@/lib/models/user";
import { getCurrentUser } from "@/lib/auth";
import {
  createPixCharge,
  chargeCreditCard,
  PIX_EXPIRATION_SECONDS,
} from "@/lib/efi";
import { getPremiumPriceCents } from "@/lib/premium-price";
import { mapChargeStatus } from "@/lib/efi-charge-status";

export type PixChargeResult =
  | {
      ok: true;
      txid: string;
      pixCopiaECola: string;
      qrCodeImage: string;
      expiresInSeconds: number;
    }
  | { ok: false; error: string };

export async function createPixChargeAction(): Promise<PixChargeResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sessão expirada, faça login novamente." };

  // Trava contra cobrança duplicada: a página já esconde o checkout de quem
  // é Premium, mas uma aba aberta de antes (ou que virou Premium por outro
  // meio no meio do caminho) ainda conseguiria disparar esta action.
  if (user.plan === "premium") {
    return { ok: false, error: "Sua conta já é Premium — nada a pagar." };
  }

  try {
    await connectDB();
    const premiumPriceCents = await getPremiumPriceCents();
    const charge = await createPixCharge({
      amountCents: premiumPriceCents,
      description: "Eu Apoio Premium",
    });

    await PaymentModel.create({
      userId: user._id,
      method: "pix",
      amountCents: premiumPriceCents,
      status: "pending",
      externalId: charge.txid,
      pixCopiaECola: charge.pixCopiaECola,
    });

    return {
      ok: true,
      txid: charge.txid,
      pixCopiaECola: charge.pixCopiaECola,
      qrCodeImage: charge.qrCodeImage,
      expiresInSeconds: PIX_EXPIRATION_SECONDS,
    };
  } catch (err) {
    console.error("[createPixChargeAction]", err);
    return { ok: false, error: "Não foi possível gerar o Pix agora. Tente novamente." };
  }
}

export type CreditCardState = { error: string } | { success: true } | null;

export async function chargeCreditCardAction(
  _prevState: CreditCardState,
  formData: FormData
): Promise<CreditCardState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sessão expirada, faça login novamente." };

  // Mesma trava do Pix — aqui é ainda mais crítica: o cartão cobra de
  // verdade e na hora, então sem isso dá pra pagar duas vezes pelo mesmo.
  if (user.plan === "premium") {
    return { error: "Sua conta já é Premium — nada a pagar." };
  }

  const paymentToken = String(formData.get("paymentToken") ?? "");
  const cardName = String(formData.get("cardName") ?? "").trim();
  const cpf = String(formData.get("cpf") ?? "").trim();

  if (!paymentToken) {
    return { error: "Não foi possível validar o cartão. Tente novamente." };
  }
  if (!cardName || !cpf) {
    return { error: "Preencha o nome impresso no cartão e o CPF do titular." };
  }

  try {
    await connectDB();
    const premiumPriceCents = await getPremiumPriceCents();
    const charge = await chargeCreditCard({
      amountCents: premiumPriceCents,
      description: "Eu Apoio Premium",
      paymentToken,
      customer: {
        name: cardName,
        cpf,
        email: user.email,
        phoneNumber: user.whatsapp,
      },
    });

    const outcome = mapChargeStatus(charge.status);

    await PaymentModel.create({
      userId: user._id,
      method: "credit",
      amountCents: premiumPriceCents,
      status: outcome,
      externalId: charge.chargeId,
      paidAt: outcome === "paid" ? new Date() : undefined,
    });

    if (outcome === "failed") {
      return { error: "Cartão não aprovado. Verifique os dados ou tente outro cartão." };
    }

    // Análise antifraude ou status que não conhecemos: não dá pra afirmar
    // que falhou (o valor pode estar retido), então fica pendente e o
    // usuário é avisado, em vez de ouvir "não aprovado" e tentar de novo —
    // o que geraria uma segunda cobrança.
    if (outcome === "pending") {
      console.warn(`[checkout/cartão] status não conclusivo da Efí: ${charge.status}`);
      return {
        error:
          "Seu pagamento está em análise pela operadora. Não tente de novo: assim que for aprovado, seu Premium é liberado automaticamente.",
      };
    }

    await UserModel.findByIdAndUpdate(user._id, {
      plan: "premium",
      premiumSince: new Date(),
    });

    return { success: true };
  } catch (err) {
    console.error("[chargeCreditCardAction]", err);
    return { error: "Não foi possível processar o pagamento agora. Tente novamente." };
  }
}
