"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  requestPasswordResetAction,
  type ForgotPasswordState,
} from "@/app/(auth)/esqueci-senha/actions";
import { TextField } from "@/components/TextField";

const initialState: ForgotPasswordState = null;

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    requestPasswordResetAction,
    initialState
  );

  if (state && "success" in state) {
    return (
      <div className="mt-2 flex flex-col items-center gap-4 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Verifique seu email
        </h1>
        <p className="text-sm text-white/60">
          Se houver uma conta com esse email, enviamos um link pra você
          redefinir sua senha. O link expira em 1 hora.
        </p>
        <Link
          href="/login"
          className="mt-2 text-sm font-medium text-danger-light underline decoration-danger/40 underline-offset-2"
        >
          Voltar para o login
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mt-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Esqueci minha senha
        </h1>
        <p className="mt-1.5 text-sm text-white/60">
          Digite seu email e enviaremos um link pra redefinir sua senha.
        </p>
      </div>

      <form action={formAction} className="flex w-full flex-col gap-4">
        <TextField
          type="email"
          name="email"
          autoComplete="email"
          placeholder="Email"
          required
        />

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
          {pending ? "Enviando..." : "Enviar link"}
        </button>
      </form>

      <p className="text-sm text-white/60">
        Lembrou a senha?{" "}
        <Link
          href="/login"
          className="font-medium text-danger-light underline decoration-danger/40 underline-offset-2"
        >
          Entrar
        </Link>
      </p>
    </>
  );
}
