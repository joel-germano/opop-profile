"use client";

import { useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PHOTOS = [
  "/ongs-resgate-1.jpg",
  "/ongs-resgate-2.jpg",
  "/ongs-resgate-3.jpg",
  "/ongs-resgate-4.jpg",
];

// Mesmo padrão do HomeShowcaseCarousel/AvatarCarousel: scroll nativo (arrasta
// normal no mobile) + chevrons só no desktop (`md:flex`), onde não tem touch.
export function RescuePhotosCarousel() {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollByCard = (direction: 1 | -1) => {
    scrollerRef.current?.scrollBy({ left: direction * 200, behavior: "smooth" });
  };

  return (
    <div className="relative mt-4">
      <div
        ref={scrollerRef}
        className="scrollbar-none flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1"
      >
        {PHOTOS.map((src) => (
          <div
            key={src}
            className="relative aspect-square w-32 flex-none snap-start overflow-hidden rounded-2xl ring-1 ring-white/10 sm:w-36"
          >
            <Image
              src={src}
              alt=""
              fill
              sizes="144px"
              className="object-cover"
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        aria-label="Ver fotos anteriores"
        onClick={() => scrollByCard(-1)}
        className="absolute -left-2 top-1/2 hidden h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition active:scale-90 hover:bg-white/20 md:flex"
      >
        <ChevronLeft size={16} strokeWidth={2} />
      </button>
      <button
        type="button"
        aria-label="Ver mais fotos"
        onClick={() => scrollByCard(1)}
        className="absolute -right-2 top-1/2 hidden h-8 w-8 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition active:scale-90 hover:bg-white/20 md:flex"
      >
        <ChevronRight size={16} strokeWidth={2} />
      </button>
    </div>
  );
}
