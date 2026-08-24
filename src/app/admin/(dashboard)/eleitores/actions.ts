"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { SupporterModel } from "@/lib/models/supporter";
import { SupporterPurchaseModel } from "@/lib/models/supporter-purchase";
import { GalleryPostModel } from "@/lib/models/gallery-post";
import { deleteGalleryPhotoFile } from "@/lib/save-gallery-photo";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function deleteSupporterAction(supporterId: string) {
  if (!(await isAdminAuthenticated())) return;

  await connectDB();

  const galleryPosts = await GalleryPostModel.find({ supporterId }).select("imageUrl");
  for (const post of galleryPosts) {
    await deleteGalleryPhotoFile(post.imageUrl);
  }
  await GalleryPostModel.deleteMany({ supporterId });

  await SupporterPurchaseModel.deleteMany({ supporterId });
  await SupporterModel.findByIdAndDelete(supporterId);

  revalidatePath("/admin/eleitores");
}
