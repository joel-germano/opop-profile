import Image from "next/image";
import { BarChart3, Users } from "lucide-react";

// Rostos placeholder (i.pravatar.cc) só pra ilustrar o visual — a home
// ainda não tem apoiadores reais cadastrados pra mostrar aqui.
const SUPPORTER_AVATARS = [12, 24, 33, 47, 58, 5, 19, 41, 52, 65].map(
  (seed) => `https://i.pravatar.cc/80?img=${seed}`
);

export function HomeSocialProof() {
  return (
    <section className="flex flex-col gap-5 px-6 pb-14">
      <div className="rounded-3xl bg-white/5 p-6 ring-1 ring-white/10">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-success/15 text-success-light">
          <Users size={20} strokeWidth={2} />
        </div>
        <h3 className="mt-4 text-lg font-bold text-white">
          Veja quem apoia você
        </h3>
        <p className="mt-1 text-sm leading-snug text-white/60">
          Acompanhe as pessoas reais que estão de fato compartilhando sua
          campanha.
        </p>
        <div className="scrollbar-none mt-4 flex items-center -space-x-3 overflow-x-auto py-1">
          {SUPPORTER_AVATARS.map((src) => (
            <div
              key={src}
              className="relative h-10 w-10 flex-none overflow-hidden rounded-full ring-2 ring-[#2A2A2A]"
            >
              <Image src={src} alt="" fill sizes="40px" className="object-cover" />
            </div>
          ))}
          <div className="relative flex h-10 flex-none items-center justify-center rounded-full bg-white/10 px-3 text-xs font-bold text-white ring-2 ring-[#2A2A2A]">
            +8,6K
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-white/5 p-6 ring-1 ring-white/10">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-danger/15 text-danger-light">
          <BarChart3 size={20} strokeWidth={2} />
        </div>
        <h3 className="mt-4 text-lg font-bold text-white">
          Acompanhe o desempenho
        </h3>
        <p className="mt-1 text-sm leading-snug text-white/60">
          Saiba quantas pessoas estão participando da sua campanha.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-black/30 p-4">
            <span className="text-2xl font-bold text-white">8.647</span>
            <p className="mt-1 text-xs text-white/50">apoiadores</p>
          </div>
          <div className="rounded-2xl bg-black/30 p-4">
            <span className="text-2xl font-bold text-white">24.510</span>
            <p className="mt-1 text-xs text-white/50">compartilhamentos</p>
          </div>
        </div>
      </div>
    </section>
  );
}
