import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { PaymentModel } from "@/lib/models/payment";
import { getCurrentUser } from "@/lib/auth";

// Só lê o status já gravado no nosso banco (atualizado pelo webhook) —
// nunca consulta a Efí aqui, pra não gerar chamada repetida à API deles
// a cada poll do cliente.
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const txid = new URL(request.url).searchParams.get("txid");
  if (!txid) return NextResponse.json({ error: "txid obrigatório" }, { status: 400 });

  await connectDB();
  const payment = await PaymentModel.findOne({ externalId: txid, userId: user._id }).select(
    "status"
  );
  if (!payment) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json({ status: payment.status });
}
