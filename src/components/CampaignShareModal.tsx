"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Check, Copy, Mail, X } from "lucide-react";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";

type Props = {
  url: string;
  title: string;
  coverUrl?: string;
  onClose: () => void;
};

export function CampaignShareModal({ url, title, coverUrl, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const message = `Apoie a campanha "${title}": ${url}`;
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(message)}`;
  const mailHref = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(message)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // clipboard indisponível (ex: contexto sem HTTPS) — sem feedback, mas
      // o link continua selecionável manualmente no input
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
      className="fixed inset-0 z-60 flex items-end justify-center bg-black/70 sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="flex max-h-[88vh] w-full max-w-sm flex-col overflow-y-auto rounded-t-3xl bg-[#1c1c1c] shadow-2xl shadow-black/60 ring-1 ring-white/10 sm:rounded-3xl"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {/* Puxador só no bottom sheet mobile — sinaliza que dá pra arrastar,
            some no desktop onde o modal já é centralizado. */}
        <div className="flex justify-center pb-1 pt-2.5 sm:hidden">
          <div className="h-1 w-9 rounded-full bg-white/20" />
        </div>

        <div className="flex items-center justify-between px-5 pt-3 pb-4 sm:px-6 sm:pt-6">
          <h2 id="share-modal-title" className="text-lg font-bold text-white">
            Compartilhar
          </h2>
          <button
            type="button"
            aria-label="Fechar"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition active:scale-90 hover:bg-white/20"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        <div className="flex flex-col gap-6 px-5 pb-6 sm:px-6 sm:pb-8">
          {coverUrl && (
            <div className="flex justify-center">
              <div className="relative h-40 w-40 shrink-0 overflow-hidden rounded-2xl shadow-lg shadow-black/40 ring-1 ring-white/10 sm:h-44 sm:w-44">
                <Image
                  src={coverUrl}
                  alt=""
                  fill
                  sizes="(min-width: 640px) 176px, 160px"
                  className="object-cover"
                />
              </div>
            </div>
          )}

          <div className="flex justify-center gap-8">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-md shadow-black/20 transition active:scale-90 hover:brightness-110">
                <WhatsAppIcon size={26} />
              </span>
              <span className="text-xs font-medium text-white/70">WhatsApp</span>
            </a>

            <a href={mailHref} className="flex flex-col items-center gap-2">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white shadow-md shadow-black/20 transition active:scale-90 hover:bg-white/15">
                <Mail size={24} strokeWidth={1.75} />
              </span>
              <span className="text-xs font-medium text-white/70">Email</span>
            </a>
          </div>

          <div className="flex items-center gap-3 text-xs text-white/40">
            <div className="h-px flex-1 bg-white/10" />
            ou copiar o link
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div className="flex items-center gap-2 rounded-full bg-white/5 py-1.5 pl-4 pr-1.5 ring-1 ring-white/10">
            <span className="min-w-0 flex-1 truncate text-sm text-white/70">{url}</span>
            <button
              type="button"
              onClick={handleCopy}
              className="flex h-9 w-24 shrink-0 items-center justify-center gap-1.5 rounded-full bg-brand text-sm font-semibold text-black transition active:scale-95 hover:bg-brand-light"
            >
              {copied ? (
                <Check size={15} strokeWidth={2.5} />
              ) : (
                <Copy size={15} strokeWidth={2} />
              )}
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
