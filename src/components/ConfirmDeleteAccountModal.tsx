"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { deleteAccountAction } from "@/app/painel/actions";

type Props = {
  onCancel: () => void;
};

export function ConfirmDeleteAccountModal({ onCancel }: Props) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center bg-black/70 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="flex w-full max-w-xs flex-col items-center gap-4 rounded-3xl bg-[#1c1c1c] p-6 text-center shadow-2xl shadow-black/60 ring-1 ring-white/10">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger/15 text-danger-light">
          <AlertTriangle size={26} strokeWidth={2} />
        </div>

        <div>
          <h2 className="text-lg font-bold text-white">Excluir sua conta?</h2>
          <p className="mt-1.5 text-sm text-white/60">
            Isso apaga sua página, suas molduras e sua foto de perfil pra
            sempre. Não dá pra desfazer.
          </p>
        </div>

        <form action={deleteAccountAction} className="w-full">
          <button
            type="submit"
            className="flex h-12 w-full items-center justify-center rounded-full bg-danger text-sm font-semibold text-white transition active:scale-95 hover:bg-danger-dark"
          >
            Sim, excluir minha conta
          </button>
        </form>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm font-semibold text-white/60 transition hover:text-white"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
