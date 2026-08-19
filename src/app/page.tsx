"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, Menu } from "lucide-react";
import { TemplateCarousel3D } from "@/components/TemplateCarousel3D";
import { PhotoEditorModal } from "@/components/PhotoEditorModal";
import { DirceuMenuModal } from "@/components/DirceuMenuModal";
import { templates } from "@/lib/templates";

export default function Home() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPhotoUrl(url);
    e.target.value = "";
  };

  const handleCloseEditor = () => {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setPhotoUrl(null);
  };

  return (
    <div className="flex flex-1 min-h-screen overflow-x-hidden bg-[#2A2A2A]">
      <div className="hidden md:block flex-1 bg-[#2A2A2A]" />

      <main
        className="flex w-full flex-col items-center gap-8 overflow-x-hidden py-10 md:w-120 md:flex-none border-x border-white/10 bg-[#2A2A2A]"
        style={{
          paddingTop: "max(2.5rem, env(safe-area-inset-top))",
          paddingBottom: "max(2.5rem, env(safe-area-inset-bottom))",
          paddingLeft: "env(safe-area-inset-left)",
          paddingRight: "env(safe-area-inset-right)",
        }}
      >
        <div className="w-full px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 rounded-full bg-white/10 py-1.5 pl-1.5 pr-4">
              <Image
                src="/perfil-dirceu.png"
                alt="Dirceu ten Caten"
                width={40}
                height={40}
                className="rounded-full"
              />
              <span className="text-lg font-bold text-white">
                Dirceu ten Caten
              </span>
            </div>

            <button
              type="button"
              aria-label="Menu"
              onClick={() => setIsMenuOpen(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition active:scale-90 hover:bg-white/20"
            >
              <Menu size={20} strokeWidth={1.75} />
            </button>
          </div>

          <div className="mt-10 text-center">
            <h1 className="font-heading text-3xl font-normal tracking-wide text-white">
              Um vice pra chamar Dirceu
            </h1>

            <p className="mt-4 text-lg leading-snug text-white/60">
              Mostre que você tem um vice pra chamar Dirceu. Adicione a
              moldura à sua foto e compartilhe esse apoio nas redes.
            </p>
          </div>
        </div>

        <TemplateCarousel3D
          templates={templates}
          activeIndex={activeIndex}
          onSelect={setActiveIndex}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex h-14 w-full max-w-xs items-center justify-center gap-2 rounded-full bg-brand text-base font-semibold text-black transition active:scale-95 hover:bg-brand-light"
        >
          <Camera size={20} strokeWidth={1.75} />
          Escolha sua foto
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        <p className="mt-auto pt-8 text-sm text-white/40">
          Desenvolvido por{" "}
          <a
            href="https://wa.me/5547996848876"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-white/70 underline decoration-white/30 underline-offset-2 transition hover:text-white"
          >
            Joel Germano
          </a>
        </p>
      </main>

      <div className="hidden md:block flex-1 bg-[#2A2A2A]" />

      {photoUrl && (
        <PhotoEditorModal
          templates={templates}
          initialIndex={activeIndex}
          key={photoUrl}
          photoUrl={photoUrl}
          onClose={handleCloseEditor}
          onRequestNewPhoto={() => fileInputRef.current?.click()}
        />
      )}

      {isMenuOpen && <DirceuMenuModal onClose={() => setIsMenuOpen(false)} />}
    </div>
  );
}
