import "server-only";
import { randomBytes } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "covers");

// Gerada por canvas em 800px (ver COVER_SIZE em composite.ts), então na
// prática fica bem abaixo disso — o teto existe só pra barrar chamada fora
// do fluxo normal. Precisa caber no bodySizeLimit de 2mb das Server Actions
// mesmo depois do inchaço de ~33% do base64 (ver next.config.ts).
const COVER_MAX_BYTES = 1_400_000;

// Capa da campanha: composição de moldura + foto de prévia, refeita a cada
// "Publicar". Nome aleatório a cada gravação de propósito — como a URL muda,
// navegador/CDN nunca servem a capa antiga em cache.
export async function saveCoverFromDataUrl(dataUrl: string): Promise<string> {
  const match = /^data:image\/png;base64,(.+)$/.exec(dataUrl);
  if (!match) {
    throw new Error("Formato de imagem inválido");
  }

  const [, base64] = match;
  const buffer = Buffer.from(base64, "base64");

  if (buffer.length > COVER_MAX_BYTES) {
    throw new Error("Imagem grande demais");
  }

  const filename = `${randomBytes(16).toString("hex")}.png`;

  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);

  return `/uploads/covers/${filename}`;
}

// Best-effort: usada ao republicar (substituindo a capa) e ao excluir a
// conta. Ignora se o arquivo já não existir.
export async function deleteCover(coverUrl: string): Promise<void> {
  if (!coverUrl.startsWith("/uploads/covers/")) return;
  const filename = path.basename(coverUrl);
  try {
    await unlink(path.join(UPLOAD_DIR, filename));
  } catch {
    // arquivo já não existe ou não pôde ser removido — não é fatal
  }
}
