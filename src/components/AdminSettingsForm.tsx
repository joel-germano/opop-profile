"use client";

import { useActionState } from "react";
import { Check } from "lucide-react";
import {
  updatePremiumPriceAction,
  updatePresidenciaveisPriceAction,
  type UpdateSettingsState,
} from "@/app/admin/(dashboard)/configuracoes/actions";
import { formatBrl } from "@/lib/card-format";

const initialState: UpdateSettingsState = null;

function PriceForm({
  action,
  fieldName,
  label,
  initialCents,
  successMessage,
}: {
  action: (state: UpdateSettingsState, formData: FormData) => Promise<UpdateSettingsState>;
  fieldName: string;
  label: string;
  initialCents: number;
  successMessage: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm text-white/60">
        {label}
        <input
          name={fieldName}
          inputMode="decimal"
          defaultValue={formatBrl(initialCents)}
          required
          className="rounded-xl bg-white/10 px-4 py-3 text-base text-white focus:outline-none"
        />
      </label>

      {state && "error" in state && (
        <p className="text-sm text-red-400" role="alert">
          {state.error}
        </p>
      )}
      {state && "success" in state && (
        <p className="flex items-center gap-2 text-sm text-brand-light">
          <Check size={16} /> {successMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex h-12 w-full items-center justify-center rounded-full bg-brand text-sm font-semibold text-black transition active:scale-95 hover:bg-brand-light disabled:opacity-60"
      >
        {pending ? "Salvando..." : "Salvar"}
      </button>
    </form>
  );
}

export function AdminSettingsForm({
  initialPremiumPriceCents,
  initialPresidenciaveisPriceCents,
}: {
  initialPremiumPriceCents: number;
  initialPresidenciaveisPriceCents: number;
}) {
  return (
    <div className="flex flex-col gap-8">
      <PriceForm
        action={updatePremiumPriceAction}
        fieldName="premiumPrice"
        label="Valor da assinatura Premium (R$)"
        initialCents={initialPremiumPriceCents}
        successMessage="Salvo — já vale pro checkout e pro modal Premium."
      />

      <PriceForm
        action={updatePresidenciaveisPriceAction}
        fieldName="presidenciaveisPrice"
        label="Valor do desbloqueio Presidenciáveis (R$)"
        initialCents={initialPresidenciaveisPriceCents}
        successMessage="Salvo — já vale pra tela dos presidenciáveis."
      />
    </div>
  );
}
