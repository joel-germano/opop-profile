"use client";

import Image from "next/image";
import { useRef } from "react";
import { Ban, ChevronLeft, ChevronRight } from "lucide-react";
import { DEFAULT_PHOTO_FILTER, PHOTO_FILTERS } from "@/lib/photo-filters";

type Props = {
  photoUrl: string;
  selectedId: string;
  onSelect: (id: string) => void;
  onDiscard: () => void;
  onDone: () => void;
};

export function EffectsPanel({ photoUrl, selectedId, onSelect, onDiscard, onDone }: Props) {
  const stripRef = useRef<HTMLDivElement>(null);

  return (
    <div className="w-full rounded-t-2xl bg-[#2a2a2a] px-4 pb-4 pt-3">
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          aria-label="Remover filtro"
          title="Remover filtro"
          onClick={() => onSelect(DEFAULT_PHOTO_FILTER.id)}
          className={`flex h-20 w-14 shrink-0 flex-col items-center justify-center gap-1 rounded-lg ring-2 transition active:scale-95 ${
            selectedId === DEFAULT_PHOTO_FILTER.id
              ? "ring-brand bg-white/10"
              : "ring-white/10 bg-white/5"
          }`}
        >
          <Ban size={20} strokeWidth={1.75} className="text-white" />
          <span className="text-[10px] font-medium text-white/80">Remover</span>
        </button>

        <div className="relative min-w-0 flex-1">
          <button
            type="button"
            aria-label="Rolar efeitos para a esquerda"
            onClick={() => stripRef.current?.scrollBy({ left: -240, behavior: "smooth" })}
            className="absolute left-1 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-[#1c1c1c]/90 text-white shadow transition active:scale-90 hover:bg-[#1c1c1c] md:flex"
          >
            <ChevronLeft size={16} strokeWidth={2} />
          </button>

          <div ref={stripRef} className="flex gap-3 overflow-x-auto scrollbar-none">
            {PHOTO_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => onSelect(filter.id)}
              className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-lg ring-2 transition active:scale-95 ${
                filter.id === selectedId ? "ring-brand" : "ring-white/10"
              }`}
            >
              <Image
                src={photoUrl}
                alt={filter.label}
                fill
                sizes="80px"
                unoptimized
                className="object-cover"
                style={{ filter: filter.css }}
              />
              <span className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 to-transparent px-1 pb-1 pt-3 text-center text-[10px] font-medium text-white">
                {filter.label}
              </span>
            </button>
          ))}
          </div>

          <button
            type="button"
            aria-label="Rolar efeitos para a direita"
            onClick={() => stripRef.current?.scrollBy({ left: 240, behavior: "smooth" })}
            className="absolute right-1 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-[#1c1c1c]/90 text-white shadow transition active:scale-90 hover:bg-[#1c1c1c] md:flex"
          >
            <ChevronRight size={16} strokeWidth={2} />
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onDiscard}
          className="h-12 flex-1 rounded-full bg-white/10 text-base font-semibold text-white transition active:scale-[0.98] hover:bg-white/20"
        >
          Descartar
        </button>
        <button
          type="button"
          onClick={onDone}
          className="h-12 flex-1 rounded-full bg-brand text-base font-semibold text-black transition active:scale-[0.98] hover:bg-brand-light"
        >
          Feito
        </button>
      </div>
    </div>
  );
}
