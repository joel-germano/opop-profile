"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  Check,
  Copy,
  Download,
  RotateCcw,
  Share2,
  Sparkles,
  X,
} from "lucide-react";
import { downloadImage, shareImage } from "@/lib/composite";
import { SITE_URL } from "@/lib/site";

const SHARE_TEXT = `Estou apoiando essa campanha! 💙

Um vice pra chamar Dirceu. Junte-se a mim, mostre seu apoio também, monte o seu card e vamos espalhar essa mensagem!

${SITE_URL}/`;

type Props = {
  imageUrl: string;
  blob: Blob;
  fileName: string;
  onClose: () => void;
  onStartOver: () => void;
};

export function ShareSuccessModal({
  imageUrl,
  blob,
  fileName,
  onClose,
  onStartOver,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [shareHint, setShareHint] = useState<string | null>(null);

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

  useEffect(() => {
    if (!shareHint) return;
    const timer = setTimeout(() => setShareHint(null), 3000);
    return () => clearTimeout(timer);
  }, [shareHint]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(SHARE_TEXT);
      setCopied(true);
    } catch {
      setShareHint("Não foi possível copiar o texto.");
    }
  };

  const handleShare = async () => {
    // Apps like WhatsApp and Instagram keep the image but drop the caption that
    // rides along with it. Copying it up front means the user can just paste.
    // Started without awaiting so the share call below still runs inside the
    // same user activation window (required by Safari/iOS).
    const copyPromise = (
      navigator.clipboard?.writeText(SHARE_TEXT) ??
      Promise.reject(new Error("clipboard unavailable"))
    )
      .then(() => {
        setCopied(true);
        return true;
      })
      .catch(() => false);

    const result = await shareImage(blob, fileName, SHARE_TEXT);
    const didCopy = await copyPromise;

    if (result === "cancelled") return;

    if (result === "shared-with-image") {
      if (didCopy) {
        setShareHint("Legenda copiada — se ela não aparecer, é só colar. 💙");
      }
      return;
    }

    setShareHint(
      didCopy
        ? "Legenda copiada! A imagem já foi baixada — é só anexar."
        : "A imagem já foi baixada. Copie a legenda acima para enviar junto."
    );
  };

  return (
    <div
      className="fixed inset-0 z-60 flex flex-col overflow-hidden bg-[#1c1c1c] md:left-1/2 md:right-auto md:w-120 md:-translate-x-1/2 md:border-x md:border-white/10"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
    >
      <div className="flex shrink-0 items-center justify-between px-4 py-3 sm:py-4">
        <div className="w-10" />
        <h2 className="font-heading text-lg font-normal tracking-wide text-white">
          Seu card está pronto
        </h2>
        <button
          type="button"
          aria-label="Fechar"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition active:scale-90 hover:bg-white/20"
        >
          <X size={16} strokeWidth={2} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-4">
        <div className="relative flex justify-center pb-14 pt-8">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <div className="h-56 w-56 rounded-full bg-brand/25 blur-3xl" />
          </div>

          <Sparkles
            aria-hidden
            size={26}
            strokeWidth={1.75}
            className="animate-sparkle absolute left-4 top-2 text-brand"
            style={{ animationDelay: "300ms" }}
          />
          <Sparkles
            aria-hidden
            size={18}
            strokeWidth={1.75}
            className="animate-sparkle absolute right-6 top-10 text-white/70"
            style={{ animationDelay: "450ms" }}
          />
          <Sparkles
            aria-hidden
            size={16}
            strokeWidth={1.75}
            className="animate-sparkle absolute bottom-6 left-10 text-white/50"
            style={{ animationDelay: "600ms" }}
          />

          <div className="animate-card-pop relative aspect-square w-56 overflow-hidden rounded-xl shadow-2xl shadow-black/60 ring-1 ring-white/15">
            <Image
              src={imageUrl}
              alt="Seu card pronto"
              fill
              sizes="224px"
              unoptimized
              className="object-cover"
            />
          </div>
        </div>

        <p className="animate-rise text-center text-base leading-snug text-white/60">
          A imagem já foi baixada. Agora é só compartilhar e mostrar seu apoio!
        </p>

        <div
          className="animate-rise mt-9"
          style={{ animationDelay: "120ms" }}
        >
          <p className="mb-3 text-sm font-medium text-white/80">
            Sugestão de legenda
          </p>

          <div className="relative rounded-2xl bg-white/5 p-4 pr-14">
            <p className="whitespace-pre-line text-sm leading-relaxed text-white/80">
              {SHARE_TEXT}
            </p>

            <button
              type="button"
              aria-label="Copiar legenda"
              onClick={handleCopy}
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition active:scale-90 hover:bg-white/20"
            >
              {copied ? (
                <Check size={16} strokeWidth={2.5} className="text-brand" />
              ) : (
                <Copy size={16} strokeWidth={2} />
              )}
            </button>
          </div>

          <p
            aria-live="polite"
            className="mt-2 min-h-5 text-center text-xs leading-snug text-brand"
          >
            {copied && !shareHint ? "Legenda copiada!" : shareHint}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-3 px-6 pb-6 pt-2 sm:pb-8">
        <button
          type="button"
          onClick={handleShare}
          className="flex h-13 items-center justify-center gap-2 rounded-full bg-brand text-base font-semibold text-black transition active:scale-[0.98] hover:bg-brand-light"
        >
          <Share2 size={19} strokeWidth={2} />
          Compartilhar
        </button>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => downloadImage(blob, fileName)}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-white/10 text-base font-semibold text-white transition active:scale-[0.98] hover:bg-white/20"
          >
            <Download size={18} strokeWidth={2} />
            Baixar
          </button>
          <button
            type="button"
            onClick={onStartOver}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-white/10 text-base font-semibold text-white transition active:scale-[0.98] hover:bg-white/20"
          >
            <RotateCcw size={18} strokeWidth={2} />
            Começar
          </button>
        </div>
      </div>
    </div>
  );
}
