"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Info,
  RotateCcw,
  RotateCw,
  Sparkles,
  Type,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { Template } from "@/lib/templates";
import { compositeCard, downloadImage } from "@/lib/composite";
import { DEFAULT_PHOTO_TRANSFORM, type PhotoTransform } from "@/lib/photo-transform";
import { createTextLayer, type TextLayer } from "@/lib/text-layer";
import { DEFAULT_PHOTO_FILTER, PHOTO_FILTERS } from "@/lib/photo-filters";
import { PhotoStage, type PhotoStageHandle } from "@/components/PhotoStage";
import { TextEditorPanel } from "@/components/TextEditorPanel";
import { EffectsPanel } from "@/components/EffectsPanel";
import { PresidentialShareModal } from "@/components/PresidentialShareModal";

// Cópia paralela de PhotoEditorModal.tsx — só troca o modal final de
// compartilhamento (PresidentialShareModal, legenda diferente). Ver
// conversa sobre manter esse fluxo isolado do existente.

type Props = {
  templates: Template[];
  initialIndex: number;
  photoUrl: string;
  candidateSlug: string;
  onClose: () => void;
  onRequestNewPhoto: () => void;
};

export function PresidentialPhotoEditor({
  templates,
  initialIndex,
  photoUrl,
  candidateSlug,
  onClose,
  onRequestNewPhoto,
}: Props) {
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);
  const [isDownloading, setIsDownloading] = useState(false);
  const [transform, setTransform] = useState<PhotoTransform>(DEFAULT_PHOTO_TRANSFORM);
  const [blurBackground, setBlurBackground] = useState(true);
  const [textLayers, setTextLayers] = useState<TextLayer[]>([]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [photoFilterId, setPhotoFilterId] = useState(DEFAULT_PHOTO_FILTER.id);
  const [isEffectsPanelOpen, setIsEffectsPanelOpen] = useState(false);
  const [filterBeforeEditing, setFilterBeforeEditing] = useState(DEFAULT_PHOTO_FILTER.id);
  const [result, setResult] = useState<{
    blob: Blob;
    url: string;
    fileName: string;
  } | null>(null);
  const selected = templates[selectedIndex];
  const editingLayer = textLayers.find((t) => t.id === editingTextId) ?? null;
  const photoFilterCss =
    PHOTO_FILTERS.find((f) => f.id === photoFilterId)?.css ?? DEFAULT_PHOTO_FILTER.css;
  const thumbStripRef = useRef<HTMLDivElement>(null);
  const photoStageRef = useRef<PhotoStageHandle>(null);

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

  const handleOpenEffects = () => {
    setFilterBeforeEditing(photoFilterId);
    setIsEffectsPanelOpen(true);
  };

  const handleDiscardEffects = () => {
    setPhotoFilterId(filterBeforeEditing);
    setIsEffectsPanelOpen(false);
  };

  const patchTextLayer = (id: string, patch: Partial<TextLayer>) => {
    setTextLayers((layers) =>
      layers.map((layer) => (layer.id === id ? { ...layer, ...patch } : layer))
    );
  };

  const handleAddText = () => {
    const layer = createTextLayer();
    setTextLayers((layers) => [...layers, layer]);
    setSelectedTextId(layer.id);
    setEditingTextId(layer.id);
  };

  const handleDiscardText = () => {
    if (editingTextId) {
      setTextLayers((layers) => layers.filter((l) => l.id !== editingTextId));
      if (selectedTextId === editingTextId) setSelectedTextId(null);
    }
    setEditingTextId(null);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const blob = await compositeCard(
        photoUrl,
        selected.src,
        transform,
        blurBackground,
        photoFilterCss,
        textLayers
      );
      const fileName = `${selected.name.replace(/\s+/g, "-").toLowerCase()}.png`;
      downloadImage(blob, fileName);
      setResult({ blob, url: URL.createObjectURL(blob), fileName });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCloseResult = () => {
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
  };

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
      <div className="flex shrink-0 items-center justify-between px-3 py-3 sm:px-4 sm:py-4">
        <div className="w-10" />
        <h2 className="font-heading text-lg font-normal tracking-wide text-white">
          Ajustes
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

      <div className="flex shrink-0 items-center justify-center gap-2 px-4 pb-3 sm:gap-3 sm:pb-4">
        <button
          type="button"
          aria-label="Efeitos"
          onClick={handleOpenEffects}
          aria-pressed={isEffectsPanelOpen}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition active:scale-90 ${
            isEffectsPanelOpen ? "bg-brand/90 text-black" : "bg-white/10"
          }`}
        >
          <Sparkles size={18} strokeWidth={1.75} />
        </button>
        <button
          type="button"
          aria-label="Adicionar texto"
          onClick={handleAddText}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white/10 text-white transition active:scale-90 active:bg-white/20"
        >
          <Type size={18} strokeWidth={1.75} />
        </button>
        <button
          type="button"
          onClick={() => setBlurBackground((prev) => !prev)}
          aria-pressed={blurBackground}
          className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-white/10 px-3 transition active:scale-95"
        >
          <span
            className={`h-5 w-9 shrink-0 rounded-full p-0.5 transition-colors ${
              blurBackground ? "bg-brand/90" : "bg-white/20"
            }`}
          >
            <span
              className={`block h-4 w-4 rounded-full bg-white transition-transform ${
                blurBackground ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </span>
          <span className="whitespace-nowrap text-sm font-medium text-white">
            Desfoque
          </span>
          <Info size={14} strokeWidth={1.75} className="text-white/70" />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 px-6">
        <PhotoStage
          ref={photoStageRef}
          photoUrl={photoUrl}
          templateSrc={selected.src}
          templateAlt={selected.name}
          initialTransform={transform}
          onTransformCommit={setTransform}
          blurBackground={blurBackground}
          photoFilterCss={photoFilterCss}
          textLayers={textLayers}
          selectedTextId={selectedTextId}
          onSelectText={setSelectedTextId}
          onChangeText={patchTextLayer}
          onDeleteText={(id) => {
            setTextLayers((layers) => layers.filter((l) => l.id !== id));
            if (selectedTextId === id) setSelectedTextId(null);
            if (editingTextId === id) setEditingTextId(null);
          }}
          onDeselectText={() => setSelectedTextId(null)}
          onRequestEditText={setEditingTextId}
        />

        <div className="flex shrink-0 items-center gap-0.5 rounded-full bg-white/10 px-1.5 py-1.5">
          <button
            type="button"
            aria-label="Aumentar zoom"
            onClick={() => photoStageRef.current?.zoomBy(1.2)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-white transition active:scale-90 active:bg-white/20 hover:bg-white/10"
          >
            <ZoomIn size={18} strokeWidth={1.75} />
          </button>
          <button
            type="button"
            aria-label="Diminuir zoom"
            onClick={() => photoStageRef.current?.zoomBy(1 / 1.2)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-white transition active:scale-90 active:bg-white/20 hover:bg-white/10"
          >
            <ZoomOut size={18} strokeWidth={1.75} />
          </button>

          <div className="mx-1 h-5 w-px bg-white/20" />

          <button
            type="button"
            aria-label="Girar para a esquerda"
            onClick={() => photoStageRef.current?.rotateBy(-15)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-white transition active:scale-90 active:bg-white/20 hover:bg-white/10"
          >
            <RotateCcw size={18} strokeWidth={1.75} />
          </button>
          <button
            type="button"
            aria-label="Girar para a direita"
            onClick={() => photoStageRef.current?.rotateBy(15)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-white transition active:scale-90 active:bg-white/20 hover:bg-white/10"
          >
            <RotateCw size={18} strokeWidth={1.75} />
          </button>
        </div>

        {!editingLayer && !isEffectsPanelOpen && (
          <p className="px-2 text-center text-sm text-white/40">
            Arraste para posicionar e use o zoom (pinça ou scroll) para ajustar
          </p>
        )}
      </div>

      {editingLayer ? (
        <TextEditorPanel
          layer={editingLayer}
          onChange={(patch) => patchTextLayer(editingLayer.id, patch)}
          onDiscard={handleDiscardText}
          onDone={() => setEditingTextId(null)}
        />
      ) : isEffectsPanelOpen ? (
        <EffectsPanel
          photoUrl={photoUrl}
          selectedId={photoFilterId}
          onSelect={setPhotoFilterId}
          onDiscard={handleDiscardEffects}
          onDone={() => setIsEffectsPanelOpen(false)}
        />
      ) : (
        <>
          <div className="relative shrink-0 px-6 pb-3 pt-2 sm:pb-4">
            <button
              type="button"
              aria-label="Rolar modelos para a esquerda"
              onClick={() =>
                thumbStripRef.current?.scrollBy({ left: -160, behavior: "smooth" })
              }
              className="absolute left-1 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-[#1c1c1c]/90 text-white shadow transition active:scale-90 hover:bg-[#1c1c1c] md:flex"
            >
              <ChevronLeft size={16} strokeWidth={2} />
            </button>

            <div
              ref={thumbStripRef}
              className="flex gap-3 overflow-x-auto scrollbar-none"
            >
              {templates.map((template, index) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setSelectedIndex(index)}
                  className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-md ring-2 transition active:scale-95 sm:h-14 sm:w-14 ${
                    index === selectedIndex
                      ? "ring-brand"
                      : "ring-white/10 opacity-70"
                  }`}
                >
                  <Image
                    src={template.src}
                    alt={template.name}
                    fill
                    sizes="56px"
                    className="absolute inset-0 object-cover"
                  />
                </button>
              ))}
            </div>

            <button
              type="button"
              aria-label="Rolar modelos para a direita"
              onClick={() =>
                thumbStripRef.current?.scrollBy({ left: 160, behavior: "smooth" })
              }
              className="absolute right-1 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-[#1c1c1c]/90 text-white shadow transition active:scale-90 hover:bg-[#1c1c1c] md:flex"
            >
              <ChevronRight size={16} strokeWidth={2} />
            </button>
          </div>

          <div className="flex shrink-0 items-center gap-3 px-6 pb-6 pt-2 sm:pb-8">
            <button
              type="button"
              aria-label="Trocar foto"
              onClick={onRequestNewPhoto}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition active:scale-90 hover:bg-white/20 sm:h-14 sm:w-14"
            >
              <Camera size={22} strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex h-12 flex-1 items-center justify-center rounded-full bg-brand text-base font-semibold text-black transition active:scale-[0.98] hover:bg-brand-light disabled:opacity-60 disabled:active:scale-100 sm:h-14"
            >
              {isDownloading ? "Gerando..." : "Fazer Download"}
            </button>
          </div>
        </>
      )}

      {result && (
        <PresidentialShareModal
          imageUrl={result.url}
          blob={result.blob}
          fileName={result.fileName}
          candidateSlug={candidateSlug}
          onClose={handleCloseResult}
          onStartOver={() => {
            handleCloseResult();
            onClose();
          }}
        />
      )}
    </div>
  );
}
