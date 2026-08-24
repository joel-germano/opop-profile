"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { HomeShowcaseCard } from "@/components/HomeShowcaseCard";

type Item = { file: string; title: string; supporters: string; src: string };

export function HomeShowcaseCarousel({
  items,
  hideDetails = false,
}: {
  items: Item[];
  hideDetails?: boolean;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollByCard = (direction: 1 | -1) => {
    scrollerRef.current?.scrollBy({ left: direction * 300, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        className="scrollbar-none flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-pl-6 px-6 pb-1"
      >
        {items.map((item) => (
          <HomeShowcaseCard
            key={item.file}
            src={item.src}
            title={item.title}
            supporters={item.supporters}
            hideDetails={hideDetails}
          />
        ))}
      </div>

      <button
        type="button"
        aria-label="Ver anteriores"
        onClick={() => scrollByCard(-1)}
        className="absolute left-2 top-18 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition active:scale-90 hover:bg-white/20 md:flex"
      >
        <ChevronLeft size={18} strokeWidth={2} />
      </button>
      <button
        type="button"
        aria-label="Ver mais"
        onClick={() => scrollByCard(1)}
        className="absolute right-2 top-18 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition active:scale-90 hover:bg-white/20 md:flex"
      >
        <ChevronRight size={18} strokeWidth={2} />
      </button>
    </div>
  );
}
