"use client";

import { useEffect } from "react";
import Image from "next/image";
import {
  Banknote,
  BookOpenCheck,
  Droplets,
  GraduationCap,
  HeartPulse,
  IdCard,
  ShieldOff,
  Users,
  X,
} from "lucide-react";

type Props = {
  onClose: () => void;
};

const ACHIEVEMENTS = [
  { icon: IdCard, text: "CNH Pai D'Égua" },
  { icon: HeartPulse, text: "Hospital da Mulher" },
  {
    icon: Droplets,
    text: "Proibição de cobrança de taxas de religação de água e luz",
  },
  {
    icon: GraduationCap,
    text: "Criação das duas novas universidades (UESSPA e UEOPA)",
  },
  { icon: Users, text: "Política estadual para refugiados" },
  { icon: ShieldOff, text: "Proibição de comercialização de arma de fogo" },
  { icon: BookOpenCheck, text: "Dia estadual dos professores" },
  { icon: Banknote, text: "Recursos da mineração para educação" },
];

export function DirceuMenuModal({ onClose }: Props) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-[#1c1c1c] md:left-1/2 md:right-auto md:w-120 md:-translate-x-1/2 md:border-x md:border-white/10"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
    >
      <div className="flex shrink-0 items-center justify-between px-4 py-3 sm:py-4">
        <div className="w-10" />
        <h2 className="font-heading text-lg font-normal tracking-wide text-white">
          Um histórico de trabalho
        </h2>
        <button
          type="button"
          aria-label="Fechar"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition active:scale-90 hover:bg-white/20"
        >
          <X size={16} strokeWidth={2} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-8">
        <ul className="flex flex-col gap-3 py-2">
          {ACHIEVEMENTS.map(({ icon: Icon, text }) => (
            <li
              key={text}
              className="flex items-start gap-3 rounded-2xl bg-white/5 p-3"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand-light">
                <Icon size={19} strokeWidth={1.75} />
              </span>
              <span className="pt-2 text-sm leading-snug text-white/90">
                {text}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-6 rounded-3xl bg-linear-to-br from-brand/15 to-white/5 p-5">
          <div className="flex items-center gap-3">
            <Image
              src="/perfil-dirceu.png"
              alt="Dirceu ten Caten"
              width={44}
              height={44}
              className="rounded-full ring-2 ring-brand/60"
            />
            <div>
              <p className="text-sm font-bold text-white">Dirceu ten Caten</p>
              <p className="text-xs text-white/50">Candidato a vice-governador</p>
            </div>
          </div>

          <p className="mt-4 text-lg italic leading-snug text-white/90">
            &ldquo;Com muito trabalho e força política, construímos muitas
            conquistas. Agora vamos fazer muito mais, com toda a nossa
            energia, força e coragem!&rdquo;
          </p>

          <p className="mt-4 font-heading text-2xl font-normal tracking-wide text-brand-light">
            Bora comigo nessa?
          </p>
        </div>
      </div>
    </div>
  );
}
