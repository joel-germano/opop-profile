"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { addTemplateAction, deleteTemplateAction } from "@/app/painel/configuracoes/actions";
import { resizeTemplateToDataUrl } from "@/lib/resize-template";

type TemplateItem = { id: string; imageUrl: string };

export function TemplatesManager({
  templates,
  limit,
  plan,
}: {
  templates: TemplateItem[];
  limit: number;
  plan: "free" | "premium";
}) {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const canAddMore = templates.length < limit;

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
      const result = await addTemplateAction(null, fd);
      if (result && "error" in result) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  const handleDelete = (id: string) => {
    setError("");
    startTransition(async () => {
      await deleteTemplateAction(id);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-white/60">
        {templates.length} de {limit} moldura{limit > 1 ? "s" : ""} ·{" "}
        {plan === "premium" ? "Premium" : "Free"}
      </p>

      <div className="grid grid-cols-3 gap-3">
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

        {canAddMore && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isPending}
            className="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/20 text-white/50 transition active:scale-95 hover:border-white/40 hover:text-white/70 disabled:opacity-60"
          >
            <Plus size={22} />
            <span className="text-xs font-medium">Adicionar</span>
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {!canAddMore && plan === "free" && (
        <p className="text-sm text-white/60">
          Contas free podem ter só 1 moldura.{" "}
          <Link href="/painel/checkout" className="font-medium text-brand-light underline">
            Torne-se Premium
          </Link>{" "}
          pra adicionar mais.
        </p>
      )}

      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
