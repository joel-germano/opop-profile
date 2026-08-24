"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Check, Copy, Gift, Loader2, Mail, Plus, Send, X } from "lucide-react";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { SupporterUnlockModal } from "@/components/SupporterUnlockModal";
import {
  createFrameInviteAction,
  getMyInviteSummaryAction,
  sendFrameInviteEmailAction,
} from "@/app/presidenciaveis/invite-actions";
import type { InviteSummary } from "@/lib/frame-invites";

export function GiftInviteModal({
  candidateSlug,
  candidateName,
  initialSummary,
  gnClientId,
  googleClientId,
  priceCents,
  onClose,
}: {
  candidateSlug: string;
  candidateName: string;
  initialSummary: InviteSummary;
  gnClientId: string;
  googleClientId: string;
  priceCents: number;
  onClose: () => void;
}) {
  const [summary, setSummary] = useState(initialSummary);
  const [error, setError] = useState("");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [emailFormFor, setEmailFormFor] = useState<string | null>(null);
  const [emailValue, setEmailValue] = useState("");
  const [isTopupOpen, setIsTopupOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleTopupSuccess = () => {
    setIsTopupOpen(false);
    startTransition(async () => {
      const result = await getMyInviteSummaryAction();
      if (result.ok) setSummary(result.summary);
    });
  };

  const whatsappHref = (url: string) =>
    `https://wa.me/?text=${encodeURIComponent(
      `Te dei uma moldura de apoio a ${candidateName}! 🎁\n\nÉ só clicar, escolher sua foto e a arte sai na hora — sem pagar nada:\n${url}`
    )}`;

  const handleCreate = () => {
    setError("");
    startTransition(async () => {
      const result = await createFrameInviteAction(candidateSlug);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSummary(result.summary);
    });
  };

  const handleCopy = async (token: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
    } catch {
      setError("Não foi possível copiar. Selecione o link e copie na mão.");
    }
  };

  const handleSendEmail = (e: FormEvent, token: string) => {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await sendFrameInviteEmailAction(token, emailValue);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSummary(result.summary);
      setEmailFormFor(null);
      setEmailValue("");
    });
  };

  const pending = summary.invites.filter((i) => i.status === "pending");
  // Molduras que a própria pessoa gerou (selfUse) não entram aqui — isso é
  // sobre presentear, o histórico de geração própria mora em "Minha
  // Galeria". Só mostra convites que um amigo de fato resgatou.
  const used = summary.invites.filter((i) => i.status === "used" && !i.selfUse);

  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center bg-black/70 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[85vh] w-full max-w-sm flex-col overflow-hidden rounded-3xl bg-[#1c1c1c] shadow-2xl shadow-black/60 ring-1 ring-white/10">
        <div className="flex shrink-0 items-center justify-between px-4 py-3 sm:py-4">
          <div className="w-10" />
          <h2 className="text-lg font-bold tracking-tight text-white">
            Presentear um amigo
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

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 pb-8">
          <div className="flex items-center gap-2.5 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary/20 text-secondary-light">
              <Gift size={16} strokeWidth={2} />
            </div>
            <p className="text-xs text-white/60">
              <strong className="text-white">{summary.available}</strong>{" "}
              {summary.available === 1 ? "moldura sobrando" : "molduras sobrando"}
              . Cada convite vale 1 moldura pro seu amigo, de graça — mandar
              é sempre opcional.
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}

          {summary.available > 0 ? (
            <button
              type="button"
              onClick={handleCreate}
              disabled={isPending}
              className="flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-full bg-secondary text-sm font-semibold text-white transition active:scale-95 hover:bg-secondary-dark disabled:opacity-40"
            >
              {isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Plus size={16} strokeWidth={2.5} />
              )}
              Gerar convite
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsTopupOpen(true)}
              disabled={isPending}
              className="flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-full bg-secondary text-sm font-semibold text-white transition active:scale-95 hover:bg-secondary-dark disabled:opacity-40"
            >
              <Plus size={16} strokeWidth={2.5} />
              Comprar mais convites
            </button>
          )}

          {pending.map((invite) => (
            <div
              key={invite.id}
              className="rounded-2xl bg-white/5 p-3 ring-1 ring-white/10"
            >
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-secondary-light" aria-hidden />
                <span className="text-xs font-bold text-white">
                  Convite disponível
                </span>
                {invite.sentToEmail && (
                  <span className="ml-auto truncate text-[11px] text-white/40">
                    enviado pra {invite.sentToEmail}
                  </span>
                )}
              </div>

              <p className="mt-2 truncate rounded-lg bg-black/30 px-2.5 py-2 text-[11px] text-white/50">
                {invite.url.replace(/^https?:\/\//, "")}
              </p>

              <div className="mt-2.5 flex gap-2">
                <a
                  href={whatsappHref(invite.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-[#25D366] text-xs font-bold text-white transition active:scale-95 hover:brightness-110"
                >
                  <WhatsAppIcon size={14} />
                  WhatsApp
                </a>
                <button
                  type="button"
                  aria-label="Enviar por email"
                  onClick={() =>
                    setEmailFormFor(emailFormFor === invite.token ? null : invite.token)
                  }
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition active:scale-90 hover:bg-white/20"
                >
                  <Mail size={14} strokeWidth={2} />
                </button>
                <button
                  type="button"
                  aria-label="Copiar link"
                  onClick={() => handleCopy(invite.token, invite.url)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition active:scale-90 hover:bg-white/20"
                >
                  {copiedToken === invite.token ? (
                    <Check size={14} strokeWidth={2.5} className="text-brand" />
                  ) : (
                    <Copy size={14} strokeWidth={2} />
                  )}
                </button>
              </div>

              {emailFormFor === invite.token && (
                <form
                  onSubmit={(e) => handleSendEmail(e, invite.token)}
                  className="mt-2.5 flex gap-2"
                >
                  <input
                    type="email"
                    required
                    autoFocus
                    value={emailValue}
                    onChange={(e) => setEmailValue(e.target.value)}
                    placeholder="amigo@email.com"
                    className="h-9 min-w-0 flex-1 rounded-full bg-white/10 px-3.5 text-xs text-white outline-none placeholder:text-white/30 focus:ring-2 focus:ring-secondary"
                  />
                  <button
                    type="submit"
                    disabled={isPending}
                    aria-label="Enviar convite por email"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-white transition active:scale-90 hover:bg-secondary-dark disabled:opacity-50"
                  >
                    {isPending ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Send size={14} strokeWidth={2} />
                    )}
                  </button>
                </form>
              )}
            </div>
          ))}

          {used.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-bold text-white/40">Já resgatados</p>
              {used.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center gap-2 rounded-2xl bg-white/[0.03] px-3 py-2.5"
                >
                  <Check size={14} strokeWidth={2.5} className="shrink-0 text-brand" />
                  <span className="truncate text-xs text-white/50">
                    {invite.usedByEmail ?? "Resgatado"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isTopupOpen && (
        <SupporterUnlockModal
          gnClientId={gnClientId}
          googleClientId={googleClientId}
          priceCents={priceCents}
          alreadyIdentified
          mode="topup"
          onUnlocked={handleTopupSuccess}
          onClose={() => setIsTopupOpen(false)}
        />
      )}
    </div>
  );
}
