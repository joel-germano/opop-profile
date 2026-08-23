"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Template } from "@/lib/templates";
import { PERSONA_ICON_SRC } from "@/lib/assets";

type Props = {
  templates: Template[];
  activeIndex: number;
  onSelect: (index: number) => void;
};

const SWIPE_THRESHOLD = 40;

export function TemplateCarousel3D({ templates, activeIndex, onSelect }: Props) {
  const dragStartX = useRef<number | null>(null);
  const dragDeltaX = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  const goTo = (index: number) => {
    const clamped = Math.max(0, Math.min(templates.length - 1, index));
    onSelect(clamped);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    dragStartX.current = e.clientX;
    dragDeltaX.current = 0;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragStartX.current === null) return;
    dragDeltaX.current = e.clientX - dragStartX.current;
  };

  const handlePointerUp = () => {
    if (dragDeltaX.current > SWIPE_THRESHOLD) {
      goTo(activeIndex - 1);
    } else if (dragDeltaX.current < -SWIPE_THRESHOLD) {
      goTo(activeIndex + 1);
    }
    dragStartX.current = null;
    dragDeltaX.current = 0;
    setIsDragging(false);
  };

  return (
    <div className="flex w-full flex-col items-center gap-4">
      {/* Recorta só a horizontal (esconde as molduras vizinhas saindo pela
          lateral) sem usar overflow: setar overflow-x sozinho faz o CSS
          tratar overflow-y como "auto" também (regra da spec: só um dos dois
          eixos pode ficar "visible" por vez) — cortando de novo a sombra do
          card ativo por cima/baixo. clip-path não tem essa amarração entre
          eixos, então dá pra cortar só os lados e deixar cima/baixo livres. */}
      <div
        className="relative w-full"
        style={{ perspective: "1200px", clipPath: "inset(-200px 0)" }}
      >
        <div
          className="relative w-full touch-pan-y select-none"
          style={{ height: "clamp(220px, 78vw, 320px)" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {templates.map((template, index) => {
            const offset = index - activeIndex;
            const absOffset = Math.abs(offset);
            if (absOffset > 2) return null;

            const scale = offset === 0 ? 1 : 0.78;
            const rotateY = Math.max(-35, Math.min(35, offset * -30));
            const zIndex = 10 - absOffset;
            const opacity = absOffset > 2 ? 0 : 1;

            return (
              <button
                key={template.id}
                type="button"
                onClick={() => (offset === 0 ? undefined : goTo(index))}
                className={`absolute left-1/2 top-1/2 overflow-hidden rounded-md ring-1 ${
                  offset === 0
                    ? "shadow-2xl shadow-black/50 ring-white/10"
                    : "shadow-sm shadow-black/20 ring-white/5"
                }`}
                style={{
                  width: "clamp(200px, 72vw, 288px)",
                  height: "clamp(200px, 72vw, 288px)",
                  transform: `translate(-50%, -50%) translateX(${
                    offset * 36
                  }%) scale(${scale}) rotateY(${rotateY}deg)`,
                  zIndex,
                  opacity,
                  filter: offset === 0 ? "none" : "brightness(0.6)",
                  transition: isDragging
                    ? "none"
                    : "transform 300ms ease, opacity 300ms ease, filter 300ms ease",
                  cursor: offset === 0 ? "default" : "pointer",
                }}
              >
                <Image
                  src={PERSONA_ICON_SRC}
                  alt=""
                  fill
                  sizes="288px"
                  className="absolute inset-0 object-cover"
                  draggable={false}
                  aria-hidden
                />
                <Image
                  src={template.src}
                  alt={template.name}
                  fill
                  sizes="288px"
                  className="absolute inset-0 object-cover"
                  draggable={false}
                  priority={absOffset === 0}
                />
              </button>
            );
          })}
        </div>

        <button
          type="button"
          aria-label="Modelo anterior"
          onClick={() => goTo(activeIndex - 1)}
          className="absolute left-1 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition active:scale-90 hover:bg-white/20"
        >
          <ChevronLeft size={18} strokeWidth={2} />
        </button>

        <button
          type="button"
          aria-label="Próximo modelo"
          onClick={() => goTo(activeIndex + 1)}
          className="absolute right-1 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition active:scale-90 hover:bg-white/20"
        >
          <ChevronRight size={18} strokeWidth={2} />
        </button>
      </div>

      <div className="flex items-center gap-1">
        {templates.map((template, index) => (
          <button
            key={template.id}
            type="button"
            aria-label={`Selecionar ${template.name}`}
            onClick={() => goTo(index)}
            className="flex h-8 w-6 items-center justify-center"
          >
            <span
              className={`block h-2 rounded-full transition-all ${
                index === activeIndex ? "w-5 bg-white" : "w-2 bg-white/30"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
