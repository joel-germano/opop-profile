"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Camera, Pencil, Menu, Share2, Users } from "lucide-react";
import { TemplateCarousel3D } from "@/components/TemplateCarousel3D";
import { PhotoEditorModal } from "@/components/PhotoEditorModal";
import { CampaignMenuModal } from "@/components/CampaignMenuModal";
import { CampaignShareModal } from "@/components/CampaignShareModal";
import { SITE_URL } from "@/lib/site";
import { formatCompactNumber } from "@/lib/format";
import type { Template } from "@/lib/templates";

type CampaignUser = {
  name: string;
  username: string;
  photoUrl: string;
  title: string;
  description: string;
  caption: string;
  coverUrl?: string;
  visitCount: number;
};

export function CampaignPageClient({
  templates,
  user,
  isViewerLoggedIn,
  viewerName,
  viewerEmail,
  viewerPhotoUrl,
}: {
  templates: Template[];
  user: CampaignUser;
  isViewerLoggedIn: boolean;
  viewerName?: string;
  viewerEmail?: string;
  viewerPhotoUrl?: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileUrl = `${SITE_URL}/${user.username}`;
  const profileUrlDisplay = profileUrl.replace(/^https?:\/\//, "");

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
        className="flex w-full flex-col items-center gap-6 overflow-x-hidden px-5 py-8 sm:gap-8 sm:px-6 sm:py-10 md:w-120 md:flex-none border-x border-white/10 bg-[#2A2A2A]"
        style={{
          paddingTop: "max(2rem, env(safe-area-inset-top))",
          paddingBottom: "max(2rem, env(safe-area-inset-bottom))",
        }}
      >
        <div className="w-full">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 rounded-full bg-white/10 py-1.5 pl-1.5 pr-4">
              <Image
                src={user.photoUrl}
                alt={user.name}
                width={40}
                height={40}
                className="h-10 w-10 rounded-full object-cover"
              />
              <span className="text-sm font-bold text-white">{user.name}</span>
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
            <h1 className="text-2xl font-bold tracking-tight text-white">
              {user.title}
            </h1>

            {user.description && (
              <p className="mt-3 text-base leading-snug text-white/60">
                {user.description}
              </p>
            )}

            <div className="mt-4 flex items-center justify-center gap-1.5 rounded-full border border-white/15 px-3 py-2 text-xs font-medium text-white w-fit mx-auto">
              <Users size={14} strokeWidth={2} />
              <span>
                <strong className="font-bold">
                  {formatCompactNumber(user.visitCount)}
                </strong>{" "}
                apoiadores com essa moldura
              </span>
            </div>

            {isViewerLoggedIn && (
              <Link
                href="/painel"
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-danger/40 bg-danger/10 px-3.5 py-2 text-sm font-semibold text-danger-light transition hover:bg-danger/15"
              >
                <Pencil size={16} strokeWidth={2} />
                Editar informações
              </Link>
            )}
          </div>
        </div>

        {templates.length === 0 ? (
          <p className="text-center text-base text-white/50">
            Ainda não há molduras configuradas por aqui.
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
              onClick={() => fileInputRef.current?.click()}
              className="flex h-14 w-full max-w-xs items-center justify-center gap-2 rounded-full bg-brand text-base font-semibold text-black transition active:scale-95 hover:bg-brand-light"
            >
              <Camera size={20} strokeWidth={1.75} />
              Escolha sua foto
            </button>

            <button
              type="button"
              onClick={() => setIsShareOpen(true)}
              className="flex h-11 w-full max-w-xs items-center gap-2 rounded-full bg-white/5 py-1.5 pl-4 pr-1.5 ring-1 ring-white/10 transition hover:bg-white/10"
            >
              <span className="flex-1 truncate text-left text-sm text-white/60">
                {profileUrlDisplay}
              </span>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-black">
                <Share2 size={15} strokeWidth={2} />
              </span>
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

      {photoUrl && templates.length > 0 && (
        <PhotoEditorModal
          templates={templates}
          initialIndex={activeIndex}
          key={photoUrl}
          photoUrl={photoUrl}
          shareCaption={user.caption}
          campaignUsername={user.username}
          onClose={handleCloseEditor}
          onRequestNewPhoto={() => fileInputRef.current?.click()}
        />
      )}

      {isMenuOpen && (
        <CampaignMenuModal
          isLoggedIn={isViewerLoggedIn}
          viewerName={viewerName}
          viewerEmail={viewerEmail}
          viewerPhotoUrl={viewerPhotoUrl}
          onClose={() => setIsMenuOpen(false)}
        />
      )}

      {isShareOpen && (
        <CampaignShareModal
          url={profileUrl}
          title={user.title}
          coverUrl={user.coverUrl}
          onClose={() => setIsShareOpen(false)}
        />
      )}
    </div>
  );
}
