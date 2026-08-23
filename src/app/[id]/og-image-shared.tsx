// Não é um arquivo especial do Next (nome não é `opengraph-image`/`twitter-
// image`) — é código compartilhado pelos dois, que ficam finos e só chamam
// `buildCampaignOgResponse`. Existe pra não duplicar a composição da imagem
// entre eles.
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/lib/models/user";
import { TemplateModel } from "@/lib/models/template";
import { SITE_TITLE } from "@/lib/site";

export const OG_IMAGE_SIZE = { width: 1200, height: 630 };

// Coordenadas medidas a dedo em cima de public/og/campanha-bg.png (script
// com `sharp` procurando o contorno branco dos dois quadrados vazios do
// molde) — a arte já traz logo, ilustração e o texto "Altere sua foto..."
// prontos, só falta encaixar o título e as duas fotos por cima.
const LEFT_PHOTO = { left: 53, top: 267, size: 284 };
const RIGHT_PHOTO = { left: 417, top: 267, size: 285 };
const PHOTO_RADIUS = 28;

// Lidos uma vez só, no escopo do módulo — não dependem de request nenhum
// (ver "Predictable values" na doc do opengraph-image).
const backgroundDataUrl = readFile(
  join(process.cwd(), "public/og/campanha-bg.png")
).then((buf) => `data:image/png;base64,${buf.toString("base64")}`);

// Manrope Bold (mesma fonte/peso do título "font-bold" usado no resto do
// app) — baixada como .woff estático do Google Fonts, porque o `next/font`
// não deixa os bytes crus acessíveis em runtime pra passar pro satori, e uma
// fonte variável (como a Bahnschrift, tentada antes) quebra a geração com
// `Cannot read properties of undefined (reading '256')`.
const titleFontData = readFile(join(process.cwd(), "public/fonts/manrope-bold.woff"));

const MIME_BY_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

// Fotos do usuário (upload ou persona) sempre vivem em public/, nunca em URL
// remota — dá pra ler direto do disco e embutir como data URI, sem depender
// de rede (mais rápido e não quebra se o domínio mudar).
async function loadLocalImageDataUrl(urlPath: string): Promise<string | null> {
  try {
    const pathname = urlPath.split("?")[0];
    const ext = pathname.slice(pathname.lastIndexOf(".")).toLowerCase();
    const mime = MIME_BY_EXT[ext];
    if (!mime) return null;

    const buffer = await readFile(join(process.cwd(), "public", pathname));
    return `data:${mime};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

function PhotoSlot({
  position,
  dataUrl,
}: {
  position: typeof LEFT_PHOTO;
  dataUrl: string | null;
}) {
  if (!dataUrl) return null;

  return (
    <img
      src={dataUrl}
      alt=""
      width={position.size}
      height={position.size}
      style={{
        position: "absolute",
        left: position.left,
        top: position.top,
        width: position.size,
        height: position.size,
        borderRadius: PHOTO_RADIUS,
        objectFit: "cover",
      }}
    />
  );
}

export async function buildCampaignOgResponse(username: string) {
  try {
    return await buildCampaignOgResponseInner(username);
  } catch (err) {
    console.error("[og-image] falhou:", err);
    throw err;
  }
}

async function buildCampaignOgResponseInner(username: string) {
  await connectDB();
  const user = await UserModel.findOne({
    username: username.toLowerCase(),
  }).select("title photoUrl previewPhotoUrl coverUrl coverPreviewPhotoUrl");

  let title = SITE_TITLE;
  let leftPhotoUrl: string | null = null;
  let rightPhotoUrl: string | null = null;

  if (user) {
    title = user.title || SITE_TITLE;
    // Esquerda: a MESMA foto que foi usada pra montar a capa (persona ou
    // upload — ver saveCoverAction), pra bater com o que está dentro do
    // quadrado da direita. Só cai pro upload avulso ou pra foto de cadastro
    // se a pessoa nunca publicou (sem coverPreviewPhotoUrl ainda).
    // Direita: a capa já composta (moldura + foto) — é o "resultado". Sem
    // capa ainda (conta antiga ou geração que falhou), cai pra moldura crua.
    leftPhotoUrl =
      user.coverPreviewPhotoUrl || user.previewPhotoUrl || user.photoUrl || null;
    rightPhotoUrl = user.coverUrl || null;
    if (!rightPhotoUrl) {
      const firstTemplate = await TemplateModel.findOne({ userId: user._id })
        .sort({ order: 1, createdAt: 1 })
        .select("imageUrl")
        .lean();
      rightPhotoUrl = firstTemplate?.imageUrl ?? null;
    }
  }

  const [background, titleFont, leftPhoto, rightPhoto] = await Promise.all([
    backgroundDataUrl,
    titleFontData,
    leftPhotoUrl ? loadLocalImageDataUrl(leftPhotoUrl) : null,
    rightPhotoUrl ? loadLocalImageDataUrl(rightPhotoUrl) : null,
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
        }}
      >
        <img
          src={background}
          alt=""
          width={OG_IMAGE_SIZE.width}
          height={OG_IMAGE_SIZE.height}
          style={{ position: "absolute", inset: 0 }}
        />

        <div
          style={{
            position: "absolute",
            left: 60,
            right: 60,
            top: 106,
            height: 132,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              fontFamily: "Manrope",
              fontWeight: 700,
              fontSize: 46,
              lineHeight: 1.2,
              color: "#000000",
            }}
          >
            {title}
          </div>
        </div>

        <PhotoSlot position={LEFT_PHOTO} dataUrl={leftPhoto} />
        <PhotoSlot position={RIGHT_PHOTO} dataUrl={rightPhoto} />
      </div>
    ),
    {
      ...OG_IMAGE_SIZE,
      fonts: [{ name: "Manrope", data: titleFont, style: "normal", weight: 700 }],
    }
  );
}
