"use client";

import { useState } from "react";
import { Gift } from "lucide-react";
import { GiftInviteModal } from "@/components/GiftInviteModal";
import type { InviteSummary } from "@/lib/frame-invites";

export function GiftInviteCard({
  candidateSlug,
  candidateName,
  summary,
  gnClientId,
  googleClientId,
  priceCents,
}: {
  candidateSlug: string;
  candidateName: string;
  summary: InviteSummary;
  gnClientId: string;
  googleClientId: string;
  priceCents: number;
}) {
  const [isOpen, setIsOpen] = useState(false);

  // Cada moldura comprada e ainda não gasta pode virar um convite — sem
  // reserva fixa. Só não mostra o card se não sobra vaga nenhuma E nunca
  // existiu convite (evita sumir com histórico de quem já presenteou tudo).
  if (summary.total === 0 && summary.invites.length === 0) return null;

  return (
    <>
      <div className="mx-auto w-full max-w-xs rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary/20 text-secondary-light">
            <Gift size={16} strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-white">Presenteie um amigo</p>
            <p className="text-xs text-white/50">
              {summary.available} de {summary.total} molduras disponíveis
            </p>
          </div>
        </div>

        {summary.total > 0 && (
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-secondary"
              style={{ width: `${(summary.available / summary.total) * 100}%` }}
            />
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-full bg-secondary/15 text-sm font-semibold text-secondary-light transition active:scale-95 hover:bg-secondary/25"
        >
          <Gift size={15} strokeWidth={2} />
          {summary.available > 0 ? "Enviar para um amigo" : "Ver histórico"}
        </button>
      </div>

      {isOpen && (
        <GiftInviteModal
          candidateSlug={candidateSlug}
          candidateName={candidateName}
          initialSummary={summary}
          gnClientId={gnClientId}
          googleClientId={googleClientId}
          priceCents={priceCents}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
