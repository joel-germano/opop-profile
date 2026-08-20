import Link from "next/link";
import { Camera, Crown, Settings } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { PREMIUM_PRICE_CENTS } from "@/lib/plans";

export default async function PainelPage() {
  const user = await getCurrentUser();
  const firstName = user?.name.split(" ")[0] ?? "";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-3xl font-normal tracking-wide text-white">
          Olá, {firstName}
        </h1>
        <p className="mt-2 text-base text-white/60">
          Bem-vindo ao seu painel.
        </p>
      </div>

      <Link
        href={`/${user?.username ?? ""}`}
        className="flex items-center gap-4 rounded-3xl bg-linear-to-br from-brand/15 to-white/5 p-5 transition active:scale-[0.98]"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand-light">
          <Camera size={22} strokeWidth={1.75} />
        </span>
        <span>
          <span className="block text-base font-bold text-white">
            Criar arte
          </span>
          <span className="block text-sm text-white/60">
            Monte sua moldura de apoio e compartilhe
          </span>
        </span>
      </Link>

      <Link
        href="/painel/configuracoes"
        className="flex items-center gap-4 rounded-3xl bg-white/5 p-5 transition active:scale-[0.98]"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand-light">
          <Settings size={22} strokeWidth={1.75} />
        </span>
        <span>
          <span className="block text-base font-bold text-white">
            Molduras
          </span>
          <span className="block text-sm text-white/60">
            Configure as molduras da sua página de apoio
          </span>
        </span>
      </Link>

      {user?.plan === "premium" ? (
        <div className="flex items-center gap-4 rounded-3xl bg-white/5 p-5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand-light">
            <Crown size={22} strokeWidth={1.75} />
          </span>
          <span>
            <span className="block text-base font-bold text-white">
              Você é Premium
            </span>
            <span className="block text-sm text-white/60">
              Obrigado por apoiar o projeto
            </span>
          </span>
        </div>
      ) : (
        <Link
          href="/painel/checkout"
          className="flex items-center gap-4 rounded-3xl bg-linear-to-br from-brand/15 to-white/5 p-5 transition active:scale-[0.98]"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand-light">
            <Crown size={22} strokeWidth={1.75} />
          </span>
          <span>
            <span className="block text-base font-bold text-white">
              Torne-se Premium
            </span>
            <span className="block text-sm text-white/60">
              A partir de R$ {(PREMIUM_PRICE_CENTS / 100).toFixed(2).replace(".", ",")}
            </span>
          </span>
        </Link>
      )}
    </div>
  );
}
