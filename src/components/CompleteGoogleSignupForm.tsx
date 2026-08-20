"use client";

import { useActionState, useRef, useState } from "react";
import Image from "next/image";
import { Camera } from "lucide-react";
import {
  completeGoogleSignupAction,
  type CompleteSignupState,
} from "@/app/(auth)/cadastro/completar/actions";
import { resizeImageToSquareDataUrl } from "@/lib/resize-avatar";

const initialState: CompleteSignupState = null;

export function CompleteGoogleSignupForm({ initialName }: { initialName: string }) {
  const [state, formAction, pending] = useActionState(completeGoogleSignupAction, initialState);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await resizeImageToSquareDataUrl(file);
    setPhotoUrl(dataUrl);
  };

  return (
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
            <Image src={photoUrl} alt="Foto de perfil" fill className="object-cover" />
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
        defaultValue={initialName}
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
        type="password"
        name="senha"
        autoComplete="new-password"
        placeholder="Senha (opcional — deixe em branco pra usar só o Google)"
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
        {pending ? "Criando conta..." : "Concluir cadastro"}
      </button>
    </form>
  );
}
