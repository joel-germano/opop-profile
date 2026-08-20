"use client";

import { useActionState, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Camera } from "lucide-react";
import { registerAction, type RegisterState } from "./actions";
import { resizeImageToSquareDataUrl } from "@/lib/resize-avatar";

const initialState: RegisterState = null;

export default function CadastroPage() {
  const [state, formAction, pending] = useActionState(
    registerAction,
    initialState
  );
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await resizeImageToSquareDataUrl(file);
    setPhotoUrl(dataUrl);
  };

  return (
    <>
      <div className="mt-2 text-center">
        <h1 className="font-heading text-3xl font-normal tracking-wide text-white">
          Criar conta
        </h1>
        <p className="mt-2 text-base text-white/60">
          Preencha seus dados para acessar o painel.
        </p>
      </div>

      <form action={formAction} className="flex w-full flex-col gap-4">
        <input type="hidden" name="photoDataUrl" value={photoUrl ?? ""} />

        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-white/10 text-white/60 transition active:scale-95"
            aria-label="Escolher foto de perfil"
          >
            {photoUrl ? (
              <Image
                src={photoUrl}
                alt="Foto de perfil"
                fill
                className="object-cover"
              />
            ) : (
              <Camera size={26} strokeWidth={1.75} />
            )}
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoChange}
        />

        <input
          type="text"
          name="name"
          autoComplete="name"
          placeholder="Nome completo"
          required
          className="w-full rounded-xl bg-white/10 px-4 py-3.5 text-base text-white placeholder:text-white/40 focus:outline-none"
        />
        <input
          type="text"
          name="username"
          autoComplete="username"
          placeholder="Username"
          required
          className="w-full rounded-xl bg-white/10 px-4 py-3.5 text-base text-white placeholder:text-white/40 focus:outline-none"
        />
        <input
          type="tel"
          name="whatsapp"
          autoComplete="tel"
          placeholder="WhatsApp"
          required
          className="w-full rounded-xl bg-white/10 px-4 py-3.5 text-base text-white placeholder:text-white/40 focus:outline-none"
        />
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
          autoComplete="new-password"
          placeholder="Senha"
          required
          className="w-full rounded-xl bg-white/10 px-4 py-3.5 text-base text-white placeholder:text-white/40 focus:outline-none"
        />
        <input
          type="password"
          name="confirmarSenha"
          autoComplete="new-password"
          placeholder="Confirmar senha"
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
          {pending ? "Criando conta..." : "Criar conta"}
        </button>
      </form>

      <p className="text-sm text-white/60">
        Já tem conta?{" "}
        <Link
          href="/login"
          className="font-medium text-brand-light underline decoration-brand/40 underline-offset-2"
        >
          Entrar
        </Link>
      </p>
    </>
  );
}
