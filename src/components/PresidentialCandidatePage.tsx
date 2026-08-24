"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  Expand,
  Gift,
  Images,
  Share2,
  Users,
} from "lucide-react";
import { TemplateCarousel3D } from "@/components/TemplateCarousel3D";
import { PresidentialPhotoEditor } from "@/components/PresidentialPhotoEditor";
import { SupporterUnlockModal } from "@/components/SupporterUnlockModal";
import { GalleryPreviewCarousel } from "@/components/GalleryPreviewCarousel";
import { GalleryFeedModal } from "@/components/GalleryFeedModal";
import { SupporterHeaderMenu } from "@/components/SupporterHeaderMenu";
import { CampaignShareModal } from "@/components/CampaignShareModal";
import { GiftInviteCard } from "@/components/GiftInviteCard";
import { MyGalleryModal } from "@/components/MyGalleryModal";
import { getMyInviteSummaryAction } from "@/app/presidenciaveis/invite-actions";
import { SITE_URL } from "@/lib/site";
import type { GalleryFeedItem } from "@/app/presidenciaveis/actions";
import type { InviteSummary } from "@/lib/frame-invites";
import type { Template } from "@/lib/templates";

type Candidate = {
  name: string;
  photoUrl: string;
  slug: string;
};

type SupporterInfo = { name: string | null; email: string } | null;

export function PresidentialCandidatePage({
  candidate,
  templates,
  initialFrameCredits,
  gnClientId,
  googleClientId,
  galleryPreview,
  supporterCount,
  priceCents,
  supporter,
  supporterShareCount,
  invite,
  inviteSummary,
}: {
  candidate: Candidate;
  templates: Template[];
  initialFrameCredits: number;
  gnClientId: string;
  googleClientId: string;
  galleryPreview: GalleryFeedItem[];
  supporterCount: number;
  priceCents: number;
  supporter: SupporterInfo;
  supporterShareCount: number;
  invite: { token: string; inviterName: string } | null;
  inviteSummary: InviteSummary | null;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [summary, setSummary] = useState(inviteSummary);
  const [activeInvite, setActiveInvite] = useState(invite);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isMyGalleryOpen, setIsMyGalleryOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Enquanto não existe supporter nenhum (visitante anônimo), `summary` é
  // null — usa o valor vindo do servidor. `summary.available` já é
  // `frameCredits - convites/gerações não revogados` (ver getInviteSummary):
  // cada moldura comprada = 1 geração; sem saldo, o botão abaixo manda pro
  // checkout em vez de abrir o seletor de foto.
  const frameCredits = summary?.available ?? initialFrameCredits;

  const shareUrl = `${SITE_URL}/presidenciaveis/${candidate.slug}`;
  const shareUrlDisplay = shareUrl.replace(/^https?:\/\//, "");

  const refreshSummary = async () => {
    const result = await getMyInviteSummaryAction();
    if (result.ok) setSummary(result.summary);
  };

  const handleChooseClick = () => {
    // Convite não resgatado ainda tem prioridade: precisa identificar +
    // resgatar antes de qualquer coisa, mesmo que a pessoa já tenha saldo
    // de outra compra.
    if (activeInvite) {
      setIsUnlockModalOpen(true);
      return;
    }
    if (frameCredits > 0) {
      fileInputRef.current?.click();
      return;
    }
    setIsUnlockModalOpen(true);
  };

  const handleUnlocked = () => {
    setActiveInvite(null);
    setIsUnlockModalOpen(false);
    refreshSummary();
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
          <div className="flex items-center gap-3">
            <Link
              href="/presidenciaveis"
              aria-label="Voltar"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition active:scale-90 hover:bg-white/20"
            >
              <ArrowLeft size={18} strokeWidth={2} />
            </Link>

            <div className="flex items-center gap-2 rounded-full bg-white/10 py-1.5 pl-1.5 pr-4">
              <Image
                src={candidate.photoUrl}
                alt={candidate.name}
                width={40}
                height={40}
                className="h-10 w-10 rounded-full object-cover"
              />
              <span className="text-sm font-bold text-white">
                {candidate.name}
              </span>
            </div>

            <div className="ml-auto">
              <SupporterHeaderMenu
                supporter={supporter}
                shareCount={supporterShareCount}
                onRequestLogin={() => setIsUnlockModalOpen(true)}
                onOpenGallery={() => setIsMyGalleryOpen(true)}
              />
            </div>
          </div>

          <div className="mt-10 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Junte-se a {candidate.name}
            </h1>
            <p className="mt-3 text-base leading-snug text-white/60">
              Coloque a moldura no seu perfil e ajude {candidate.name} a chegar
              ao topo do placar.
            </p>

            <div className="mt-4 flex w-fit items-center justify-center gap-1.5 rounded-full border border-white/15 px-3 py-2 text-xs font-medium text-white mx-auto">
              <Users size={14} strokeWidth={2} />
              <span>
                {supporterCount} apoiador{supporterCount === 1 ? "" : "es"}
              </span>
            </div>
          </div>
        </div>

        {activeInvite && (
          <div className="w-full px-6">
            <div className="flex items-center gap-3 rounded-2xl bg-secondary/10 p-4 ring-1 ring-secondary/30">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary/20 text-secondary-light">
                <Gift size={18} strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white">
                  {activeInvite.inviterName} te deu uma moldura
                </p>
                <p className="text-xs leading-snug text-white/60">
                  Escolha sua foto e gere sua arte sem pagar nada.
                </p>
              </div>
            </div>
          </div>
        )}

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

            <div className="flex w-full flex-col items-center gap-2 px-6">
              <button
                type="button"
                onClick={handleChooseClick}
                className="flex h-14 w-full max-w-xs items-center justify-center gap-2 rounded-full bg-brand text-base font-semibold text-black transition active:scale-95 hover:bg-brand-light"
              >
                <Camera size={20} strokeWidth={1.75} />
                Escolha sua foto
              </button>
              {summary && (
                <p className="text-xs text-white/40">
                  {frameCredits > 0
                    ? `${frameCredits} moldura${frameCredits === 1 ? "" : "s"} disponível${frameCredits === 1 ? "" : "is"}`
                    : "Sem moldura disponível, compre mais pra continuar"}
                </p>
              )}
            </div>

            {summary && (
              <div className="w-full px-6">
                <GiftInviteCard
                  candidateSlug={candidate.slug}
                  candidateName={candidate.name}
                  summary={summary}
                  gnClientId={gnClientId}
                  googleClientId={googleClientId}
                  priceCents={priceCents}
                />
              </div>
            )}

            <div className="w-full px-6">
              <button
                type="button"
                onClick={() => setIsShareOpen(true)}
                className="mx-auto flex h-11 w-full max-w-xs items-center gap-2 rounded-full bg-white/5 py-1.5 pl-4 pr-1.5 ring-1 ring-white/10 transition hover:bg-white/10"
              >
                <span className="flex-1 truncate text-left text-sm text-white/60">
                  {shareUrlDisplay}
                </span>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-black">
                  <Share2 size={15} strokeWidth={2} />
                </span>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {galleryPreview.length > 0 && (
              <div className="w-full px-6">
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-1.5 text-sm font-bold text-white">
                    <Images size={15} strokeWidth={2} />
                    Galeria
                  </h2>
                  <button
                    type="button"
                    aria-label="Ver galeria completa"
                    onClick={() => setIsGalleryOpen(true)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition active:scale-90 hover:bg-white/20"
                  >
                    <Expand size={14} strokeWidth={2} />
                  </button>
                </div>

                <div className="mt-3 border-t border-white/10" />

                <div className="mt-3">
                  <GalleryPreviewCarousel
                    items={galleryPreview}
                    onOpenFull={() => setIsGalleryOpen(true)}
                  />
                </div>
              </div>
            )}
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
          candidateName={candidate.name}
          frameCredits={frameCredits}
          onClose={handleCloseEditor}
          onGenerated={refreshSummary}
          onRequestMoreCredits={() => {
            handleCloseEditor();
            setIsUnlockModalOpen(true);
          }}
          onRequestNewPhoto={() => fileInputRef.current?.click()}
        />
      )}

      {isUnlockModalOpen && (
        <SupporterUnlockModal
          gnClientId={gnClientId}
          googleClientId={googleClientId}
          priceCents={priceCents}
          alreadyIdentified={Boolean(supporter)}
          invite={activeInvite}
          onUnlocked={handleUnlocked}
          onClose={() => setIsUnlockModalOpen(false)}
        />
      )}

      {isGalleryOpen && (
        <GalleryFeedModal
          candidateSlug={candidate.slug}
          initialItems={galleryPreview}
          isLoggedIn={!!supporter}
          onClose={() => setIsGalleryOpen(false)}
        />
      )}

      {isShareOpen && (
        <CampaignShareModal
          url={shareUrl}
          title={candidate.name}
          onClose={() => setIsShareOpen(false)}
        />
      )}

      {isMyGalleryOpen && (
        <MyGalleryModal onClose={() => setIsMyGalleryOpen(false)} />
      )}
    </div>
  );
}
