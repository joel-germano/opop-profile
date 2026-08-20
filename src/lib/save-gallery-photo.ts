import "server-only";
import { randomBytes } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "gallery");
const MAX_BYTES = 2_000_000; // 2MB — o card final já sai numa resolução fixa (~1080px)

export async function saveGalleryPhotoFromDataUrl(dataUrl: string): Promise<string> {
  const match = /^data:image\/png;base64,(.+)$/.exec(dataUrl);
  if (!match) {
    throw new Error("Formato de imagem inválido");
  }

  const [, base64] = match;
  const buffer = Buffer.from(base64, "base64");

  if (buffer.length > MAX_BYTES) {
    throw new Error("Imagem maior que 2MB");
  }

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
