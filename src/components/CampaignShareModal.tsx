"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Check, Copy, Mail, X } from "lucide-react";

type Props = {
  url: string;
  title: string;
  coverUrl?: string;
  onClose: () => void;
};

// Ícone de marca (WhatsApp) que o lucide-react não tem — glifo oficial
// simplificado, cor sólida via currentColor pra herdar do botão pai.
function WhatsAppIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347Z" />
      <path d="M12.001 2C6.478 2 2 6.477 2 12c0 1.842.497 3.618 1.44 5.174L2 22l4.938-1.396A9.943 9.943 0 0 0 12.001 22C17.523 22 22 17.523 22 12S17.523 2 12.001 2Zm0 18.14a8.11 8.11 0 0 1-4.13-1.13l-.296-.176-3.096.876.827-3.06-.192-.309A8.116 8.116 0 0 1 3.86 12c0-4.489 3.652-8.14 8.141-8.14 4.488 0 8.14 3.651 8.14 8.14 0 4.489-3.652 8.14-8.14 8.14Z" />
    </svg>
  );
}

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
