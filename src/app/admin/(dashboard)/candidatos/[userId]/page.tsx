import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/lib/models/user";
import { AdminUserForm } from "@/components/AdminUserForm";

export default async function AdminEditCandidatoPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  await connectDB();
  const user = await UserModel.findById(userId)
    .select("name username email whatsapp plan")
    .lean();
  if (!user) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Editar candidato
        </h1>
      </div>

      <AdminUserForm
        userId={userId}
        initialName={user.name}
        initialUsername={user.username}
        initialEmail={user.email}
        initialWhatsapp={user.whatsapp}
        initialPlan={user.plan as "free" | "premium"}
      />
    </div>
  );
}
