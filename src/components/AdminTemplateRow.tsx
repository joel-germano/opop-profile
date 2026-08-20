"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { resizeTemplateToDataUrl } from "@/lib/resize-template";
import { replaceTemplateImageAction, deleteTemplateAdminAction } from "@/app/admin/(dashboard)/molduras/actions";

export function AdminTemplateRow({
  templateId,
  imageUrl,
}: {
  templateId: string;
  imageUrl: string;
}) {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleReplace = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError("");
    let dataUrl: string;
    try {
      dataUrl = await resizeTemplateToDataUrl(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível processar a imagem.");
      return;
    }

    const fd = new FormData();
    fd.set("imageDataUrl", dataUrl);

    startTransition(async () => {
      const result = await replaceTemplateImageAction(templateId, null, fd);
      if (result && "error" in result) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (!confirm("Excluir esta moldura?")) return;
    startTransition(async () => {
      await deleteTemplateAdminAction(templateId);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative aspect-square w-28 overflow-hidden rounded-2xl bg-white/5">
        <Image src={imageUrl} alt="Moldura" fill className="object-cover" />
      </div>

      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isPending}
          aria-label="Substituir imagem"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition active:scale-90 hover:bg-white/20 disabled:opacity-60"
        >
          <Pencil size={13} strokeWidth={1.75} />
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          aria-label="Excluir moldura"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/15 text-red-400 transition active:scale-90 hover:bg-red-500/25 disabled:opacity-60"
        >
          <Trash2 size={13} strokeWidth={1.75} />
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleReplace}
      />

      {error && (
        <p className="w-28 text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
