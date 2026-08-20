"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Camera, ChevronLeft, ChevronRight } from "lucide-react";
import { TemplateCarousel3D } from "@/components/TemplateCarousel3D";
import { PresidentialPhotoEditor } from "@/components/PresidentialPhotoEditor";
import { SupporterUnlockModal } from "@/components/SupporterUnlockModal";
import type { Template } from "@/lib/templates";

type Candidate = {
  name: string;
  photoUrl: string;
  slug: string;
};

type GalleryPostItem = { id: string; imageUrl: string };

export function PresidentialCandidatePage({
  candidate,
  templates,
  initialUnlocked,
  gnClientId,
  googleClientId,
  galleryPosts,
  supporterCount,
  galleryPage,
  galleryTotalPages,
}: {
  candidate: Candidate;
  templates: Template[];
  initialUnlocked: boolean;
  gnClientId: string;
  googleClientId: string;
  galleryPosts: GalleryPostItem[];
  supporterCount: number;
  galleryPage: number;
  galleryTotalPages: number;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(initialUnlocked);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChooseClick = () => {
    if (unlocked) {
      fileInputRef.current?.click();
      return;
    }
    setIsUnlockModalOpen(true);
  };

  const handleUnlocked = () => {
    setUnlocked(true);
    setIsUnlockModalOpen(false);
    fileInputRef.current?.click();
  };

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
          <div className="flex items-center gap-2 rounded-full bg-white/10 py-1.5 pl-1.5 pr-4">
            <Image
              src={candidate.photoUrl}
              alt={candidate.name}
              width={40}
              height={40}
              className="rounded-full object-cover"
            />
            <span className="text-lg font-bold text-white">{candidate.name}</span>
          </div>

          <div className="mt-10 text-center">
            <h1 className="font-heading text-3xl font-normal tracking-wide text-white">
              Junte-se a {candidate.name}
            </h1>
            <p className="mt-4 text-lg leading-snug text-white/60">
              Monte seu card de apoio e compartilhe com quem você conhece.
            </p>
          </div>
        </div>

        <div className="w-full px-6">
          <h2 className="mb-4 text-sm font-bold text-white">
            {supporterCount} apoiador{supporterCount === 1 ? "" : "es"}
          </h2>

          {galleryPosts.length > 0 ? (
            <>
              <div className="grid grid-cols-4 gap-2">
                {galleryPosts.map((post) => (
                  <div
                    key={post.id}
                    className="relative aspect-square overflow-hidden rounded-lg bg-white/5"
                  >
                    <Image
                      src={post.imageUrl}
                      alt=""
                      fill
                      sizes="120px"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>

              {galleryTotalPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-4">
                  <Link
                    href={`/presidenciaveis/${candidate.slug}?page=${galleryPage - 1}`}
                    aria-label="Página anterior"
                    className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition active:scale-90 ${
                      galleryPage <= 1
                        ? "pointer-events-none opacity-30"
                        : "hover:bg-white/20"
                    }`}
                  >
                    <ChevronLeft size={16} strokeWidth={2} />
                  </Link>
                  <span className="text-xs text-white/50">
                    {galleryPage} / {galleryTotalPages}
                  </span>
                  <Link
                    href={`/presidenciaveis/${candidate.slug}?page=${galleryPage + 1}`}
                    aria-label="Próxima página"
                    className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition active:scale-90 ${
                      galleryPage >= galleryTotalPages
                        ? "pointer-events-none opacity-30"
                        : "hover:bg-white/20"
                    }`}
                  >
                    <ChevronRight size={16} strokeWidth={2} />
                  </Link>
                </div>
              )}
            </>
          ) : (
            <p className="text-center text-sm text-white/40">
              Ninguém compartilhou ainda. Seja o primeiro!
            </p>
          )}
        </div>

        {templates.length === 0 ? (
          <p className="px-6 text-center text-base text-white/50">
            Esse candidato ainda não tem molduras configuradas.
          </p>
        ) : (
          <>
            <TemplateCarousel3D
              templates={templates}
              activeIndex={activeIndex}
              onSelect={setActiveIndex}
            />

            <button
              type="button"
              onClick={handleChooseClick}
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
          </>
        )}
      </main>

      <div className="hidden md:block flex-1 bg-[#2A2A2A]" />

      {photoUrl && templates.length > 0 && (
        <PresidentialPhotoEditor
          templates={templates}
          initialIndex={activeIndex}
          key={photoUrl}
          photoUrl={photoUrl}
          candidateSlug={candidate.slug}
          onClose={handleCloseEditor}
          onRequestNewPhoto={() => fileInputRef.current?.click()}
        />
      )}

      {isUnlockModalOpen && (
        <SupporterUnlockModal
          gnClientId={gnClientId}
          googleClientId={googleClientId}
          onUnlocked={handleUnlocked}
          onClose={() => setIsUnlockModalOpen(false)}
        />
      )}
    </div>
  );
}
