"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Download, Globe, Loader2, Lock, X } from "lucide-react";
import {
  getMyGalleryAction,
  setGalleryPostVisibilityAction,
  type MyGalleryItem,
} from "@/app/presidenciaveis/invite-actions";

// "Minha Galeria": tudo que a própria pessoa já gerou, em qualquer
// candidato, pública ou privada — é o "pegar depois" que a compra promete
// (gerar de novo gastaria outra moldura). Mesmo padrão de scroll infinito
// do GalleryFeedModal (cursor de _id, sentinel com IntersectionObserver),
// só que a fonte é getMyGalleryAction (por supporterId, não por candidato).
export function MyGalleryModal({ onClose }: { onClose: () => void }) {
  const [items, setItems] = useState<MyGalleryItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const page = await getMyGalleryAction(cursor);
      if ("error" in page) {
        setHasMore(false);
        return;
      }
      setItems((prev) => [...prev, ...page.items]);
      setCursor(page.nextCursor);
      setHasMore(page.nextCursor !== null);
    } finally {
      loadingRef.current = false;
      setLoading(false);
      setInitialLoad(false);
    }
  }, [cursor, hasMore]);

  useEffect(() => {
    loadMore();
    // Só na montagem — loadMore muda de identidade a cada página carregada.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "400px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleToggleVisibility = async (item: MyGalleryItem) => {
    const next = item.visibility === "private" ? "public" : "private";
    setPendingId(item.id);
    try {
      const result = await setGalleryPostVisibilityAction(item.id, next);
      if (result.ok) {
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, visibility: result.visibility } : i))
        );
      }
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center bg-black/70 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[85vh] w-full max-w-sm flex-col overflow-hidden rounded-3xl bg-[#1c1c1c] shadow-2xl shadow-black/60 ring-1 ring-white/10">
        <div className="flex shrink-0 items-center justify-between px-4 py-3 sm:py-4">
          <div className="w-10" />
          <h2 className="text-lg font-bold tracking-tight text-white">Minha Galeria</h2>
          <button
            type="button"
            aria-label="Fechar"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition active:scale-90 hover:bg-white/20"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-6">
          {initialLoad && loading ? (
            <div className="flex justify-center py-10">
              <Loader2 size={20} className="animate-spin text-white/40" />
            </div>
          ) : items.length === 0 ? (
            <p className="py-10 text-center text-sm text-white/40">
              Você ainda não gerou nenhuma moldura.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 min-[420px]:grid-cols-3">
                {items.map((item) => (
                  <div key={item.id} className="flex flex-col gap-1.5">
                    <div className="relative aspect-square overflow-hidden rounded-xl bg-white/5">
                      <Image
                        src={item.imageUrl}
                        alt=""
                        fill
                        sizes="(min-width: 420px) 120px, 160px"
                        className="object-cover"
                      />
                      {/* Badge sobre a foto em vez de texto espremido ao lado
                          dos botões — libera espaço pra eles ficarem só ícone
                          e não quebrar linha em nenhuma largura de tela. */}
                      <span
                        className={`absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm ${
                          item.visibility === "public"
                            ? "bg-brand/85 text-black"
                            : "bg-black/60 text-white/80"
                        }`}
                      >
                        {item.visibility === "public" ? (
                          <Globe size={9} strokeWidth={2.5} />
                        ) : (
                          <Lock size={9} strokeWidth={2.5} />
                        )}
                        {item.visibility === "public" ? "Pública" : "Privada"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleVisibility(item)}
                        disabled={pendingId === item.id}
                        aria-label={
                          item.visibility === "public"
                            ? "Tornar privada"
                            : "Tornar pública"
                        }
                        className="flex h-7 flex-1 items-center justify-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/20 disabled:opacity-40"
                      >
                        {pendingId === item.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : item.visibility === "public" ? (
                          <Lock size={12} strokeWidth={2.5} />
                        ) : (
                          <Globe size={12} strokeWidth={2.5} />
                        )}
                      </button>
                      <a
                        href={item.imageUrl}
                        download
                        aria-label="Baixar"
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/20"
                      >
                        <Download size={12} strokeWidth={2.5} />
                      </a>
                    </div>

                    <Link
                      href={`/presidenciaveis/${item.candidateSlug}`}
                      className="truncate text-center text-[10px] text-white/40 hover:text-white/60"
                    >
                      {item.candidateSlug}
                    </Link>
                  </div>
                ))}
              </div>

              {hasMore && (
                <div ref={sentinelRef} className="flex justify-center py-6">
                  {loading && (
                    <Loader2 size={20} className="animate-spin text-white/40" />
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
