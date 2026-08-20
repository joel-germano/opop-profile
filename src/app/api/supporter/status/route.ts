import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { SupporterPurchaseModel } from "@/lib/models/supporter-purchase";
import { getCurrentSupporter } from "@/lib/supporter-auth";

// Só lê o status já gravado no nosso banco (atualizado pelo webhook) — nunca
// consulta a Efí aqui. Mesmo cuidado do /api/checkout/status.
export async function GET(request: Request) {
  const supporter = await getCurrentSupporter();
  if (!supporter) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const txid = new URL(request.url).searchParams.get("txid");
  if (!txid) return NextResponse.json({ error: "txid obrigatório" }, { status: 400 });

  await connectDB();
  const purchase = await SupporterPurchaseModel.findOne({
    externalId: txid,
    supporterId: supporter._id,
  }).select("status");
  if (!purchase) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json({ status: purchase.status });
}
