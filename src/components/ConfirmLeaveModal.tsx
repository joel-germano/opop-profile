"use client";

import { useEffect } from "react";
import { HelpCircle } from "lucide-react";

type Props = {
  onStay: () => void;
  onLeave: () => void;
};

// Aviso de "tem certeza?" antes de sair do fluxo de criação e perder o que
// não foi publicado ainda — usado pelo botão "Cancelar" do passo 1.
export function ConfirmLeaveModal({ onStay, onLeave }: Props) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onStay();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onStay]);

  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center bg-black/70 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onStay();
      }}
    >
      <div className="flex w-full max-w-xs flex-col items-center gap-4 rounded-3xl bg-[#1c1c1c] p-6 text-center shadow-2xl shadow-black/60 ring-1 ring-white/10">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white/70">
          <HelpCircle size={26} strokeWidth={2} />
        </div>

        <div>
          <h2 className="text-lg font-bold text-white">Tem certeza?</h2>
          <p className="mt-1.5 text-sm text-white/60">
            Ao sair desta página, todas as alterações não salvas serão
            perdidas.
          </p>
        </div>

        <button
          type="button"
          onClick={onStay}
          className="flex h-12 w-full items-center justify-center rounded-full bg-danger text-sm font-semibold text-white transition active:scale-95 hover:bg-danger-dark"
        >
          Não, ficar na página
        </button>
        <button
          type="button"
          onClick={onLeave}
          className="text-sm font-semibold text-white/60 transition hover:text-white"
        >
          Sim, sair da página
        </button>
      </div>
    </div>
  );
}
