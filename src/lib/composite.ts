import type { PhotoTransform } from "./photo-transform";
import { combineFilters } from "./photo-filters";
import { textFontSizePx, type TextLayer } from "./text-layer";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawBlurredCoverBackground(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  targetW: number,
  targetH: number,
  filterCss: string
) {
  const scale = Math.max(targetW / img.width, targetH / img.height) * 1.15;
  const drawW = img.width * scale;
  const drawH = img.height * scale;
  const dx = (targetW - drawW) / 2;
  const dy = (targetH - drawH) / 2;

  ctx.save();
  ctx.filter = combineFilters(`blur(${Math.round(targetW * 0.0625)}px)`, filterCss);
  ctx.drawImage(img, dx, dy, drawW, drawH);
  ctx.restore();
}

function drawContainWithTransform(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  targetW: number,
  targetH: number,
  transform: PhotoTransform,
  filterCss: string
) {
  const baseScale = Math.min(targetW / img.width, targetH / img.height);
  const scale = baseScale * transform.scale;
  const drawW = img.width * scale;
  const drawH = img.height * scale;
  const centerX = targetW * (0.5 + transform.x);
  const centerY = targetH * (0.5 + transform.y);

  ctx.save();
  ctx.filter = filterCss;
  ctx.translate(centerX, centerY);
  ctx.rotate((transform.rotation * Math.PI) / 180);
  ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();
}

function fontStringFor(layer: TextLayer, fontSizePx: number) {
  const weight = layer.bold ? "700" : "400";
  const style = layer.italic ? "italic" : "normal";
  return `${style} ${weight} ${fontSizePx}px ${layer.fontFamily}`;
}

async function ensureFontsLoaded(layers: TextLayer[]) {
  if (typeof document === "undefined" || !("fonts" in document)) return;
  await Promise.all(
    layers.map(async (layer) => {
      try {
        await document.fonts.load(fontStringFor(layer, 32), layer.text || "A");
      } catch {
        // if the font fails to load the canvas falls back to a default font
      }
    })
  );
  try {
    await document.fonts.ready;
  } catch {
    // ignore
  }
}

function drawTextLayer(
  ctx: CanvasRenderingContext2D,
  layer: TextLayer,
  targetW: number,
  targetH: number
) {
  const fontSizePx = textFontSizePx(layer, targetW);
  const lines = layer.text.split("\n");
  const lineHeight = fontSizePx * 1.2;
  const totalHeight = lineHeight * lines.length;

  ctx.save();
  ctx.font = fontStringFor(layer, fontSizePx);
  ctx.fillStyle = layer.color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.translate(targetW * (0.5 + layer.x), targetH * (0.5 + layer.y));
  ctx.rotate((layer.rotation * Math.PI) / 180);

  lines.forEach((line, index) => {
    const ly = -totalHeight / 2 + lineHeight * (index + 0.5);
    ctx.fillText(line, 0, ly);

    if (layer.underline || layer.strikethrough) {
      const width = ctx.measureText(line).width;
      const thickness = Math.max(1, fontSizePx * 0.05);
      if (layer.underline) {
        ctx.fillRect(-width / 2, ly + fontSizePx * 0.35, width, thickness);
      }
      if (layer.strikethrough) {
        ctx.fillRect(-width / 2, ly - fontSizePx * 0.05, width, thickness);
      }
    }
  });

  ctx.restore();
}

export async function compositeCard(
  photoUrl: string,
  templateSrc: string,
  transform: PhotoTransform,
  blurBackground: boolean,
  photoFilterCss: string,
  textLayers: TextLayer[]
): Promise<Blob> {
  const [photo, template] = await Promise.all([
    loadImage(photoUrl),
    loadImage(templateSrc),
  ]);
  await ensureFontsLoaded(textLayers);

  const canvas = document.createElement("canvas");
  canvas.width = template.naturalWidth;
  canvas.height = template.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable");

  ctx.fillStyle = "#e5e5e5";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (blurBackground) {
    drawBlurredCoverBackground(ctx, photo, canvas.width, canvas.height, photoFilterCss);
  }

  drawContainWithTransform(ctx, photo, canvas.width, canvas.height, transform, photoFilterCss);
  ctx.drawImage(template, 0, 0, canvas.width, canvas.height);

  for (const layer of textLayers) {
    drawTextLayer(ctx, layer, canvas.width, canvas.height);
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to export image"));
    }, "image/png");
  });
}

// Lado do cliente da capa da campanha: replica exatamente o que a prévia do
// passo "Modelo de legenda" mostra em CSS (foto em object-cover reduzida a
// 80%, moldura por cima), só que em resolução de verdade. Gerada ao publicar
// e guardada como capa da campanha — ver saveCoverAction.
export const COVER_SIZE = 800;

export async function compositeCoverDataUrl(
  photoUrl: string,
  templateSrc: string,
  size = COVER_SIZE
): Promise<string> {
  const [photo, template] = await Promise.all([
    loadImage(photoUrl),
    loadImage(templateSrc),
  ]);

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable");

  // Mesmo fundo neutro do compositeCard: a foto a 80% não preenche a caixa
  // toda, então sem isso sobraria transparência nas beiradas.
  ctx.fillStyle = "#e5e5e5";
  ctx.fillRect(0, 0, size, size);

  // `object-cover` + `scale-[0.8]` do PainelStepLegenda, na mesma ordem.
  const scale = Math.max(size / photo.width, size / photo.height) * 0.8;
  const drawW = photo.width * scale;
  const drawH = photo.height * scale;
  ctx.drawImage(photo, (size - drawW) / 2, (size - drawH) / 2, drawW, drawH);

  ctx.drawImage(template, 0, 0, size, size);

  return canvas.toDataURL("image/png");
}

/**
 * Always saves the file straight to disk. Deliberately does NOT go through the
 * Web Share API: on desktop that opens the OS share sheet, which offers no
 * "save" option — the user asked for a download and should just get one.
 */
export function downloadImage(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export type ShareResult =
  | "shared-with-image"
  | "shared-text-only"
  | "cancelled"
  | "unsupported";

/**
 * Desktop share sheets hand files over through a temp file, and on Windows some
 * targets (Outlook, Mail) end up reading it before it is written — the receiver
 * gets an empty `.tmp` instead of the PNG. Touch devices, where sharing the
 * image actually matters, do it reliably. So only attach the file there and let
 * desktop share the text, since the image is downloaded anyway.
 */
function supportsReliableFileSharing() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(any-pointer: coarse)").matches ?? false;
}

/**
 * Opens the native share sheet with the finished card plus the support text,
 * so the user can send it through WhatsApp, e-mail, Instagram, etc.
 */
export async function shareImage(
  blob: Blob,
  fileName: string,
  text: string
): Promise<ShareResult> {
  if (typeof navigator === "undefined" || !navigator.share) return "unsupported";

  if (blob.size > 0 && supportsReliableFileSharing()) {
    const file = new File([blob], fileName, { type: "image/png" });

    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text });
        return "shared-with-image";
      } catch {
        return "cancelled";
      }
    }
  }

  try {
    await navigator.share({ text });
    return "shared-text-only";
  } catch {
    return "cancelled";
  }
}
