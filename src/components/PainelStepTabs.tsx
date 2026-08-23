"use client";

import { Image as ImageIcon, Link2, MessageSquare } from "lucide-react";

const TABS = [
  { step: 1, label: "Molduras", icon: ImageIcon },
  { step: 2, label: "Campanha", icon: Link2 },
  { step: 3, label: "Legenda", icon: MessageSquare },
] as const;

type Props = {
  isLoggedIn: boolean;
  activeStep: 1 | 2 | 3;
  onSelectStep: (step: 1 | 2 | 3) => void;
};

// Atalho pra pular direto entre os passos — só faz sentido pra quem já está
// logado: nesse caso não é mais um fluxo guiado de "primeira vez", é edição
// livre de uma campanha que já existe. Sem login, o fluxo continua linear
// (Avançar/Voltar), então não mostra nada. Estilo de abas com sublinhado
// (não pílulas) de propósito — pra parecer navegação comum, não uma UI de
// "modo de edição".
export function PainelStepTabs({ isLoggedIn, activeStep, onSelectStep }: Props) {
  if (!isLoggedIn) return null;

  return (
    <div
      className="mt-4 flex gap-4 overflow-x-auto border-b border-white/10 [&::-webkit-scrollbar]:hidden"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      {TABS.map(({ step, label, icon: Icon }) => {
        const isActive = activeStep === step;
        return (
          <button
            key={step}
            type="button"
            onClick={() => onSelectStep(step)}
            className={`flex shrink-0 items-center gap-1.5 border-b-2 pb-3 text-sm font-semibold whitespace-nowrap transition ${
              isActive
                ? "border-danger text-white"
                : "border-transparent text-white/50 hover:text-white/80"
            }`}
          >
            <Icon size={16} strokeWidth={2} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
