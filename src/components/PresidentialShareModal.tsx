"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  Check,
  Copy,
  Download,
  Images,
  RotateCcw,
  Share2,
  Sparkles,
  X,
} from "lucide-react";
import { downloadImage, shareImage } from "@/lib/composite";
import { SITE_URL } from "@/lib/site";
import {
  postToGalleryAction,
  getGalleryPreviewAction,
  hasPostedToGalleryAction,
} from "@/app/presidenciaveis/actions";

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Cópia paralela de ShareSuccessModal.tsx — a única diferença real é a
// legenda (candidato presidenciável, não a campanha do Dirceu). Duplicado de
// propósito, ver conversa sobre manter esse fluxo isolado do existente.

type Props = {
  imageUrl: string;
  blob: Blob;
  fileName: string;
  candidateSlug: string;
  onClose: () => void;
  onStartOver: () => void;
};

export function PresidentialShareModal({
  imageUrl,
  blob,
  fileName,
  candidateSlug,
  onClose,
  onStartOver,
}: Props) {
  const SHARE_TEXT = `Junte-se ao seu candidato! 💙

Escolhi o meu, monte o seu card e vamos espalhar essa mensagem!

${SITE_URL}/presidenciaveis/${candidateSlug}`;
  const [copied, setCopied] = useState(false);
  const [shareHint, setShareHint] = useState<string | null>(null);
  const [galleryStatus, setGalleryStatus] = useState<"idle" | "posting" | "posted" | "error">(
    "idle"
  );
  const [galleryError, setGalleryError] = useState("");
  const [previewPhotos, setPreviewPhotos] = useState<{ imageUrl: string }[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    getGalleryPreviewAction(candidateSlug).then(setPreviewPhotos);
    hasPostedToGalleryAction(candidateSlug).then((posted) => {
      if (posted) setGalleryStatus("posted");
    });
  }, [candidateSlug]);

  const handlePostToGallery = async () => {
    setGalleryStatus("posting");
    setGalleryError("");
    try {
      const dataUrl = await blobToDataUrl(blob);
      const fd = new FormData();
      fd.set("imageDataUrl", dataUrl);
      const result = await postToGalleryAction(candidateSlug, fd);
      if (result && "error" in result) {
        setGalleryStatus("error");
        setGalleryError(result.error);
        return;
      }
      setGalleryStatus("posted");
      getGalleryPreviewAction(candidateSlug).then(setPreviewPhotos);
    } catch {
      setGalleryStatus("error");
      setGalleryError("Não foi possível postar na galeria. Tente novamente.");
    }
  };

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

        <div className="animate-rise mt-8" style={{ animationDelay: "180ms" }}>
          <button
            type="button"
            onClick={handlePostToGallery}
            disabled={galleryStatus === "posting" || galleryStatus === "posted"}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white/10 text-sm font-semibold text-white transition active:scale-[0.98] hover:bg-white/20 disabled:opacity-60"
          >
            {galleryStatus === "posted" ? (
              <>
                <Check size={16} strokeWidth={2.5} className="text-brand" />
                Postado na galeria!
              </>
            ) : (
              <>
                <Images size={16} strokeWidth={1.75} />
                {galleryStatus === "posting" ? "Postando..." : "Postar na galeria"}
              </>
            )}
          </button>
          {galleryStatus === "error" && (
            <p className="mt-2 text-center text-xs text-red-400" role="alert">
              {galleryError}
            </p>
          )}

          {previewPhotos.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-center text-xs text-white/50">
                Quem já compartilhou
              </p>
              <div className="flex items-center justify-center gap-2">
                {previewPhotos.map((photo, i) => (
                  <div
                    key={photo.imageUrl + i}
                    className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full ring-2 ring-[#1c1c1c]"
                  >
                    <Image src={photo.imageUrl} alt="" fill sizes="44px" className="object-cover" />
                  </div>
                ))}
              </div>
              <Link
                href={`/presidenciaveis/${candidateSlug}`}
                className="mt-3 block text-center text-xs font-medium text-brand-light underline decoration-brand/40 underline-offset-2"
              >
                Ver galeria completa
              </Link>
            </div>
          )}
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
