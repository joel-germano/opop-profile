// Popula um dataset sintético de apoios a /presidenciaveis pra testar o
// painel admin (paginação, filtros, ranking, gráfico) com volume realista —
// ver _docs/presidenciaveis-launch-seed.md pro histórico da mesma técnica
// usada antes. Esse script substitui/atualiza aquele dataset com números e
// datas novas (22-24/10/2026, Lula 1º/628 apoios, Flávio 2º, Caiado 3º).
//
// Pra cada apoio fictício, os 3 documentos que um apoio real geraria:
//   - 1 Supporter (unlocked: true)
//   - 1 SupporterPurchase (status: "paid", 1 moldura, R$ 3,00)
//   - 1 GalleryPost (foto = avatar do candidato reaproveitado — ver doc)
//
// Marca de identificação (mesma da limpeza existente, scripts/cleanup-launch-seed.mjs):
//   supporters.email          começa com "apoiador.launch."
//   supporterpurchases.externalId  começa com "launch-"
//   galleryposts.imageUrl     começa com "/uploads/gallery/launch-"
//
//   node scripts/seed-presidenciaveis-mock.mjs          # só relata o plano
//   node scripts/seed-presidenciaveis-mock.mjs --fix    # relata E grava de vez
import fs from "node:fs";
import path from "node:path";
import { MongoClient, ObjectId } from "mongodb";

const DB_NAME = "eu-apoio";
const GALLERY_DIR = path.join(process.cwd(), "public", "uploads", "gallery");
const AVATARS_DIR = path.join(process.cwd(), "public", "uploads", "avatars");
const PRICE_CENTS = 300; // R$ 3,00 — DEFAULT_PRESIDENCIAVEIS_PRICE_CENTS (appsettings ainda não customizado)

// Datas do "surto" de apoio simulado — 3 dias corridos, mesmo padrão
// crescente que o dataset anterior usava (25% / 32% / 43% do total por dia).
const DAYS = ["2026-10-22", "2026-10-23", "2026-10-24"];
const DAY_SHARE = [0.25, 0.32, 0.43];

// Total do Lula é o dado fixo (628); os demais usam a MESMA proporção do
// dataset anterior (_docs/presidenciaveis-launch-seed.md), só reordenada
// pra Flávio ficar em 2º e Caiado em 3º (antes: Renan 3º, Caiado 4º).
const RATIO_TO_LULA = {
  lula: 1,
  "flavio-bolsonaro": 168 / 212, // 2º — mesma proporção que já era 2º antes
  "ronaldo-caiado": 104 / 212, // 3º — herda a proporção que era do Renan (3º antes)
  "renan-santos": 67 / 212, // 4º — herda a proporção que era do Caiado (4º antes)
  "romeu-zema": 38 / 212,
  "augusto-cury": 19 / 212,
};
const LULA_TOTAL = 628;

function splitByDay(total) {
  const day1 = Math.round(total * DAY_SHARE[0]);
  const day2 = Math.round(total * DAY_SHARE[1]);
  const day3 = total - day1 - day2;
  return [day1, day2, day3];
}

function randomTimeOnDay(isoDay) {
  // O gráfico de tendência agrupa por dia com $dateToString em UTC (sem
  // timezone), não America/Sao_Paulo — então o instante precisa cair no
  // mesmo dia civil já em UTC, senão "vaza" pro dia seguinte (foi o que
  // aconteceu com -03:00: horário local 21h-23h virava madrugada UTC do dia
  // depois). Construindo direto em "Z" o dia gravado é sempre exatamente
  // `isoDay`, pra qualquer hora entre 0h e 23h59.
  const hour = Math.floor(Math.random() * 24);
  const minute = Math.floor(Math.random() * 60);
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return new Date(`${isoDay}T${hh}:${mm}:00Z`);
}

function readUri() {
  const env = fs.readFileSync(new URL("../.env", import.meta.url), "utf8");
  const match = env.match(/^MONGODB_URI="(.+)"$/m);
  if (!match) throw new Error("MONGODB_URI não encontrada no .env");
  return match[1];
}

const shouldFix = process.argv.includes("--fix");
const client = new MongoClient(readUri());

try {
  await client.connect();
  const db = client.db(DB_NAME);

  const candidates = await db
    .collection("candidates")
    .find({ slug: { $in: Object.keys(RATIO_TO_LULA) } })
    .toArray();
  const bySlug = new Map(candidates.map((c) => [c.slug, c]));

  const missing = Object.keys(RATIO_TO_LULA).filter((slug) => !bySlug.has(slug));
  if (missing.length > 0) {
    throw new Error(`Candidato(s) não encontrado(s) no banco: ${missing.join(", ")}`);
  }

  fs.mkdirSync(GALLERY_DIR, { recursive: true });

  const supporters = [];
  const purchases = [];
  const posts = [];
  const plan = [];

  for (const [slug, ratio] of Object.entries(RATIO_TO_LULA)) {
    const candidate = bySlug.get(slug);
    const total = Math.round(LULA_TOTAL * ratio);
    const perDay = splitByDay(total);
    plan.push({ slug, name: candidate.name, total, perDay });

    // Imagem da galeria = avatar do candidato reaproveitado (mock, não é
    // foto de ninguém que realmente gerou moldura) — copia uma vez, todos os
    // posts sintéticos do candidato apontam pro mesmo arquivo.
    const ext = path.extname(candidate.photoUrl) || ".jpg";
    const galleryFileName = `launch-${slug}${ext}`;
    const galleryImageUrl = `/uploads/gallery/${galleryFileName}`;
    if (shouldFix) {
      const srcPath = path.join(process.cwd(), "public", candidate.photoUrl.replace(/^\//, ""));
      const destPath = path.join(GALLERY_DIR, galleryFileName);
      if (fs.existsSync(srcPath)) fs.copyFileSync(srcPath, destPath);
    }

    let n = 0;
    for (let dayIndex = 0; dayIndex < DAYS.length; dayIndex++) {
      const isoDay = DAYS[dayIndex];
      const count = perDay[dayIndex];

      for (let i = 0; i < count; i++) {
        n++;
        const supporterId = new ObjectId();
        const when = randomTimeOnDay(isoDay);
        const method = Math.random() < 0.75 ? "pix" : "credit";
        const visibility = Math.random() < 0.75 ? "public" : "private";

        supporters.push({
          _id: supporterId,
          email: `apoiador.launch.${slug}.${n}@mock.eu-apoio.local`,
          name: `Apoiador de ${candidate.name} (mock)`,
          unlocked: true,
          unlockedAt: when,
          frameCredits: 0, // comprou 1, usou 1 pra gerar a própria moldura — mesmo saldo final de um apoio real
          createdAt: when,
          updatedAt: when,
        });

        purchases.push({
          supporterId,
          method,
          amountCents: PRICE_CENTS,
          quantity: 1,
          status: "paid",
          externalId: `launch-${slug}-${n}`,
          paidAt: when,
          createdAt: when,
          updatedAt: when,
        });

        posts.push({
          candidateSlug: slug,
          supporterId,
          imageUrl: galleryImageUrl,
          visibility,
          createdAt: when,
          updatedAt: when,
        });
      }
    }
  }

  console.log("=== plano de apoios sintéticos (22-24/10/2026) ===");
  for (const p of plan) {
    console.log(
      `${p.name.padEnd(20)} total=${String(p.total).padStart(4)}  dia22=${p.perDay[0]}  dia23=${p.perDay[1]}  dia24=${p.perDay[2]}`
    );
  }
  const grandTotal = plan.reduce((sum, p) => sum + p.total, 0);
  console.log(`\nTotal geral: ${grandTotal} apoios · R$ ${((grandTotal * PRICE_CENTS) / 100).toFixed(2)} arrecadação simulada`);

  if (!shouldFix) {
    console.log("\n(modo relatório — rode com --fix pra gravar de vez)");
  } else {
    await db.collection("supporters").insertMany(supporters);
    await db.collection("supporterpurchases").insertMany(purchases);
    await db.collection("galleryposts").insertMany(posts);
    console.log(
      `\ngravado -> supporters: ${supporters.length} | purchases: ${purchases.length} | posts: ${posts.length}`
    );
  }
} finally {
  await client.close();
}
