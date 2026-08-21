"use client";

import { useActionState, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { Camera, User } from "lucide-react";
import {
  registerAction,
  type RegisterState,
} from "@/app/(auth)/cadastro/actions";
import { loginOrRegisterWithGoogleAction } from "@/app/(auth)/login/actions";
import { resizeImageToSquareDataUrl } from "@/lib/resize-avatar";
import { TextField } from "@/components/TextField";
import { PhoneInput } from "@/components/PhoneInput";
import { UsernameField } from "@/components/UsernameField";
import { PasswordField } from "@/components/PasswordField";

const initialState: RegisterState = null;

export function CadastroForm({ googleClientId }: { googleClientId: string }) {
  const [state, formAction, pending] = useActionState(
    registerAction,
    initialState
  );
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [googleError, setGoogleError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await resizeImageToSquareDataUrl(file);
    setPhotoUrl(dataUrl);
  };

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
      text: "signup_with",
    });
  };

  return (
    <>
      <div className="mt-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Crie o perfil da sua campanha
        </h1>
        <p className="mt-1.5 text-sm text-white/60">
          Essas informações aparecem pra quem visitar o seu link — é a
          página que seus apoiadores vão ver e usar pra montar o card deles.
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
        ou cadastre-se com seu e-mail
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <form action={formAction} className="flex w-full flex-col gap-4">
        <input type="hidden" name="photoDataUrl" value={photoUrl ?? ""} />

        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative flex h-24 w-24 items-center justify-center rounded-full bg-white/10 text-white/60 transition active:scale-95"
            aria-label="Escolher foto de perfil"
          >
            {photoUrl ? (
              <Image
                src={photoUrl}
                alt="Foto de perfil"
                fill
                className="rounded-full object-cover"
              />
            ) : (
              <User size={32} strokeWidth={1.75} />
            )}
            <span className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-danger text-white ring-4 ring-[#2A2A2A]">
              <Camera size={14} strokeWidth={2} />
            </span>
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoChange}
        />

        <TextField
          type="text"
          name="name"
          autoComplete="name"
          placeholder="Nome completo (aparece no seu perfil)"
          required
        />
        <UsernameField
          name="username"
          autoComplete="username"
          placeholder="seu-nome"
          required
        />
        <PhoneInput name="whatsapp" placeholder="WhatsApp (opcional)" />
        <TextField
          type="email"
          name="email"
          autoComplete="email"
          placeholder="Email"
          required
        />
        <PasswordField
          name="senha"
          autoComplete="new-password"
          placeholder="Senha"
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
          {pending ? "Criando conta..." : "Criar conta"}
        </button>
      </form>

      <p className="text-sm text-white/60">
        Já tem conta?{" "}
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
