"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Loader2,
  MessageSquare,
  Trash2,
} from "lucide-react";
import { TextareaField } from "@/components/TextareaField";
import { PREVIEW_AVATARS } from "@/lib/preview-avatars";
import { ProfilePreviewLink } from "@/components/ProfilePreviewLink";
import { PainelStepTabs } from "@/components/PainelStepTabs";
import { resizeImageToSquareDataUrl } from "@/lib/resize-avatar";
import {
  savePreviewPhotoAction,
  deletePreviewPhotoAction,
} from "@/app/painel/actions";

type Props = {
  moldura?: string;
  caption: string;
  onCaptionChange: (value: string) => void;
  username: string;
  isLoggedIn: boolean;
  onSelectStep: (step: 1 | 2 | 3) => void;
  initialPreviewPhotoUrl: string;
  previewAvatar: string;
  onSelectPreviewAvatar: (avatar: string) => void;
};

export function PainelStepLegenda({
  moldura,
  caption,
  onCaptionChange,
  username,
  isLoggedIn,
  onSelectStep,
  initialPreviewPhotoUrl,
  previewAvatar,
  onSelectPreviewAvatar,
}: Props) {
  // A seleção em si mora no PainelSteps (é ela que vira a capa ao publicar);
  // aqui fica só qual foto personalizada existe, que é assunto desta tela.
  const [customPhoto, setCustomPhoto] = useState(initialPreviewPhotoUrl);
  const [uploadError, setUploadError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [, startTransition] = useTransition();
  const thumbsRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollThumbs = (direction: 1 | -1) => {
    thumbsRef.current?.scrollBy({ left: direction * 140, behavior: "smooth" });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploadError("");
    setIsUploading(true);

    let dataUrl: string;
    try {
      // 512px: bem acima dos 128px que a prévia mostra, sem virar upload
      // pesado — o corte quadrado já vem pronto do resize.
      dataUrl = await resizeImageToSquareDataUrl(file, 512);
    } catch {
      setIsUploading(false);
      setUploadError("Não foi possível processar a imagem.");
      return;
    }

    startTransition(async () => {
      const result = await savePreviewPhotoAction(dataUrl);
      setIsUploading(false);

      if (result && "error" in result) {
        setUploadError(result.error);
        return;
      }
      if (result?.success) {
        setCustomPhoto(result.photoUrl);
        onSelectPreviewAvatar(result.photoUrl);
      }
    });
  };

  const handleDeletePhoto = () => {
    setUploadError("");
    setIsDeleting(true);

    startTransition(async () => {
      await deletePreviewPhotoAction();
      setIsDeleting(false);
      // Se a foto apagada era a que estava na prévia, cai de volta na
      // primeira persona — senão a prévia ficaria com src quebrado.
      if (previewAvatar === customPhoto) {
        onSelectPreviewAvatar(PREVIEW_AVATARS[0]);
      }
      setCustomPhoto("");
    });
  };

  return (
    <div className="flex flex-col gap-6 pb-16">
      <div>
        <ProfilePreviewLink username={username} />
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary-light">
            <MessageSquare size={16} strokeWidth={2} />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-white">
            Modelo de legenda
          </h1>
        </div>
        <PainelStepTabs
          isLoggedIn={isLoggedIn}
          activeStep={3}
          onSelectStep={onSelectStep}
        />
      </div>

      <div className="flex flex-col items-center gap-4 rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
        <div className="relative h-32 w-32 overflow-hidden rounded-2xl bg-white/10">
          <Image
            src={previewAvatar}
            alt=""
            fill
            sizes="128px"
            className="scale-[0.8] object-cover"
          />
          {moldura && (
            <Image
              src={moldura}
              alt=""
              fill
              sizes="128px"
              className="object-cover"
            />
          )}
        </div>

        <div className="flex w-full items-center gap-3">
          {/* Fixo à esquerda, fora da faixa rolável: é a foto do próprio
              usuário, não mais uma persona de exemplo. Com foto já enviada, o
              quadrinho seleciona e o badge de câmera troca — dois botões
              irmãos, já que <button> dentro de <button> é HTML inválido. */}
          <div className="relative h-14 w-14 shrink-0">
            <button
              type="button"
              onClick={() =>
                customPhoto ? onSelectPreviewAvatar(customPhoto) : fileInputRef.current?.click()
              }
              disabled={isUploading || isDeleting}
              aria-label={
                customPhoto ? "Usar minha foto na prévia" : "Subir uma foto personalizada"
              }
              aria-pressed={Boolean(customPhoto) && previewAvatar === customPhoto}
              className={`relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl ring-2 ring-offset-2 ring-offset-[#2a2a2a] transition active:scale-95 disabled:opacity-60 ${
                customPhoto && previewAvatar === customPhoto
                  ? "ring-danger"
                  : "ring-transparent hover:ring-white/30"
              } ${customPhoto ? "" : "border-2 border-dashed border-white/25 bg-primary/10 text-primary-light"}`}
            >
              {isUploading || isDeleting ? (
                <Loader2 size={20} className="animate-spin text-white" />
              ) : customPhoto ? (
                <Image src={customPhoto} alt="" fill sizes="56px" className="object-cover" />
              ) : (
                <ImagePlus size={20} strokeWidth={2} />
              )}
            </button>

            {customPhoto && !isUploading && !isDeleting && (
              <>
                <button
                  type="button"
                  onClick={handleDeletePhoto}
                  aria-label="Remover minha foto"
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white ring-2 ring-[#2a2a2a] transition active:scale-90 hover:bg-black"
                >
                  <Trash2 size={11} strokeWidth={2.5} />
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Trocar minha foto"
                  className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-white ring-2 ring-[#2a2a2a] transition active:scale-90 hover:bg-danger-dark"
                >
                  <Camera size={11} strokeWidth={2.5} />
                </button>
              </>
            )}
          </div>

          <div className="h-10 w-px shrink-0 bg-white/10" />

          {/* Chevrons flutuam por cima das pontas da faixa em vez de ocupar
              coluna própria. No mobile nem aparecem: o swipe já resolve, e o
              espaço horizontal ali é escasso. */}
          <div className="relative min-w-0 flex-1">
            <div
              ref={thumbsRef}
              className="flex gap-3 overflow-x-auto px-1 py-1 scroll-smooth [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {PREVIEW_AVATARS.map((avatar) => (
                <button
                  key={avatar}
                  type="button"
                  onClick={() => onSelectPreviewAvatar(avatar)}
                  aria-label="Usar esta foto na prévia"
                  aria-pressed={avatar === previewAvatar}
                  className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-xl ring-2 ring-offset-2 ring-offset-[#2a2a2a] transition ${
                    avatar === previewAvatar
                      ? "ring-danger"
                      : "ring-transparent hover:ring-white/30"
                  }`}
                >
                  <Image src={avatar} alt="" fill sizes="56px" className="object-cover" />
                </button>
              ))}
            </div>

            <button
              type="button"
              aria-label="Foto anterior"
              onClick={() => scrollThumbs(-1)}
              className="absolute -left-2 top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition active:scale-90 hover:bg-black/80 sm:flex"
            >
              <ChevronLeft size={16} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              aria-label="Próxima foto"
              onClick={() => scrollThumbs(1)}
              className="absolute -right-2 top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition active:scale-90 hover:bg-black/80 sm:flex"
            >
              <ChevronRight size={16} strokeWidth={2.5} />
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
          />
        </div>

        {uploadError && (
          <p className="w-full text-center text-sm text-red-400" role="alert">
            {uploadError}
          </p>
        )}

        <div className="w-full rounded-2xl bg-black/30 p-4 text-center">
          <p className="whitespace-pre-line text-sm leading-snug text-white/80">
            {caption || "Escreva sua legenda abaixo."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full">
            <Image
              src={previewAvatar}
              alt=""
              fill
              sizes="32px"
              className="object-cover"
            />
          </div>
          <span className="text-sm font-semibold text-white">
            Nome do Apoiador
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-bold text-white">Defina um modelo</h2>
        <p className="text-xs text-white/60">
          Se outras pessoas apoiarem sua campanha sem adicionar uma legenda,
          esta será usada.
        </p>
        <TextareaField
          name="legenda"
          value={caption}
          onChange={(e) => onCaptionChange(e.target.value)}
        />
      </div>
    </div>
  );
}
