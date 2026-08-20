import "server-only";
import { randomBytes } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { TEMPLATE_MAX_BYTES } from "@/lib/resize-template";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "templates");

// PNG sempre — diferente do avatar, aqui a transparência (o "buraco" da
// moldura) precisa ser preservada, então não dá pra usar JPEG.
export async function saveTemplateFromDataUrl(dataUrl: string): Promise<string> {
  const match = /^data:image\/png;base64,(.+)$/.exec(dataUrl);
  if (!match) {
    throw new Error("Formato de imagem inválido");
  }

  const [, base64] = match;
  const buffer = Buffer.from(base64, "base64");

  // Reforço no servidor do mesmo limite de 1MB do resize client-side — não
  // dá pra confiar só no navegador ter aplicado o resize corretamente.
  if (buffer.length > TEMPLATE_MAX_BYTES) {
    throw new Error("Imagem maior que 1MB");
  }

  const filename = `${randomBytes(16).toString("hex")}.png`;

  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);

  return `/uploads/templates/${filename}`;
}

export async function deleteTemplateFile(imageUrl: string): Promise<void> {
  if (!imageUrl.startsWith("/uploads/templates/")) return;
  const filename = path.basename(imageUrl);
  try {
    await unlink(path.join(UPLOAD_DIR, filename));
  } catch {
    // arquivo já não existe ou não pôde ser removido — não é fatal
  }
}
