"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { updateUserAction, type UpdateUserState } from "@/app/admin/(dashboard)/candidatos/actions";

const initialState: UpdateUserState = null;

export function AdminUserForm({
  userId,
  initialName,
  initialUsername,
  initialEmail,
  initialWhatsapp,
  initialPlan,
}: {
  userId: string;
  initialName: string;
  initialUsername: string;
  initialEmail: string;
  initialWhatsapp: string;
  initialPlan: "free" | "premium";
}) {
  const boundAction = updateUserAction.bind(null, userId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);
  const router = useRouter();

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm text-white/60">
        Nome
        <input
          name="name"
          defaultValue={initialName}
          required
          className="rounded-xl bg-white/10 px-4 py-3 text-base text-white focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm text-white/60">
        Username
        <input
          name="username"
          defaultValue={initialUsername}
          required
          className="rounded-xl bg-white/10 px-4 py-3 text-base text-white focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm text-white/60">
        Email
        <input
          name="email"
          type="email"
          defaultValue={initialEmail}
          required
          className="rounded-xl bg-white/10 px-4 py-3 text-base text-white focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm text-white/60">
        WhatsApp
        <input
          name="whatsapp"
          defaultValue={initialWhatsapp}
          required
          className="rounded-xl bg-white/10 px-4 py-3 text-base text-white focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm text-white/60">
        Plano
        <select
          name="plan"
          defaultValue={initialPlan}
          className="rounded-xl bg-white/10 px-4 py-3 text-base text-white focus:outline-none"
        >
          <option value="free">Free</option>
          <option value="premium">Premium</option>
        </select>
      </label>

      {state && "error" in state && (
        <p className="text-sm text-red-400" role="alert">
          {state.error}
        </p>
      )}
      {state && "success" in state && (
        <p className="flex items-center gap-2 text-sm text-brand-light">
          <Check size={16} /> Salvo.
        </p>
      )}

      <div className="mt-2 flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="flex h-12 flex-1 items-center justify-center rounded-full bg-brand text-sm font-semibold text-black transition active:scale-95 hover:bg-brand-light disabled:opacity-60"
        >
          {pending ? "Salvando..." : "Salvar"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/candidatos")}
          className="flex h-12 flex-1 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white transition active:scale-95 hover:bg-white/20"
        >
          Voltar
        </button>
      </div>
    </form>
  );
}
