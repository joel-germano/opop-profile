import "server-only";
import { randomBytes } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "gallery");
const MAX_BYTES = 2_000_000; // 2MB — o card final já sai numa resolução fixa (~1080px)

// Recebe o PNG como Blob/File (argumento nativo de Server Action), não como
// data URL em base64: uma string de alguns MB passada como argumento comum
// estoura o decodificador de Flight desse Next ("Maximum array nesting
// exceeded") — Blob/File tem suporte nativo no protocolo e vira uma parte
// multipart separada em vez de entrar no texto serializado da chamada.
export async function saveGalleryPhotoFromBlob(blob: Blob): Promise<string> {
  if (blob.type !== "image/png") {
    throw new Error("Formato de imagem inválido");
  }
  if (blob.size > MAX_BYTES) {
    throw new Error("Imagem maior que 2MB");
  }

  const buffer = Buffer.from(await blob.arrayBuffer());

  const filename = `${randomBytes(16).toString("hex")}.png`;

  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);

  return `/uploads/gallery/${filename}`;
}

export async function deleteGalleryPhotoFile(imageUrl: string): Promise<void> {
  if (!imageUrl.startsWith("/uploads/gallery/")) return;
  const filename = path.basename(imageUrl);
  try {
    await unlink(path.join(UPLOAD_DIR, filename));
  } catch {
    // arquivo já não existe ou não pôde ser removido — não é fatal
  }
}
