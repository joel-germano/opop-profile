import "server-only";
import { randomBytes } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "avatars");

// Nome do arquivo único (hex: só números e letras a-f), independente do que
// o usuário chamava a foto original.
export async function saveAvatarFromDataUrl(dataUrl: string): Promise<string> {
  const match = /^data:image\/(png|jpe?g|webp);base64,(.+)$/.exec(dataUrl);
  if (!match) {
    throw new Error("Formato de imagem inválido");
  }

  const [, , base64] = match;
  const buffer = Buffer.from(base64, "base64");
  const filename = `${randomBytes(16).toString("hex")}.jpg`;

  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);

  return `/uploads/avatars/${filename}`;
}

// Best-effort: usada ao trocar de foto, pra não acumular arquivo órfão.
// Ignora se o arquivo já não existir.
export async function deleteAvatar(photoUrl: string): Promise<void> {
  if (!photoUrl.startsWith("/uploads/avatars/")) return;
  const filename = path.basename(photoUrl);
  try {
    await unlink(path.join(UPLOAD_DIR, filename));
  } catch {
    // arquivo já não existe ou não pôde ser removido — não é fatal
  }
}
