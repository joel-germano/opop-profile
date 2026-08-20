import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { PaymentModel } from "@/lib/models/payment";
import { UserModel } from "@/lib/models/user";

type WebhookPixEntry = {
  txid: string;
  devolucoes?: { status: string }[];
};

function isValidToken(request: Request): boolean {
  const expected = process.env.PIX_WEBHOOK_SECRET;
  if (!expected) return false;

  // A Efí anexa "/pix" ao final da URL registrada quando chama o webhook
  // (mesmo comportamento documentado no assimAppPay, rota `/webhook(/pix)?`).
  // Como o token é o último trecho da URL, isso vira parte do valor da
  // query — precisa remover antes de comparar.
  const rawReceived = new URL(request.url).searchParams.get("token") ?? "";
  const received = rawReceived.replace(/\/pix$/, "");
  const expectedBuf = Buffer.from(expected);
  const receivedBuf = Buffer.from(received);
  if (expectedBuf.length !== receivedBuf.length) return false;

  return timingSafeEqual(expectedBuf, receivedBuf);
}

export async function POST(request: Request) {
  if (!isValidToken(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { pix?: WebhookPixEntry[] };

    for (const entry of body.pix ?? []) {
      if (!entry.txid) continue;

      const refunded = entry.devolucoes?.some((d) => d.status === "DEVOLVIDO");

      await connectDB();
      const payment = await PaymentModel.findOne({ externalId: entry.txid });
      if (!payment) continue;

      if (refunded) {
        if (payment.status === "refunded") continue;
        payment.status = "refunded";
        await payment.save();
        await UserModel.findByIdAndUpdate(payment.userId, { plan: "free" });
        continue;
      }

      if (payment.status === "paid") continue;

      payment.status = "paid";
      payment.paidAt = new Date();
      await payment.save();
      await UserModel.findByIdAndUpdate(payment.userId, {
        plan: "premium",
        premiumSince: new Date(),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[webhook/pix]", err);
    // 200 mesmo em erro: evita retentativas agressivas da Efí por falha nossa.
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
