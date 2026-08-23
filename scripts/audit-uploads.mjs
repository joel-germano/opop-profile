// Audita public/uploads/ contra o banco: acusa arquivo que ninguém mais
// referencia (órfão) e referência que aponta pra arquivo inexistente.
//
//   node scripts/audit-uploads.mjs          # só relata
//   node scripts/audit-uploads.mjs --fix    # relata E apaga os órfãos
//
// Roda fora do Next (usa o driver do mongo direto), então não sofre com o
// cache de modelos do Mongoose — ver _docs/email.md e a nota sobre schema
// novo exigir restart do `next dev`.
import fs from "node:fs";
import path from "node:path";
import { MongoClient } from "mongodb";

const DB_NAME = "eu-apoio";

// Cada diretório e de onde vêm as referências que o mantêm vivo.
const DIRS = {
  avatars: [
    ["users", "photoUrl"],
    ["candidates", "photoUrl"],
  ],
  templates: [
    ["templates", "imageUrl"],
    ["candidatetemplates", "imageUrl"],
  ],
  previews: [
    ["users", "previewPhotoUrl"],
    ["campaigndrafts", "previewPhotoUrl"],
  ],
  covers: [
    ["users", "coverUrl"],
    ["campaigndrafts", "coverUrl"],
  ],
};

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

  let orphans = 0;
  let dangling = 0;

  for (const [dir, sources] of Object.entries(DIRS)) {
    const referenced = new Set();
    for (const [collection, field] of sources) {
      const docs = await db
        .collection(collection)
        .find({ [field]: { $nin: [null, ""] } }, { projection: { [field]: 1 } })
        .toArray();
      for (const doc of docs) referenced.add(doc[field]);
    }

    const absDir = path.join(process.cwd(), "public", "uploads", dir);
    console.log(`\n=== ${dir} ===`);

    if (!fs.existsSync(absDir)) {
      console.log("  (pasta ainda não existe)");
      continue;
    }

    const files = fs.readdirSync(absDir);
    if (files.length === 0) console.log("  (vazia)");

    for (const file of files) {
      const url = `/uploads/${dir}/${file}`;
      if (referenced.has(url)) continue;

      orphans += 1;
      if (shouldFix) {
        fs.unlinkSync(path.join(absDir, file));
        console.log(`  ÓRFÃO (apagado): ${file}`);
      } else {
        console.log(`  ÓRFÃO: ${file}`);
      }
    }

    for (const url of referenced) {
      if (fs.existsSync(path.join(process.cwd(), "public", url))) continue;
      dangling += 1;
      console.log(`  SEM ARQUIVO LOCAL: ${url}`);
    }
  }

  console.log(
    `\nórfãos: ${orphans}${shouldFix ? " (apagados)" : ""} | referências sem arquivo local: ${dangling}`
  );
  if (dangling > 0) {
    console.log(
      "Nota: em dev isso costuma ser registro criado em produção — mesmo Atlas,\n" +
        "volume de arquivos separado. Só é problema se aconteceu no próprio ambiente."
    );
  }
} finally {
  await client.close();
}
