"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { loginAction, loginOrRegisterWithGoogleAction, type LoginState } from "@/app/(auth)/login/actions";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (parent: HTMLElement, options: { theme: string; width: number }) => void;
        };
      };
    };
  }
}

const initialState: LoginState = null;

export function LoginForm({ googleClientId }: { googleClientId: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const [googleError, setGoogleError] = useState("");
  const googleButtonRef = useRef<HTMLDivElement>(null);

  const handleGoogleReady = () => {
    if (!window.google || !googleButtonRef.current) return;
    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: async (response) => {
        setGoogleError("");
        const result = await loginOrRegisterWithGoogleAction(response.credential);
        if (result && "error" in result) setGoogleError(result.error);
      },
    });
    window.google.accounts.id.renderButton(googleButtonRef.current, {
      theme: "filled_black",
      width: 280,
    });
  };

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

      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={handleGoogleReady}
      />
      <div ref={googleButtonRef} className="flex justify-center" />
      {googleError && (
        <p className="text-center text-sm text-red-400" role="alert">
          {googleError}
        </p>
      )}

      <div className="flex w-full items-center gap-3 text-xs text-white/40">
        <div className="h-px flex-1 bg-white/10" />
        ou
        <div className="h-px flex-1 bg-white/10" />
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
