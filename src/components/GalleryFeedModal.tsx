"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Globe, Loader2, Lock, X } from "lucide-react";
import { getGalleryFeedAction, type GalleryFeedItem } from "@/app/presidenciaveis/actions";

// Modal "galeria completa": grid de 3 colunas, scroll infinito. Cada página
// vem do servidor já paginada por cursor (ver getGalleryFeedAction) — nunca
// carrega a galeria inteira de uma vez, então funciona igual com 20 ou com
// 1 milhão de posts. O sentinel no fim da lista dispara a próxima página via
// IntersectionObserver assim que entra na viewport (sem listener de scroll).
//
// Aba "Minhas" (só aparece logado): reusa o mesmo getGalleryFeedAction com
// onlyMine=true — troca o filtro de `visibility: "public"` pra
// `supporterId` da sessão no servidor, então mostra pública E privada, mas
// só da própria pessoa. Trocar de aba reseta cursor/paginação do zero.
export function GalleryFeedModal({
  candidateSlug,
  initialItems,
  isLoggedIn = false,
  onClose,
}: {
  candidateSlug: string;
  initialItems: GalleryFeedItem[];
  isLoggedIn?: boolean;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"all" | "mine">("all");
  const [items, setItems] = useState(initialItems);
  const [cursor, setCursor] = useState<string | null>(
    initialItems.length > 0 ? initialItems[initialItems.length - 1].id : null
  );
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const page = await getGalleryFeedAction(candidateSlug, cursor, tab === "mine");
      setItems((prev) => [...prev, ...page.items]);
      setCursor(page.nextCursor);
      setHasMore(page.nextCursor !== null);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [candidateSlug, cursor, hasMore, tab]);

  const handleChangeTab = (next: "all" | "mine") => {
    if (next === tab) return;
    setTab(next);
    setItems(next === "all" ? initialItems : []);
    setCursor(next === "all" && initialItems.length > 0 ? initialItems[initialItems.length - 1].id : null);
    setHasMore(true);
  };

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

  // Ao trocar de aba, `items` esvazia (aba "mine") ou volta pro preview
  // inicial (aba "all") — como o cursor também reseta, o sentinel dispara a
  // primeira página da aba nova sozinho assim que entra na viewport.
  useEffect(() => {
    if (tab === "mine" && items.length === 0 && hasMore) {
      loadMore();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

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
          <h2 className="text-lg font-bold tracking-tight text-white">Galeria</h2>
          <button
            type="button"
            aria-label="Fechar"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition active:scale-90 hover:bg-white/20"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {isLoggedIn && (
          <div className="flex shrink-0 gap-2 px-4 pb-3">
            <button
              type="button"
              onClick={() => handleChangeTab("all")}
              className={`h-8 flex-1 rounded-full text-xs font-semibold transition ${
                tab === "all" ? "bg-brand text-black" : "bg-white/10 text-white/60 hover:bg-white/15"
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => handleChangeTab("mine")}
              className={`h-8 flex-1 rounded-full text-xs font-semibold transition ${
                tab === "mine" ? "bg-brand text-black" : "bg-white/10 text-white/60 hover:bg-white/15"
              }`}
            >
              Minhas
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 pb-6">
          {loading && items.length === 0 ? (
            <div className="flex justify-center py-10">
              <Loader2 size={20} className="animate-spin text-white/40" />
            </div>
          ) : items.length === 0 ? (
            <p className="py-10 text-center text-sm text-white/40">
              {tab === "mine"
                ? "Você ainda não gerou nenhuma moldura desse candidato."
                : "Ninguém compartilhou ainda. Seja o primeiro!"}
            </p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="relative aspect-square overflow-hidden rounded-lg bg-white/5"
                  >
                    <Image
                      src={item.imageUrl}
                      alt=""
                      fill
                      sizes="120px"
                      className="object-cover"
                    />
                    {item.visibility && (
                      <span
                        className={`absolute left-1 top-1 flex items-center justify-center rounded-full p-1 backdrop-blur-sm ${
                          item.visibility === "public" ? "bg-brand/85 text-black" : "bg-black/60 text-white/80"
                        }`}
                      >
                        {item.visibility === "public" ? (
                          <Globe size={9} strokeWidth={2.5} />
                        ) : (
                          <Lock size={9} strokeWidth={2.5} />
                        )}
                      </span>
                    )}
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
