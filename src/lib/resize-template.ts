// Ao contrário do avatar, aqui não recorta em quadrado nem troca pra JPEG —
// a moldura precisa manter a proporção original e o canal alfa (o "buraco"
// transparente onde a foto do usuário aparece).
export const TEMPLATE_MAX_BYTES = 1_000_000; // 1MB

function dataUrlByteLength(dataUrl: string): number {
  const base64 = dataUrl.split(",")[1] ?? "";
  return Math.ceil((base64.length * 3) / 4);
}

function drawToDataUrl(img: HTMLImageElement, maxDimension: number): string {
  const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
  const width = Math.round(img.width * scale);
  const height = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D não suportado");

  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL("image/png");
}

export function resizeTemplateToDataUrl(file: File, maxDimension = 1600): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      try {
        let dimension = maxDimension;
        let dataUrl = drawToDataUrl(img, dimension);

        // PNG é sem perda — a única forma de reduzir o tamanho é diminuir a
        // resolução. Vai encolhendo até caber no limite ou ficar pequena
        // demais pra valer a pena.
        while (dataUrlByteLength(dataUrl) > TEMPLATE_MAX_BYTES && dimension > 400) {
          dimension = Math.round(dimension * 0.8);
          dataUrl = drawToDataUrl(img, dimension);
        }

        if (dataUrlByteLength(dataUrl) > TEMPLATE_MAX_BYTES) {
          reject(new Error("Não foi possível reduzir a imagem abaixo de 1MB. Tente uma imagem mais simples."));
          return;
        }

        resolve(dataUrl);
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
