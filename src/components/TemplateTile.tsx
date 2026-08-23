"use client";

import Image from "next/image";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Loader2, Trash2 } from "lucide-react";

type Props = {
  id: string;
  imageUrl: string;
  isDeleting: boolean;
  onDelete: () => void;
};

export function TemplateTile({ id, imageUrl, isDeleting, onDelete }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`relative aspect-square overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10 ${
        isDragging ? "z-10 opacity-70" : ""
      }`}
    >
      <Image
        src={imageUrl}
        alt="Moldura"
        fill
        sizes="(max-width: 480px) 33vw, 160px"
        className="object-cover"
      />

      <button
        type="button"
        onClick={onDelete}
        disabled={isDeleting}
        aria-label="Remover moldura"
        className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition active:scale-90 disabled:opacity-60"
      >
        {isDeleting ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Trash2 size={14} />
        )}
      </button>

      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Arrastar pra reordenar"
        className="absolute left-1.5 top-1.5 flex h-7 w-7 touch-none items-center justify-center rounded-full bg-black/60 text-white transition active:scale-90"
      >
        <GripVertical size={14} />
      </button>
    </div>
  );
}
