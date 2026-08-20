import Link from "next/link";
import Image from "next/image";
import { Pencil, Trash2 } from "lucide-react";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/lib/models/user";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { deleteUserAction } from "./actions";

export default async function AdminUsuariosPage() {
  await connectDB();
  const users = await UserModel.find({})
    .select("name username email whatsapp photoUrl plan createdAt")
    .sort({ createdAt: -1 })
    .lean();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-normal tracking-wide text-white">
          Usuários
        </h1>
        <p className="mt-1 text-sm text-white/60">{users.length} conta(s).</p>
      </div>

      <div className="flex flex-col gap-2">
        {users.map((user) => (
          <div
            key={String(user._id)}
            className="flex items-center gap-4 rounded-2xl bg-white/5 p-4"
          >
            <Image
              src={user.photoUrl}
              alt={user.name}
              width={44}
              height={44}
              className="shrink-0 rounded-full object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-white">{user.name}</p>
              <p className="truncate text-xs text-white/50">
                @{user.username} · {user.email} · {user.whatsapp}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                user.plan === "premium"
                  ? "bg-brand/20 text-brand-light"
                  : "bg-white/10 text-white/60"
              }`}
            >
              {user.plan === "premium" ? "Premium" : "Free"}
            </span>

            <div className="flex shrink-0 gap-2">
              <Link
                href={`/admin/usuarios/${user._id}`}
                aria-label="Editar usuário"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition active:scale-90 hover:bg-white/20"
              >
                <Pencil size={15} strokeWidth={1.75} />
              </Link>
              <form action={deleteUserAction.bind(null, String(user._id))}>
                <ConfirmSubmitButton
                  confirmMessage={`Excluir ${user.name}? Isso também apaga as molduras e a foto de perfil dele(a).`}
                  ariaLabel="Excluir usuário"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500/15 text-red-400 transition active:scale-90 hover:bg-red-500/25"
                >
                  <Trash2 size={15} strokeWidth={1.75} />
                </ConfirmSubmitButton>
              </form>
            </div>
          </div>
        ))}

        {users.length === 0 && (
          <p className="text-sm text-white/50">Nenhum usuário cadastrado ainda.</p>
        )}
      </div>
    </div>
  );
}
