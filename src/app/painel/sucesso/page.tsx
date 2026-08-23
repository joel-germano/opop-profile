import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { TemplateModel } from "@/lib/models/template";

export default async function PainelSucessoPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/painel");

  await connectDB();
  // Preferimos a capa (moldura + foto de prévia já compostas — ver
  // saveCoverAction) porque é o que reflete de verdade o resultado da
  // campanha. Cai pra moldura crua só se a geração da capa tiver falhado
  // (ela é best-effort, não bloqueia a publicação).
  const previewImage =
    user.coverUrl ||
    (
      await TemplateModel.findOne({ userId: user._id })
        .sort({ order: 1, createdAt: 1 })
        .select("imageUrl")
        .lean()
    )?.imageUrl;

  return (
    <div className="flex flex-col items-center gap-6 pb-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success-light">
        <CheckCircle2 size={28} strokeWidth={2} />
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Campanha publicada!
        </h1>
        <p className="mt-1.5 text-sm text-white/60">
          Sua página já está no ar em{" "}
          <span className="text-white/80">opop.bio/{user.username}</span>.
        </p>
      </div>

      {previewImage && (
        <div className="relative h-32 w-32 overflow-hidden rounded-2xl ring-1 ring-white/10">
          <Image
            src={previewImage}
            alt=""
            fill
            sizes="128px"
            className="object-cover"
          />
        </div>
      )}

      <div className="w-full rounded-2xl bg-white/5 p-5 text-left ring-1 ring-white/10">
        <p className="text-xs font-bold uppercase tracking-widest text-white/40">
          Título
        </p>
        <p className="mt-1 text-base font-semibold text-white">
          {user.title || "—"}
        </p>

        {user.description && (
          <>
            <p className="mt-4 text-xs font-bold uppercase tracking-widest text-white/40">
              Descrição
            </p>
            <p className="mt-1 text-sm leading-snug text-white/70">
              {user.description}
            </p>
          </>
        )}

        <p className="mt-4 text-xs font-bold uppercase tracking-widest text-white/40">
          Link
        </p>
        <p className="mt-1 text-sm font-medium text-white/70">
          opop.bio/{user.username}
        </p>
      </div>

      <Link
        href={`/${user.username}`}
        className="flex h-14 w-full max-w-xs items-center justify-center gap-2 rounded-full bg-danger text-base font-semibold text-white transition active:scale-95 hover:bg-danger-dark"
      >
        Ver meu perfil completo
        <ArrowRight size={18} strokeWidth={2} />
      </Link>
    </div>
  );
}
