"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Upload } from "lucide-react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy } from "@dnd-kit/sortable";
import {
  addTemplateAction,
  deleteTemplateAction,
  reorderTemplatesAction,
} from "@/app/painel/configuracoes/actions";
import { resizeTemplateToDataUrl } from "@/lib/resize-template";
import { TemplateTile } from "@/components/TemplateTile";

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
  const [items, setItems] = useState(templates);
  // Ressincroniza com o servidor sempre que a prop `templates` mudar (ex:
  // depois de um add/delete que dispara router.refresh()) — setState durante
  // a própria renderização em vez de useEffect, pra não ter um frame extra
  // mostrando a lista antiga. Não afeta reordenação local: só muda quando o
  // servidor manda um array novo, não a cada re-render.
  const [prevTemplates, setPrevTemplates] = useState(templates);
  if (templates !== prevTemplates) {
    setPrevTemplates(templates);
    setItems(templates);
  }

  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const canAddMore = items.length < limit;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError("");
    setIsUploading(true);

    let dataUrl: string;
    try {
      dataUrl = await resizeTemplateToDataUrl(file);
    } catch (err) {
      setIsUploading(false);
      setError(err instanceof Error ? err.message : "Não foi possível processar a imagem.");
      return;
    }

    const fd = new FormData();
    fd.set("imageDataUrl", dataUrl);

    startTransition(async () => {
      const result = await addTemplateAction(null, fd);
      setIsUploading(false);
      if (result && "error" in result) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  const handleDelete = (id: string) => {
    setError("");
    setDeletingId(id);
    startTransition(async () => {
      await deleteTemplateAction(id);
      setDeletingId(null);
      router.refresh();
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((t) => t.id === active.id);
    const newIndex = items.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);

    startTransition(async () => {
      await reorderTemplatesAction(next.map((t) => t.id));
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {items.length > 1 && (
        <p className="text-xs text-white/40">
          Segure o ícone{" "}
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white/10 align-text-bottom">
            ⠿
          </span>{" "}
          no canto de cada moldura pra arrastar e mudar a ordem.
        </p>
      )}

      {items.length === 0 ? (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isPending}
          className="flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-white/20 bg-black/30 px-6 py-8 text-center transition active:scale-[0.99] hover:border-primary-light/50 disabled:opacity-60"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white/70">
            {isUploading ? (
              <Loader2 size={22} className="animate-spin" />
            ) : (
              <Upload size={20} strokeWidth={1.75} />
            )}
          </div>
          <h2 className="text-sm font-bold text-white">
            {isUploading ? "Enviando..." : "Envie sua moldura aqui"}
          </h2>
          {!isUploading && (
            <dl className="flex flex-col items-center gap-1 text-xs">
              <div className="flex gap-1.5">
                <dt className="text-white/40">Formato:</dt>
                <dd className="font-medium text-white/70">PNG transparente</dd>
              </div>
              <div className="flex gap-1.5">
                <dt className="text-white/40">Tamanho máximo:</dt>
                <dd className="font-medium text-white/70">1 MB</dd>
              </div>
              <div className="flex gap-1.5">
                <dt className="text-white/40">Recomendado:</dt>
                <dd className="font-medium text-white/70">1080x1080px</dd>
              </div>
            </dl>
          )}
        </button>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((t) => t.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-3 gap-3">
              {canAddMore && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isPending}
                  className="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/25 bg-primary/10 text-primary-light transition active:scale-95 hover:border-primary-light hover:bg-primary/15 disabled:opacity-60"
                >
                  {isUploading ? (
                    <>
                      <Loader2 size={24} className="animate-spin" />
                      <span className="text-xs font-bold">Enviando...</span>
                    </>
                  ) : (
                    <>
                      <ImagePlus size={24} strokeWidth={2} />
                      <span className="text-xs font-bold">Adicionar</span>
                    </>
                  )}
                </button>
              )}

              {items.map((t) => (
                <TemplateTile
                  key={t.id}
                  id={t.id}
                  imageUrl={t.imageUrl}
                  isDeleting={deletingId === t.id}
                  onDelete={() => handleDelete(t.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

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
          <Link href="/painel/checkout" className="font-medium text-danger-light underline decoration-danger/40 underline-offset-2">
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
