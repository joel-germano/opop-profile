"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

// Mesmo efeito do botão "voltar" do navegador — não importa de onde a
// pessoa chegou aqui, volta pra tela anterior no histórico.
export function BackButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      aria-label="Voltar"
      className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition active:scale-90 hover:bg-white/20"
    >
      <ArrowLeft size={18} strokeWidth={2} />
    </button>
  );
}
