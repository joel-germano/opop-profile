"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Image as ImageIcon } from "lucide-react";
import { TemplatesManager } from "@/components/TemplatesManager";
import { PainelStepDetalhes } from "@/components/PainelStepDetalhes";
import { PainelStepLegenda } from "@/components/PainelStepLegenda";
import { StepProgress } from "@/components/StepProgress";
import { ConfirmLeaveModal } from "@/components/ConfirmLeaveModal";
import { ProfilePreviewLink } from "@/components/ProfilePreviewLink";
import { PainelStepTabs } from "@/components/PainelStepTabs";
import {
  savePublishDraftAction,
  publishForCurrentUserAction,
  saveCoverAction,
} from "@/app/painel/actions";
import { DEFAULT_CAPTION } from "@/lib/constants";
import { PREVIEW_AVATARS } from "@/lib/preview-avatars";
import { compositeCoverDataUrl } from "@/lib/composite";

// 3 passos de conteúdo: Molduras, Link da campanha, Legenda. No último,
// "Publicar" não avança pra um passo 4 — quem já está logado salva direto
// na conta; quem não está, salva um rascunho e só então vai pro
// login/cadastro (ver handleNext).
const TOTAL_STEPS = 3;

// A barra de progresso só aparece a partir do passo 2 (o passo 1, Molduras,
// nunca mostra barra) — por isso ela tem 2 segmentos, não 3: representa só
// Link da campanha e Legenda, os dois passos que de fato têm barra visível.
const BAR_SEGMENTS = TOTAL_STEPS - 1;

type TemplateItem = { id: string; imageUrl: string };

export function PainelSteps({
  isLoggedIn,
  username,
  title: initialTitle,
  description: initialDescription,
  caption: initialCaption,
  previewPhotoUrl,
  templates,
  limit,
  premiumPriceCents,
}: {
  isLoggedIn: boolean;
  username: string;
  title: string;
  description: string;
  caption: string;
  previewPhotoUrl: string;
  templates: TemplateItem[];
  limit: number;
  premiumPriceCents: number;
}) {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [campaignLink, setCampaignLink] = useState(username);
  const [caption, setCaption] = useState(initialCaption || DEFAULT_CAPTION);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  // Foto que aparece na prévia do passo 3. Mora aqui, e não lá dentro,
  // porque quem publica é este componente — e publicar gera a capa a partir
  // dela (ver handleNext).
  const [previewAvatar, setPreviewAvatar] = useState(
    previewPhotoUrl || PREVIEW_AVATARS[0]
  );
  const router = useRouter();

  const handleBack = () => {
    if (step > 1) {
      setStep((s) => s - 1);
      return;
    }
    setShowLeaveConfirm(true);
  };

  // Requisitos por passo: Molduras precisa de pelo menos 1 imagem; Link da
  // campanha exige título e link (descrição é opcional); Legenda é sempre
  // opcional (já vem preenchida, pode ficar em branco se quiser).
  const canAdvance =
    step === 1
      ? templates.length > 0
      : step === 2
        ? title.trim() !== "" && campaignLink.trim() !== ""
        : true;

  const missingHint =
    step === 1 && templates.length === 0
      ? "Envie pelo menos uma moldura pra continuar."
      : step === 2 && (title.trim() === "" || campaignLink.trim() === "")
        ? "Preencha o título e o link da campanha pra continuar."
        : "";

  const handleNext = async () => {
    if (step !== TOTAL_STEPS) {
      setStep((s) => s + 1);
      return;
    }

    setPublishError("");
    setIsPublishing(true);

    const payload = { title, description, username: campaignLink, caption };

    // Já logado: aplica direto na conta e vai pra tela de sucesso, sem
    // passar por login/cadastro de novo. Sem login: salva um rascunho e só
    // aí manda pro login/cadastro, que finaliza a publicação.
    const result = isLoggedIn
      ? await publishForCurrentUserAction(payload)
      : await savePublishDraftAction(payload);

    if (result && "error" in result) {
      setIsPublishing(false);
      setPublishError(result.error);
      return;
    }

    // Capa da campanha, refeita a cada publicação. É um artefato derivado:
    // se falhar, a campanha já está publicada do mesmo jeito, então não
    // vale barrar o fluxo por causa dela.
    const moldura = templates[0]?.imageUrl;
    if (moldura) {
      try {
        const coverDataUrl = await compositeCoverDataUrl(previewAvatar, moldura);
        await saveCoverAction(coverDataUrl, previewAvatar);
      } catch {
        // segue o fluxo — a próxima publicação tenta de novo
      }
    }

    setIsPublishing(false);

    if (isLoggedIn) {
      router.push("/painel/sucesso");
      return;
    }

    const query = moldura ? `?moldura=${encodeURIComponent(moldura)}` : "";
    router.push(`/login${query}`);
  };

  return (
    <>
      {step === 1 && (
        <div className="flex flex-col gap-6">
          <div>
            <ProfilePreviewLink username={campaignLink} />
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary-light">
                <ImageIcon size={16} strokeWidth={2} />
              </div>
              <h1 className="text-lg font-bold tracking-tight text-white">
                Molduras
              </h1>
            </div>
            <PainelStepTabs
              isLoggedIn={isLoggedIn}
              activeStep={1}
              onSelectStep={setStep}
            />
            <p className="mt-4 text-sm text-white/60">
              As artes que aparecem na sua página de apoio, em:
            </p>
            <div className="mt-2 w-fit rounded-full bg-white/5 px-4 py-1 ring-1 ring-white/10">
              <span className="text-sm font-bold text-white/60">
                opop.bio/{campaignLink || "seu-link"}
              </span>
            </div>
          </div>

          <TemplatesManager
            templates={templates}
            limit={limit}
            isLoggedIn={isLoggedIn}
            premiumPriceCents={premiumPriceCents}
          />
        </div>
      )}

      {step === 2 && (
        <PainelStepDetalhes
          title={title}
          onTitleChange={setTitle}
          description={description}
          onDescriptionChange={setDescription}
          username={campaignLink}
          onUsernameChange={setCampaignLink}
          isLoggedIn={isLoggedIn}
          onSelectStep={setStep}
        />
      )}

      {step === 3 && (
        <PainelStepLegenda
          moldura={templates[0]?.imageUrl}
          caption={caption}
          onCaptionChange={setCaption}
          username={campaignLink}
          isLoggedIn={isLoggedIn}
          onSelectStep={setStep}
          initialPreviewPhotoUrl={previewPhotoUrl}
          previewAvatar={previewAvatar}
          onSelectPreviewAvatar={setPreviewAvatar}
        />
      )}

      <div
        className="fixed inset-x-0 bottom-0 z-40 flex justify-center bg-[#2A2A2A]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex w-full max-w-120 flex-col gap-3 border-x border-t border-white/10 px-6 py-4">
          {step > 1 && <StepProgress current={step - 1} total={BAR_SEGMENTS} />}
          {publishError ? (
            <p className="text-sm text-red-400" role="alert">
              {publishError}
            </p>
          ) : (
            missingHint && (
              <p className="text-xs text-white/40">{missingHint}</p>
            )
          )}
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleBack}
              disabled={isPublishing}
              className="flex h-11 items-center justify-center rounded-full border border-white/20 px-6 text-sm font-semibold text-white transition active:scale-95 hover:bg-white/5 disabled:opacity-60"
            >
              {step === 1 ? "Cancelar" : "Voltar"}
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={isPublishing || !canAdvance}
              className="flex h-11 items-center justify-center rounded-full bg-danger px-6 text-sm font-semibold text-white transition active:scale-95 hover:bg-danger-dark disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40 disabled:hover:bg-white/10 disabled:active:scale-100"
            >
              {step === TOTAL_STEPS
                ? isPublishing
                  ? "Publicando..."
                  : "Publicar"
                : "Avançar"}
            </button>
          </div>
        </div>
      </div>

      {showLeaveConfirm && (
        <ConfirmLeaveModal
          onStay={() => setShowLeaveConfirm(false)}
          onLeave={() =>
            router.push(isLoggedIn ? `/${campaignLink}` : "/")
          }
        />
      )}
    </>
  );
}
