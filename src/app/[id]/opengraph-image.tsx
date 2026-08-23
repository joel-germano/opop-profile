import { buildCampaignOgResponse, OG_IMAGE_SIZE } from "./og-image-shared";

export const runtime = "nodejs";
export const alt = "Capa da campanha";
export const size = OG_IMAGE_SIZE;
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return buildCampaignOgResponse(id);
}
