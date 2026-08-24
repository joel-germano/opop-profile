// Remove o dataset sintético de lançamento dos presidenciáveis (ver
// _docs/presidenciaveis-launch-seed.md pro contexto completo — por que
// existe, quais números, como identificar).
//
//   node scripts/cleanup-launch-seed.mjs          # só relata o que apagaria
//   node scripts/cleanup-launch-seed.mjs --fix    # relata E apaga de vez
//
// Todo documento sintético tem uma marca fácil de filtrar:
//   - supporters:          email começando com "apoiador.launch."
//   - supporterpurchases:  externalId começando com "launch-"
//   - galleryposts:        imageUrl começando com "/uploads/gallery/launch-"
// Nada fora desse padrão é tocado — apoio real de gente de verdade fica
// intacto mesmo rodando isso depois de já ter apoio de verdade misturado.
import fs from "node:fs";
import path from "node:path";
import { MongoClient } from "mongodb";

const DB_NAME = "eu-apoio";
const GALLERY_DIR = path.join(process.cwd(), "public", "uploads", "gallery");

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

  const supporterFilter = { email: { $regex: "^apoiador\\.launch\\." } };
  const purchaseFilter = { externalId: { $regex: "^launch-" } };
  const postFilter = { imageUrl: { $regex: "^/uploads/gallery/launch-" } };

  const [supporterCount, purchaseCount, posts] = await Promise.all([
    db.collection("supporters").countDocuments(supporterFilter),
    db.collection("supporterpurchases").countDocuments(purchaseFilter),
    db.collection("galleryposts").find(postFilter).toArray(),
  ]);

  console.log(`supporters (launch):         ${supporterCount}`);
  console.log(`supporterpurchases (launch): ${purchaseCount}`);
  console.log(`galleryposts (launch):       ${posts.length}`);

  // Um arquivo de imagem por candidato, reaproveitado em todos os posts
  // dele (ver script que gerou isso) — por isso a lista de arquivos é bem
  // menor que a de posts.
  const imageFiles = new Set(posts.map((p) => path.basename(p.imageUrl)));
  console.log(`arquivos de imagem (launch): ${imageFiles.size}`);

  if (!shouldFix) {
    console.log("\n(modo relatório — rode com --fix pra apagar de verdade)");
  } else {
    const [{ deletedCount: supportersDeleted }, { deletedCount: purchasesDeleted }, { deletedCount: postsDeleted }] =
      await Promise.all([
        db.collection("supporters").deleteMany(supporterFilter),
        db.collection("supporterpurchases").deleteMany(purchaseFilter),
        db.collection("galleryposts").deleteMany(postFilter),
      ]);

    let filesDeleted = 0;
    for (const file of imageFiles) {
      const full = path.join(GALLERY_DIR, file);
      if (fs.existsSync(full)) {
        fs.unlinkSync(full);
        filesDeleted++;
      }
    }

    console.log(
      `\napagados -> supporters: ${supportersDeleted} | purchases: ${purchasesDeleted} | posts: ${postsDeleted} | arquivos: ${filesDeleted}`
    );
  }
} finally {
  await client.close();
}
