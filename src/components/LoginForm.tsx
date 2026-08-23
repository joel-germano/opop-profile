"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { useSearchParams } from "next/navigation";
import { loginAction, loginOrRegisterWithGoogleAction, type LoginState } from "@/app/(auth)/login/actions";
import { TextField } from "@/components/TextField";
import { PasswordField } from "@/components/PasswordField";
import { PublishMolduraPreview } from "@/components/PublishMolduraPreview";
import { usePublishMoldura } from "@/lib/use-publish-moldura";

const initialState: LoginState = null;

export function LoginForm({ googleClientId }: { googleClientId: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const [googleError, setGoogleError] = useState("");
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const moldura = usePublishMoldura();
  const next = useSearchParams().get("next");
  const cadastroHref = next ? `/cadastro?next=${encodeURIComponent(next)}` : "/cadastro";

  const handleGoogleReady = () => {
    if (!window.google || !googleButtonRef.current) return;
    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: async (response) => {
        setGoogleError("");
        const result = await loginOrRegisterWithGoogleAction(response.credential, next);
        if (result && "error" in result) setGoogleError(result.error);
      },
    });
    window.google.accounts.id.renderButton(googleButtonRef.current, {
      theme: "filled_black",
      width: 280,
      text: "signin_with",
    });
  };

  return (
    <>
      {moldura ? (
        <PublishMolduraPreview moldura={moldura} title="Entrar para publicar sua campanha" />
      ) : (
        <div className="mt-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Entrar
          </h1>
          <p className="mt-1.5 text-sm text-white/60">
            Acesse o painel com seu email e senha.
          </p>
        </div>
      )}

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
        ou entre com seu e-mail
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <form action={formAction} className="flex w-full flex-col gap-4">
        <input type="hidden" name="next" value={next ?? ""} />
        <TextField
          type="email"
          name="email"
          autoComplete="email"
          placeholder="Email"
          required
        />
        <PasswordField
          name="senha"
          autoComplete="current-password"
          placeholder="Senha"
          required
        />

        <Link
          href="/esqueci-senha"
          className="-mt-2 self-end text-sm font-medium text-white/60 underline decoration-white/30 underline-offset-2 transition hover:text-white"
        >
          Esqueci minha senha
        </Link>

        {state?.error && (
          <p className="text-sm text-red-400" role="alert">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-2 flex h-14 w-full items-center justify-center rounded-full bg-danger text-base font-semibold text-white transition active:scale-95 hover:bg-danger-dark disabled:opacity-60"
        >
          {pending ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="text-sm text-white/60">
        Ainda não tem conta?{" "}
        <Link
          href={cadastroHref}
          className="font-medium text-danger-light underline decoration-danger/40 underline-offset-2"
        >
          Criar conta
        </Link>
      </p>
    </>
  );
}
