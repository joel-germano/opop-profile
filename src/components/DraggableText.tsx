"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCw, Trash2 } from "lucide-react";
import { textCssFontStyle, textFontSizePx, type TextLayer } from "@/lib/text-layer";

type Point = { x: number; y: number };

type LiveState = {
  x: number;
  y: number;
  scale: number;
  rotation: number;
};

type Props = {
  layer: TextLayer;
  stageRef: React.RefObject<HTMLDivElement | null>;
  stageWidthPx: number;
  isSelected: boolean;
  onSelect: () => void;
  onCommit: (patch: Partial<TextLayer>) => void;
  onDelete: () => void;
  onRequestEdit: () => void;
};

function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function angleDeg(center: Point, p: Point) {
  return (Math.atan2(p.y - center.y, p.x - center.x) * 180) / Math.PI;
}

export function DraggableText({
  layer,
  stageRef,
  stageWidthPx,
  isSelected,
  onSelect,
  onCommit,
  onDelete,
  onRequestEdit,
}: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState<LiveState>({
    x: layer.x,
    y: layer.y,
    scale: layer.scale,
    rotation: layer.rotation,
  });
  const liveRef = useRef(live);
  const dragState = useRef<{
    mode: "move" | "resize" | "rotate";
    startPointer: Point;
    startLive: LiveState;
    center?: Point;
    startDist?: number;
    startAngle?: number;
  } | null>(null);

  useEffect(() => {
    liveRef.current = live;
  }, [live]);

  const getStageRect = () => stageRef.current?.getBoundingClientRect();

  const handleMoveDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    onSelect();
    (e.target as Element).setPointerCapture(e.pointerId);
    dragState.current = {
      mode: "move",
      startPointer: { x: e.clientX, y: e.clientY },
      startLive: liveRef.current,
    };
  };

  const handleResizeDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    const box = wrapperRef.current?.getBoundingClientRect();
    const center = box
      ? { x: box.left + box.width / 2, y: box.top + box.height / 2 }
      : { x: e.clientX, y: e.clientY };
    dragState.current = {
      mode: "resize",
      startPointer: { x: e.clientX, y: e.clientY },
      startLive: liveRef.current,
      center,
      startDist: distance(center, { x: e.clientX, y: e.clientY }),
    };
  };

  const handleRotateDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    const box = wrapperRef.current?.getBoundingClientRect();
    const center = box
      ? { x: box.left + box.width / 2, y: box.top + box.height / 2 }
      : { x: e.clientX, y: e.clientY };
    dragState.current = {
      mode: "rotate",
      startPointer: { x: e.clientX, y: e.clientY },
      startLive: liveRef.current,
      center,
      startAngle: angleDeg(center, { x: e.clientX, y: e.clientY }),
    };
  };

  const handleMove = (e: React.PointerEvent) => {
    const state = dragState.current;
    if (!state) return;
    e.stopPropagation();

    if (state.mode === "move") {
      const rect = getStageRect();
      if (!rect) return;
      const dxFrac = (e.clientX - state.startPointer.x) / rect.width;
      const dyFrac = (e.clientY - state.startPointer.y) / rect.height;
      setLive((prev) => ({
        ...prev,
        x: state.startLive.x + dxFrac,
        y: state.startLive.y + dyFrac,
      }));
    } else if (state.mode === "resize" && state.center && state.startDist) {
      const dist = distance(state.center, { x: e.clientX, y: e.clientY });
      const factor = dist / state.startDist;
      const nextScale = Math.min(6, Math.max(0.2, state.startLive.scale * factor));
      setLive((prev) => ({ ...prev, scale: nextScale }));
    } else if (state.mode === "rotate" && state.center && state.startAngle !== undefined) {
      const current = angleDeg(state.center, { x: e.clientX, y: e.clientY });
      setLive((prev) => ({
        ...prev,
        rotation: state.startLive.rotation + (current - state.startAngle!),
      }));
    }
  };

  const handleUp = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (!dragState.current) return;
    try {
      (e.target as Element).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    dragState.current = null;
    onCommit(liveRef.current);
  };

  const fontSizePx = textFontSizePx({ ...layer, scale: live.scale }, stageWidthPx);

  return (
    <div
      className="absolute"
      style={{
        left: `${(0.5 + live.x) * 100}%`,
        top: `${(0.5 + live.y) * 100}%`,
        transform: `translate(-50%, -50%) rotate(${live.rotation}deg)`,
        willChange: "transform",
      }}
    >
      <div ref={wrapperRef} className="relative inline-block w-max max-w-none">
        <div
          onPointerDown={handleMoveDown}
          onPointerMove={handleMove}
          onPointerUp={handleUp}
          onPointerCancel={handleUp}
          onDoubleClick={(e) => {
            e.stopPropagation();
            onRequestEdit();
          }}
          className={`w-max max-w-none touch-none select-none px-2 py-1 leading-tight ${
            isSelected ? "outline outline-1 outline-dashed outline-white/70" : ""
          }`}
          style={{
            ...textCssFontStyle(layer),
            fontSize: `${fontSizePx}px`,
            whiteSpace: "pre",
          }}
        >
          {layer.text || " "}
        </div>

        {isSelected && (
          <>
            <button
              type="button"
              aria-label="Excluir texto"
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="absolute -left-10 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 touch-none items-center justify-center rounded-md bg-red-500 text-white shadow-lg transition active:scale-90"
            >
              <Trash2 size={16} strokeWidth={2} />
            </button>

            <div
              onPointerDown={handleRotateDown}
              onPointerMove={handleMove}
              onPointerUp={handleUp}
              onPointerCancel={handleUp}
              className="absolute -top-10 left-1/2 flex h-9 w-9 -translate-x-1/2 touch-none cursor-grab items-center justify-center active:cursor-grabbing"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-black shadow">
                <RotateCw size={12} strokeWidth={2} />
              </span>
            </div>

            {[
              { pos: "-left-4 -top-4", cursor: "cursor-nwse-resize" },
              { pos: "-right-4 -top-4", cursor: "cursor-nesw-resize" },
              { pos: "-left-4 -bottom-4", cursor: "cursor-nesw-resize" },
              { pos: "-right-4 -bottom-4", cursor: "cursor-nwse-resize" },
            ].map(({ pos, cursor }) => (
              <div
                key={pos}
                onPointerDown={handleResizeDown}
                onPointerMove={handleMove}
                onPointerUp={handleUp}
                onPointerCancel={handleUp}
                className={`absolute flex h-8 w-8 touch-none items-center justify-center ${pos} ${cursor}`}
              >
                <span className="h-3.5 w-3.5 rounded-full border border-black/20 bg-white shadow" />
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
