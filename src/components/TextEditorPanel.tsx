"use client";

import { useRef, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Pipette,
} from "lucide-react";
import { FONT_OPTIONS } from "@/lib/fonts";
import type { TextLayer } from "@/lib/text-layer";

type Props = {
  layer: TextLayer;
  onChange: (patch: Partial<TextLayer>) => void;
  onDiscard: () => void;
  onDone: () => void;
};

const COLOR_ROWS: string[][] = [
  [
    "#000000",
    "#4b5563",
    "#6b7280",
    "#9ca3af",
    "#d1d5db",
    "#ffffff",
    "#ef4444",
    "#fb923c",
    "#fde047",
    "#bef264",
    "#4ade80",
  ],
  [
    "#16a34a",
    "#15803d",
    "#14b8a6",
    "#2dd4bf",
    "#2563eb",
    "#1d4ed8",
    "#6366f1",
    "#7c3aed",
    "#a855f7",
    "#c084fc",
    "#ec4899",
  ],
];

export function TextEditorPanel({ layer, onChange, onDiscard, onDone }: Props) {
  const [isFontListOpen, setIsFontListOpen] = useState(false);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const colorStripRef = useRef<HTMLDivElement>(null);
  const fontIndex = FONT_OPTIONS.findIndex((f) => f.label === layer.fontLabel);

  const selectFont = (index: number) => {
    const opt = FONT_OPTIONS[(index + FONT_OPTIONS.length) % FONT_OPTIONS.length];
    onChange({ fontFamily: opt.family, fontLabel: opt.label, google: opt.google });
  };

  const pickColor = async () => {
    const EyeDropperCtor = (window as unknown as { EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper;
    if (EyeDropperCtor) {
      try {
        const result = await new EyeDropperCtor().open();
        onChange({ color: result.sRGBHex });
        return;
      } catch {
        // user cancelled the eyedropper
      }
    }
    colorInputRef.current?.click();
  };

  return (
    <div className="flex w-full flex-col gap-3 rounded-t-2xl bg-[#2a2a2a] px-5 pb-4 pt-3">
      <textarea
        value={layer.text}
        onChange={(e) => onChange({ text: e.target.value })}
        rows={2}
        placeholder="Digite seu texto"
        autoFocus
        onFocus={(e) => {
          e.target.select();
          // Keeps the field visible above the on-screen keyboard on mobile.
          e.target.scrollIntoView({ block: "center", behavior: "smooth" });
        }}
        className="w-full resize-none rounded-xl bg-white/10 px-3 py-2.5 text-base text-white placeholder:text-white/40 focus:outline-none sm:text-sm"
      />

      <div className="relative">
        <div className="flex items-center gap-2 rounded-full bg-white/10 px-2 py-1">
          <button
            type="button"
            aria-label="Fonte anterior"
            onClick={() => selectFont(fontIndex - 1)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition active:scale-90 active:bg-white/10"
          >
            <ChevronLeft size={16} strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={() => setIsFontListOpen((v) => !v)}
            className="flex-1 truncate rounded-full py-1.5 text-center text-base font-medium text-white transition active:bg-white/10"
          >
            {layer.fontLabel}
          </button>
          <button
            type="button"
            aria-label="Próxima fonte"
            onClick={() => selectFont(fontIndex + 1)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition active:scale-90 active:bg-white/10"
          >
            <ChevronRight size={16} strokeWidth={2} />
          </button>
        </div>

        {isFontListOpen && (
          <div className="absolute bottom-full left-0 right-0 z-10 mb-2 max-h-56 overflow-y-auto overscroll-contain rounded-xl bg-[#333] py-2 shadow-xl">
            {FONT_OPTIONS.map((opt, index) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => {
                  selectFont(index);
                  setIsFontListOpen(false);
                }}
                style={{ fontFamily: opt.family }}
                className={`block w-full px-4 py-2.5 text-left text-base transition active:bg-white/10 ${
                  opt.label === layer.fontLabel ? "text-brand" : "text-white"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex h-12 items-stretch gap-2">
        <div className="flex flex-1 items-center justify-between rounded-full bg-white/10 pl-1 pr-3">
          <button
            type="button"
            aria-label="Diminuir fonte"
            onClick={() => onChange({ size: Math.max(10, layer.size - 4) })}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/80 transition active:scale-90 active:bg-white/10"
          >
            <ChevronDown size={16} strokeWidth={2.5} />
          </button>
          <span className="text-base text-white">{Math.round(layer.size)}</span>
          <button
            type="button"
            aria-label="Aumentar fonte"
            onClick={() => onChange({ size: Math.min(200, layer.size + 4) })}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/80 transition active:scale-90 active:bg-white/10"
          >
            <ChevronUp size={16} strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex flex-1 items-center justify-center gap-1 rounded-full bg-white/10 px-2">
          <StyleToggle
            label="B"
            className="font-bold"
            active={layer.bold}
            onClick={() => onChange({ bold: !layer.bold })}
          />
          <StyleToggle
            label="I"
            className="italic"
            active={layer.italic}
            onClick={() => onChange({ italic: !layer.italic })}
          />
          <StyleToggle
            label="U"
            className="underline"
            active={layer.underline}
            onClick={() => onChange({ underline: !layer.underline })}
          />
          <StyleToggle
            label="S"
            className="line-through"
            active={layer.strikethrough}
            onClick={() => onChange({ strikethrough: !layer.strikethrough })}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Escolher cor personalizada"
          onClick={pickColor}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 text-white transition active:scale-90 active:bg-white/10"
        >
          <Pipette size={15} strokeWidth={1.75} />
          <input
            ref={colorInputRef}
            type="color"
            value={layer.color}
            onChange={(e) => onChange({ color: e.target.value })}
            className="sr-only"
          />
        </button>

        <div className="relative min-w-0 flex-1">
          <button
            type="button"
            aria-label="Rolar cores para a esquerda"
            onClick={() => colorStripRef.current?.scrollBy({ left: -120, behavior: "smooth" })}
            className="absolute -left-1 top-1/2 z-10 hidden h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#1c1c1c]/90 text-white shadow transition active:scale-90 hover:bg-[#1c1c1c] md:flex"
          >
            <ChevronLeft size={16} strokeWidth={2} />
          </button>

          <div
            ref={colorStripRef}
            className="flex flex-col gap-2 overflow-x-auto scrollbar-none"
          >
            {COLOR_ROWS.map((row, rowIndex) => (
              <div key={rowIndex} className="flex w-max items-center gap-2">
                {row.map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={`Cor ${color}`}
                    onClick={() => onChange({ color })}
                    className={`h-8 w-8 shrink-0 rounded-full border-2 transition active:scale-90 ${
                      layer.color.toLowerCase() === color
                        ? "border-brand"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            ))}
          </div>

          <button
            type="button"
            aria-label="Rolar cores para a direita"
            onClick={() => colorStripRef.current?.scrollBy({ left: 120, behavior: "smooth" })}
            className="absolute -right-1 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full bg-[#1c1c1c]/90 text-white shadow transition active:scale-90 hover:bg-[#1c1c1c] md:flex"
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

function StyleToggle({
  label,
  className,
  active,
  onClick,
}: {
  label: string;
  className: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex h-9 w-9 items-center justify-center rounded-full text-sm transition active:scale-90 ${className} ${
        active ? "bg-brand text-black" : "text-white active:bg-white/10"
      }`}
    >
      {label}
    </button>
  );
}

