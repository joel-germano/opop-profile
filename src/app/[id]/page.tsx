import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/lib/models/user";
import { TemplateModel } from "@/lib/models/template";
import { CampaignPageClient } from "@/components/CampaignPageClient";

export default async function CampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  await connectDB();
  const user = await UserModel.findOne({ username: id.toLowerCase() }).select(
    "name photoUrl"
  );
  if (!user) notFound();

  const templateDocs = await TemplateModel.find({ userId: user._id })
    .sort({ order: 1, createdAt: 1 })
    .lean();

  const templates = templateDocs.map((t, i) => ({
    id: i + 1,
    name: `Modelo ${i + 1}`,
    src: t.imageUrl,
  }));

  return (
    <CampaignPageClient
      templates={templates}
      user={{ name: user.name, photoUrl: user.photoUrl }}
    />
  );
}
