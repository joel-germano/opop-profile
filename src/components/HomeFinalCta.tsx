import Link from "next/link";
import { Camera, Share2 } from "lucide-react";

export function HomeFinalCta() {
  return (
    <section className="flex flex-col items-center gap-6 px-6 pb-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary-light">
        <Share2 size={22} strokeWidth={2} />
      </div>
      <h2 className="font-display text-2xl font-normal tracking-wide text-white">
        Seu pessoal já está lá fora. Dê a eles algo que valha a pena
        compartilhar.
      </h2>
      <div className="flex w-full max-w-xs flex-col gap-3">
        <Link
          href="/cadastro"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-danger text-base font-semibold text-white transition active:scale-95 hover:bg-danger-dark"
        >
          <Camera size={18} strokeWidth={2} />
          Criar minha moldura
        </Link>
        <p className="text-xs text-white/40">
          Gratuito para começar. Não é necessário cartão de crédito.
        </p>
      </div>
    </section>
  );
}
