"use client";

import Image from "next/image";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import {
  clampPhotoTransform,
  type PhotoTransform,
} from "@/lib/photo-transform";
import type { TextLayer } from "@/lib/text-layer";
import { combineFilters } from "@/lib/photo-filters";
import { DraggableText } from "@/components/DraggableText";

type Point = { x: number; y: number };

type GestureState = {
  mode: "none" | "pan" | "pinch";
  startTransform: PhotoTransform;
  startPointer?: Point;
  startDist?: number;
  startMid?: Point;
};

export type PhotoStageHandle = {
  zoomBy: (factor: number) => void;
  rotateBy: (deg: number) => void;
};

type Props = {
  photoUrl: string;
  templateSrc: string;
  templateAlt: string;
  initialTransform: PhotoTransform;
  onTransformCommit: (transform: PhotoTransform) => void;
  blurBackground: boolean;
  photoFilterCss: string;
  textLayers: TextLayer[];
  selectedTextId: string | null;
  onSelectText: (id: string) => void;
  onChangeText: (id: string, patch: Partial<TextLayer>) => void;
  onDeleteText: (id: string) => void;
  onDeselectText: () => void;
  onRequestEditText: (id: string) => void;
  // Com um painel (texto/efeitos) aberto embaixo, tira o teto de altura
  // baseado em viewport (52dvh) — a prévia fica larga o quanto o contêiner
  // permitir, e o modal como um todo rola verticalmente se precisar, em vez
  // de forçar a foto a ficar pequena só pra caber sem rolagem.
  compact?: boolean;
};

function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export const PhotoStage = forwardRef<PhotoStageHandle, Props>(function PhotoStage(
  {
    photoUrl,
    templateSrc,
    templateAlt,
    initialTransform,
    onTransformCommit,
    blurBackground,
    photoFilterCss,
    textLayers,
    selectedTextId,
    onSelectText,
    onChangeText,
    onDeleteText,
    onDeselectText,
    onRequestEditText,
    compact = false,
  },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, Point>());
  const gesture = useRef<GestureState>({ mode: "none", startTransform: initialTransform });
  const [transform, setTransform] = useState<PhotoTransform>(initialTransform);
  const [isInteracting, setIsInteracting] = useState(false);
  const [stageWidth, setStageWidth] = useState(0);
  const transformRef = useRef(transform);
  const wheelEndTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    transformRef.current = transform;
  }, [transform]);

  useImperativeHandle(
    ref,
    () => ({
      zoomBy: (factor: number) => {
        const next = clampPhotoTransform({
          ...transformRef.current,
          scale: transformRef.current.scale * factor,
        });
        setTransform(next);
        onTransformCommit(next);
      },
      rotateBy: (deg: number) => {
        const next = clampPhotoTransform({
          ...transformRef.current,
          rotation: transformRef.current.rotation + deg,
        });
        setTransform(next);
        onTransformCommit(next);
      },
    }),
    [onTransformCommit]
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setStageWidth(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      if (wheelEndTimeout.current) clearTimeout(wheelEndTimeout.current);
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    onDeselectText();
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try {
      containerRef.current?.setPointerCapture(e.pointerId);
    } catch {
      // pointer capture can fail in some emulated/touch environments; safe to ignore
    }
    setIsInteracting(true);

    if (pointers.current.size === 1) {
      gesture.current = {
        mode: "pan",
        startTransform: transformRef.current,
        startPointer: { x: e.clientX, y: e.clientY },
      };
    } else if (pointers.current.size === 2) {
      const pts = Array.from(pointers.current.values());
      gesture.current = {
        mode: "pinch",
        startTransform: transformRef.current,
        startDist: distance(pts[0], pts[1]),
        startMid: midpoint(pts[0], pts[1]),
      };
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const state = gesture.current;

    if (state.mode === "pan" && pointers.current.size === 1 && state.startPointer) {
      const dxFrac = (e.clientX - state.startPointer.x) / rect.width;
      const dyFrac = (e.clientY - state.startPointer.y) / rect.height;
      setTransform(
        clampPhotoTransform({
          ...state.startTransform,
          x: state.startTransform.x + dxFrac,
          y: state.startTransform.y + dyFrac,
        })
      );
    } else if (state.mode === "pinch" && pointers.current.size === 2 && state.startDist && state.startMid) {
      const pts = Array.from(pointers.current.values());
      const dist = distance(pts[0], pts[1]);
      const mid = midpoint(pts[0], pts[1]);
      const scaleFactor = dist / state.startDist;
      const dxFrac = (mid.x - state.startMid.x) / rect.width;
      const dyFrac = (mid.y - state.startMid.y) / rect.height;

      setTransform(
        clampPhotoTransform({
          ...state.startTransform,
          scale: state.startTransform.scale * scaleFactor,
          x: state.startTransform.x + dxFrac,
          y: state.startTransform.y + dyFrac,
        })
      );
    }
  };

  const endPointer = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);

    if (pointers.current.size === 1) {
      const [remaining] = Array.from(pointers.current.values());
      gesture.current = {
        mode: "pan",
        startTransform: transformRef.current,
        startPointer: remaining,
      };
    } else {
      gesture.current = { mode: "none", startTransform: transformRef.current };
    }

    if (pointers.current.size === 0) {
      setIsInteracting(false);
      onTransformCommit(transformRef.current);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setIsInteracting(true);
    const delta = -e.deltaY * 0.0015;
    setTransform((prev) =>
      clampPhotoTransform({ ...prev, scale: prev.scale * (1 + delta) })
    );

    if (wheelEndTimeout.current) clearTimeout(wheelEndTimeout.current);
    wheelEndTimeout.current = setTimeout(() => {
      setIsInteracting(false);
      onTransformCommit(transformRef.current);
    }, 250);
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      onWheel={handleWheel}
      className="relative aspect-square shrink-0 touch-none overflow-hidden rounded-md bg-neutral-200 shadow-2xl select-none"
      style={{
        width: compact ? "min(100%, 24rem)" : "min(100%, 24rem, 52dvh)",
      }}
    >
      {blurBackground && (
        <Image
          src={photoUrl}
          alt=""
          fill
          sizes="400px"
          unoptimized
          draggable={false}
          aria-hidden
          className="absolute inset-0 scale-125 object-cover"
          style={{ filter: combineFilters("blur(24px)", photoFilterCss) }}
        />
      )}

      <div
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        style={{
          transform: `translate(${transform.x * 100}%, ${transform.y * 100}%) scale(${transform.scale}) rotate(${transform.rotation}deg)`,
          transformOrigin: "center",
          willChange: "transform",
        }}
      >
        <Image
          src={photoUrl}
          alt="Sua foto"
          fill
          sizes="400px"
          unoptimized
          draggable={false}
          className="object-contain"
          style={{ filter: photoFilterCss }}
        />
      </div>

      <Image
        src={templateSrc}
        alt={templateAlt}
        fill
        sizes="400px"
        unoptimized
        priority
        className={`pointer-events-none absolute inset-0 object-contain transition-opacity duration-150 ${
          isInteracting ? "opacity-50" : "opacity-100"
        }`}
      />

      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 transition-opacity duration-150 ${
          isInteracting ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="absolute left-1/3 top-0 h-full w-px bg-white/70" />
        <div className="absolute left-2/3 top-0 h-full w-px bg-white/70" />
        <div className="absolute top-1/3 left-0 h-px w-full bg-white/70" />
        <div className="absolute top-2/3 left-0 h-px w-full bg-white/70" />
      </div>

      {textLayers.map((layer) => (
        <DraggableText
          key={layer.id}
          layer={layer}
          stageRef={containerRef}
          stageWidthPx={stageWidth}
          isSelected={layer.id === selectedTextId}
          onSelect={() => onSelectText(layer.id)}
          onCommit={(patch) => onChangeText(layer.id, patch)}
          onDelete={() => onDeleteText(layer.id)}
          onRequestEdit={() => onRequestEditText(layer.id)}
        />
      ))}
    </div>
  );
});
