"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Images, LogIn, LogOut, Menu as MenuIcon, User } from "lucide-react";
import { logoutSupporterAction } from "@/app/presidenciaveis/actions";

type SupporterInfo = { name: string | null; email: string } | null;

// Menu pequeno, ancorado no próprio botão (sem modal cobrindo a tela) — só
// identidade de quem já tá logado (nome/email), quantas molduras já gerou
// no total (com atalho pra "Minha Galeria"), e o entrar/sair. Fecha ao
// clicar fora.
export function SupporterHeaderMenu({
  supporter,
  shareCount,
  onRequestLogin,
  onOpenGallery,
}: {
  supporter: SupporterInfo;
  shareCount: number;
  onRequestLogin: () => void;
  onOpenGallery: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleLogout = () => {
    startTransition(async () => {
      await logoutSupporterAction();
      setIsOpen(false);
      router.refresh();
    });
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="Menu"
        onClick={() => setIsOpen((v) => !v)}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition active:scale-90 hover:bg-white/20"
      >
        <MenuIcon size={18} strokeWidth={1.75} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 z-40 w-64 rounded-2xl bg-[#1c1c1c] p-2 shadow-2xl shadow-black/60 ring-1 ring-white/10">
          {supporter ? (
            <>
              <div className="flex items-center gap-2.5 rounded-xl px-3 py-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white">
                  <User size={16} strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white">
                    {supporter.name || supporter.email}
                  </p>
                  {supporter.name && (
                    <p className="truncate text-xs text-white/50">{supporter.email}</p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenGallery();
                }}
                className="mt-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-white/70 transition hover:bg-white/5"
              >
                <Images size={16} strokeWidth={2} className="shrink-0" />
                <span className="flex-1 text-left text-xs">
                  <strong className="font-bold text-white">{shareCount}</strong>{" "}
                  moldura{shareCount === 1 ? "" : "s"} gerada
                  {shareCount === 1 ? "" : "s"} · Minha Galeria
                </span>
                <ChevronRight size={14} strokeWidth={2} className="shrink-0" />
              </button>

              <div className="mt-1 border-t border-white/10 pt-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isPending}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-danger-light transition hover:bg-white/5 disabled:opacity-50"
                >
                  <LogOut size={16} strokeWidth={2} />
                  Sair
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onRequestLogin();
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-white/5"
            >
              <LogIn size={16} strokeWidth={2} />
              Entrar
            </button>
          )}
        </div>
      )}
    </div>
  );
}
