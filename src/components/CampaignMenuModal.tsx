"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Camera,
  ChevronRight,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { logoutAction } from "@/app/painel/actions";
import { ConfirmDeleteAccountModal } from "@/components/ConfirmDeleteAccountModal";

type Props = {
  isLoggedIn: boolean;
  viewerName?: string;
  viewerEmail?: string;
  viewerPhotoUrl?: string;
  onClose: () => void;
};

export function CampaignMenuModal({
  isLoggedIn,
  viewerName,
  viewerEmail,
  viewerPhotoUrl,
  onClose,
}: Props) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-[#1c1c1c] md:left-1/2 md:right-auto md:w-120 md:-translate-x-1/2 md:border-x md:border-white/10"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
    >
      <div className="flex shrink-0 items-center justify-between px-4 py-3 sm:py-4">
        <Image
          src="/logo-opop-v3.png"
          alt="Opop"
          width={96}
          height={28}
          className="h-7 w-auto"
        />
        <button
          type="button"
          aria-label="Fechar"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition active:scale-90 hover:bg-white/20"
        >
          <X size={16} strokeWidth={2} />
        </button>
      </div>

      <div
        className="flex-1 overflow-y-auto px-6 pt-1"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 6rem)" }}
      >
        {isLoggedIn ? (
          <>
            <Link
              href="/painel/perfil"
              onClick={onClose}
              className="flex items-center gap-3 rounded-2xl bg-white/5 p-4 transition hover:bg-white/10"
            >
              {viewerPhotoUrl ? (
                <Image
                  src={viewerPhotoUrl}
                  alt=""
                  width={44}
                  height={44}
                  className="h-11 w-11 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand/15 text-base font-bold text-brand-light">
                  {viewerName?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-bold text-white">
                  {viewerName}
                </p>
                <p className="truncate text-sm text-white/50">{viewerEmail}</p>
              </div>
              <Pencil size={16} strokeWidth={1.75} className="shrink-0 text-white/30" />
            </Link>

            <p className="mt-6 mb-2 px-1 text-xs font-semibold tracking-wide text-white/40 uppercase">
              Sua conta
            </p>
            <div className="flex flex-col overflow-hidden rounded-2xl bg-white/5">
              <Link
                href="/painel"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-white transition hover:bg-white/5"
              >
                <LayoutDashboard size={18} strokeWidth={1.75} className="text-white/60" />
                <span className="flex-1">Ir para o painel</span>
                <ChevronRight size={16} className="text-white/30" />
              </Link>
              <div className="h-px bg-white/10" />
              <Link
                href="/esqueci-senha"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-white transition hover:bg-white/5"
              >
                <KeyRound size={18} strokeWidth={1.75} className="text-white/60" />
                <span className="flex-1">Esqueci minha senha</span>
                <ChevronRight size={16} className="text-white/30" />
              </Link>
            </div>

            <form action={logoutAction.bind(null, "/")} className="mt-6">
              <button
                type="submit"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-white/20 text-sm font-semibold text-white transition active:scale-95 hover:bg-white/5"
              >
                <LogOut size={18} strokeWidth={1.75} />
                Deslogar
              </button>
            </form>
          </>
        ) : (
          <Link
            href="/painel"
            onClick={onClose}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-brand text-base font-semibold text-black transition active:scale-95 hover:bg-brand-light"
          >
            <Camera size={20} strokeWidth={1.75} />
            Criar minha moldura
          </Link>
        )}
      </div>

      <div
        className="absolute inset-x-0 bottom-0 border-t border-white/10 bg-[#1c1c1c] px-6 py-4"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        {isLoggedIn ? (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-danger/10 text-sm font-semibold text-danger-light transition active:scale-95 hover:bg-danger/15"
          >
            <Trash2 size={18} strokeWidth={1.75} />
            Excluir minha conta
          </button>
        ) : (
          <Link
            href="/login"
            onClick={onClose}
            className="flex h-12 w-full items-center justify-center rounded-full border border-white/20 text-sm font-semibold text-white transition active:scale-95 hover:bg-white/5"
          >
            Entrar
          </Link>
        )}
      </div>

      {showDeleteConfirm && (
        <ConfirmDeleteAccountModal onCancel={() => setShowDeleteConfirm(false)} />
      )}
    </div>
  );
}
