"use client";

import { useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Item = { id: string; imageUrl: string };

// Mesmo padrão de carrossel do HomeShowcaseCarousel (scroll nativo com
// snap — arrasta liso no touch; setas só aparecem no desktop, onde não tem
// gesto de arrastar). Aqui é só a prévia (6 itens, vem pronta do server);
// pra ver o resto é o ícone de expandir que abre o modal com scroll infinito.
export function GalleryPreviewCarousel({
  items,
  onOpenFull,
}: {
  items: Item[];
  onOpenFull: () => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollByCard = (direction: 1 | -1) => {
    scrollerRef.current?.scrollBy({ left: direction * 220, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        className="scrollbar-none flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-pl-6 pb-1"
      >
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={onOpenFull}
            className="relative aspect-square w-24 flex-none snap-start overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10 transition active:scale-95"
          >
            <Image src={item.imageUrl} alt="" fill sizes="96px" className="object-cover" />
          </button>
        ))}
      </div>

      <button
        type="button"
        aria-label="Ver anteriores"
        onClick={() => scrollByCard(-1)}
        className="absolute -left-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition active:scale-90 hover:bg-white/20 md:flex"
      >
        <ChevronLeft size={16} strokeWidth={2} />
      </button>
      <button
        type="button"
        aria-label="Ver mais"
        onClick={() => scrollByCard(1)}
        className="absolute -right-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition active:scale-90 hover:bg-white/20 md:flex"
      >
        <ChevronRight size={16} strokeWidth={2} />
      </button>
    </div>
  );
}
