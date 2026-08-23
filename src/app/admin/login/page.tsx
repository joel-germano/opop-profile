"use client";

import { useActionState } from "react";
import { loginAdminAction, type AdminLoginState } from "./actions";

const initialState: AdminLoginState = null;

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(loginAdminAction, initialState);

  return (
    <div className="flex flex-1 min-h-screen items-center justify-center bg-[#1c1c1c] px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Admin
        </h1>
        <p className="mt-2 text-sm text-white/60">
          Painel restrito.
        </p>

        <form action={formAction} className="mt-6 flex flex-col gap-4">
          <input
            type="text"
            name="username"
            autoComplete="username"
            placeholder="Usuário"
            required
            className="w-full rounded-xl bg-white/10 px-4 py-3.5 text-base text-white placeholder:text-white/40 focus:outline-none"
          />
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            placeholder="Senha"
            required
            className="w-full rounded-xl bg-white/10 px-4 py-3.5 text-base text-white placeholder:text-white/40 focus:outline-none"
          />

          {state?.error && (
            <p className="text-sm text-red-400" role="alert">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 flex h-14 w-full items-center justify-center rounded-full bg-brand text-base font-semibold text-black transition active:scale-95 hover:bg-brand-light disabled:opacity-60"
          >
            {pending ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
