"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  resetPasswordAction,
  type ResetPasswordState,
} from "@/app/(auth)/redefinir-senha/actions";
import { PasswordField } from "@/components/PasswordField";

const initialState: ResetPasswordState = null;

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(
    resetPasswordAction,
    initialState
  );

  if (!token) {
    return (
      <div className="mt-2 flex flex-col items-center gap-4 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Link inválido
        </h1>
        <p className="text-sm text-white/60">
          Esse link de redefinição está incompleto. Peça um novo.
        </p>
        <Link
          href="/esqueci-senha"
          className="mt-2 text-sm font-medium text-danger-light underline decoration-danger/40 underline-offset-2"
        >
          Pedir novo link
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mt-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Nova senha
        </h1>
        <p className="mt-1.5 text-sm text-white/60">
          Escolha uma nova senha pra sua conta.
        </p>
      </div>

      <form action={formAction} className="flex w-full flex-col gap-4">
        <input type="hidden" name="token" value={token} />
        <PasswordField
          name="senha"
          autoComplete="new-password"
          placeholder="Nova senha"
          required
        />
        <PasswordField
          name="confirmarSenha"
          autoComplete="new-password"
          placeholder="Confirmar nova senha"
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
          {pending ? "Salvando..." : "Salvar nova senha"}
        </button>
      </form>
    </>
  );
}
