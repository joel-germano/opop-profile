import { CreditCard, Images, UserRoundCheck, Wand2 } from "lucide-react";
import { formatBrl } from "@/lib/card-format";

const STEP_COLORS = [
  "bg-primary/15 text-primary-light",
  "bg-secondary/15 text-secondary-light",
  "bg-decor-coral/15 text-decor-coral",
  "bg-success/15 text-success-light",
];

export function PresidenciaveisSteps({ priceCents }: { priceCents: number }) {
  const steps = [
    {
      icon: UserRoundCheck,
      title: "Escolha seu candidato",
      description: "Toque no nome de quem você quer ver crescer no placar.",
    },
    {
      icon: CreditCard,
      title: `Confirme seu apoio por R$ ${formatBrl(priceCents)}`,
      description:
        "Uma vez só, no Pix ou no cartão. É esse passo que garante que cada apoio é de gente de verdade.",
    },
    {
      icon: Wand2,
      title: "Monte sua foto na moldura",
      description:
        "Encaixe seu rosto, ajuste do jeito que ficar melhor e baixe a arte pronta.",
    },
    {
      icon: Images,
      title: "Publique e entre na contagem",
      description:
        "Sua foto entra na galeria do candidato e o apoio soma no ranking na hora.",
    },
  ];

  return (
    <section className="w-full px-6">
      <div className="text-center">
        <span className="text-xs font-bold uppercase tracking-wide text-decor-coral">
          Leva menos de 2 minutos
        </span>
        <h2 className="mt-2 font-display text-2xl font-normal leading-tight tracking-wide text-white">
          Como fazer seu candidato subir pro topo do placar
        </h2>
      </div>

      <ol className="mt-6 flex flex-col gap-3">
        {steps.map((step, index) => (
          <li
            key={step.title}
            className="flex gap-4 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10"
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${STEP_COLORS[index]}`}
            >
              <step.icon size={18} strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-base font-bold leading-tight text-white">
                {step.title}
              </h3>
              <p className="mt-1 text-sm leading-snug text-white/60">
                {step.description}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
