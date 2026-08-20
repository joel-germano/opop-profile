import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { SupporterPurchaseModel } from "@/lib/models/supporter-purchase";
import { SupporterModel } from "@/lib/models/supporter";

// Cópia paralela de src/app/api/webhooks/pix/route.ts — ver
// src/lib/efi-presidenciaveis.ts pro porquê da chave/webhook separados.

type WebhookPixEntry = {
  txid: string;
  devolucoes?: { status: string }[];
};

function isValidToken(request: Request): boolean {
  const expected = process.env.PIX_WEBHOOK_SECRET_PRESIDENCIAVEIS;
  if (!expected) return false;

  // A Efí anexa "/pix" ao final da URL registrada (ver instrumentation.ts /
  // efi.ts) — mesmo tratamento aqui.
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
      const purchase = await SupporterPurchaseModel.findOne({ externalId: entry.txid });
      if (!purchase) continue;

      if (refunded) {
        if (purchase.status === "refunded") continue;
        purchase.status = "refunded";
        await purchase.save();
        await SupporterModel.findByIdAndUpdate(purchase.supporterId, { unlocked: false });
        continue;
      }

      if (purchase.status === "paid") continue;

      purchase.status = "paid";
      purchase.paidAt = new Date();
      await purchase.save();
      await SupporterModel.findByIdAndUpdate(purchase.supporterId, {
        unlocked: true,
        unlockedAt: new Date(),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[webhook/pix-presidenciaveis]", err);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
