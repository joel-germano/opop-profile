"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { SupporterModel } from "@/lib/models/supporter";
import { SupporterPurchaseModel } from "@/lib/models/supporter-purchase";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function deleteSupporterAction(supporterId: string) {
  if (!(await isAdminAuthenticated())) return;

  await connectDB();
  await SupporterPurchaseModel.deleteMany({ supporterId });
  await SupporterModel.findByIdAndDelete(supporterId);

  revalidatePath("/admin/eleitores");
}
