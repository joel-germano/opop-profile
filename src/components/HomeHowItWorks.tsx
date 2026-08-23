import Link from "next/link";
import { Camera, ImagePlus, Link2, Share2 } from "lucide-react";
import { HomeStepCard } from "@/components/HomeStepCard";

const STEPS = [
  {
    icon: ImagePlus,
    color: "primary" as const,
    label: "Passo 1",
    title: "Crie sua moldura",
    description: "Suba uma arte com um espaço vazio pro rosto do seu apoiador.",
  },
  {
    icon: Link2,
    color: "secondary" as const,
    label: "Passo 2",
    title: "Compartilhe o link",
    description: "Envie pro seu grupo, sua lista, suas redes — onde for.",
  },
  {
    icon: Camera,
    color: "success" as const,
    label: "Passo 3",
    title: "Eles entram com a foto",
    description: "Cada apoiador encaixa a própria foto e baixa a arte pronta.",
  },
  {
    icon: Share2,
    color: "danger" as const,
    label: "Passo 4",
    title: "A campanha se espalha",
    description: "Cada compartilhamento leva a mais gente pra sua campanha.",
  },
];

export function HomeHowItWorks() {
  return (
    <section id="como-funciona" className="relative overflow-hidden px-6 pt-16 pb-14">
      <div className="pointer-events-none absolute -left-16 top-0 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 top-52 h-48 w-48 rounded-full bg-decor-coral/10 blur-3xl" />

      <div className="relative text-center">
        <h2 className="font-display text-3xl font-normal tracking-wide text-white">
          Comece algo do qual as pessoas queiram fazer parte
        </h2>
        <p className="mt-3 text-base leading-snug text-white/60">
          Sem precisar saber design. Sua comunidade vai ter orgulho de
          compartilhar.
        </p>
      </div>

      <div className="relative mt-8 flex flex-col gap-3">
        {STEPS.map((step) => (
          <HomeStepCard key={step.title} {...step} />
        ))}
      </div>

      <Link
        href="/painel"
        className="relative mx-auto mt-8 flex h-12 w-full max-w-xs items-center justify-center gap-2 rounded-full bg-danger text-base font-semibold text-white transition active:scale-95 hover:bg-danger-dark"
      >
        <Camera size={18} strokeWidth={2} />
        Criar minha moldura
      </Link>
    </section>
  );
}
