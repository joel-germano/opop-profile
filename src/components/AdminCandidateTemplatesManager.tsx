"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import {
  addCandidateTemplateAction,
  deleteCandidateTemplateAction,
} from "@/app/admin/(dashboard)/presidenciaveis/actions";
import { resizeTemplateToDataUrl } from "@/lib/resize-template";

type TemplateItem = { id: string; imageUrl: string };

export function AdminCandidateTemplatesManager({
  candidateId,
  templates,
}: {
  candidateId: string;
  templates: TemplateItem[];
}) {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const result = await addCandidateTemplateAction(candidateId, null, fd);
      if (result && "error" in result) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Excluir esta moldura?")) return;
    startTransition(async () => {
      await deleteCandidateTemplateAction(id);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-white/60">{templates.length} moldura(s).</p>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {templates.map((t) => (
          <div key={t.id} className="relative aspect-square overflow-hidden rounded-2xl bg-white/5">
            <Image src={t.imageUrl} alt="Moldura" fill className="object-cover" />
            <button
              type="button"
              onClick={() => handleDelete(t.id)}
              disabled={isPending}
              aria-label="Remover moldura"
              className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition active:scale-90 disabled:opacity-60"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isPending}
          className="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/20 text-white/50 transition active:scale-95 hover:border-white/40 hover:text-white/70 disabled:opacity-60"
        >
          <Plus size={22} />
          <span className="text-xs font-medium">Adicionar</span>
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
