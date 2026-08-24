import Image from "next/image";
import Link from "next/link";
import { Camera } from "lucide-react";
import { ModelsMarquee } from "@/components/ModelsMarquee";

export function HomeHero() {
  return (
    <section className="flex flex-col items-center gap-6 overflow-hidden bg-decor-coral px-6 pt-6 pb-0 text-center">
      <div>
        <h1
          className="font-display font-normal leading-tight tracking-wide text-decor-lime"
          style={{ fontSize: "clamp(1.75rem, 9vw, 3rem)" }}
        >
          Mostre seus
          <br />
          <span
            className="-mt-3 mx-auto flex w-fit flex-col items-center text-danger"
            style={{ fontSize: "clamp(2.5rem, 15vw, 4.5rem)" }}
          >
            apoios
            <Image
              src="/listra.svg"
              alt=""
              width={220}
              height={25}
              className="-mt-2 h-auto w-[85%]"
              aria-hidden
            />
          </span>
        </h1>
      </div>
      <p className="text-lg leading-snug text-white">
        Crie uma moldura pra foto de perfil da sua campanha e compartilhe um
        link. Cada apoiador encaixa a própria foto, coloca no Instagram, no
        WhatsApp, em todo lugar, e leva mais gente pra sua causa.
      </p>
      <div className="flex w-full max-w-xs flex-col gap-3">
        <Link
          href="/painel"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-danger text-base font-semibold text-white transition active:scale-95 hover:bg-danger-dark"
        >
          <Camera size={18} strokeWidth={2} />
          Criar minha moldura
        </Link>
        <a
          href="#como-funciona"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white text-base font-semibold text-danger transition active:scale-95 hover:bg-white/90"
        >
          Como funciona
        </a>
      </div>

      <ModelsMarquee />
    </section>
  );
}
