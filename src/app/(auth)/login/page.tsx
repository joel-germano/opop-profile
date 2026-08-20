"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = null;

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(
    loginAction,
    initialState
  );

  return (
    <>
      <div className="mt-2 text-center">
        <h1 className="font-heading text-3xl font-normal tracking-wide text-white">
          Entrar
        </h1>
        <p className="mt-2 text-base text-white/60">
          Acesse o painel com seu email e senha.
        </p>
      </div>

      <form action={formAction} className="flex w-full flex-col gap-4">
        <input
          type="email"
          name="email"
          autoComplete="email"
          placeholder="Email"
          required
          className="w-full rounded-xl bg-white/10 px-4 py-3.5 text-base text-white placeholder:text-white/40 focus:outline-none"
        />
        <input
          type="password"
          name="senha"
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

      <p className="text-sm text-white/60">
        Ainda não tem conta?{" "}
        <Link
          href="/cadastro"
          className="font-medium text-brand-light underline decoration-brand/40 underline-offset-2"
        >
          Criar conta
        </Link>
      </p>
    </>
  );
}
