"use client";

import { useActionState, useRef, useState } from "react";
import Image from "next/image";
import { Camera, User } from "lucide-react";
import {
  completeGoogleSignupAction,
  type CompleteSignupState,
} from "@/app/(auth)/cadastro/completar/actions";
import { resizeImageToSquareDataUrl } from "@/lib/resize-avatar";
import { slugifyUsername } from "@/lib/slug";
import { TextField } from "@/components/TextField";
import { PhoneInput } from "@/components/PhoneInput";
import { UsernameField } from "@/components/UsernameField";

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
        defaultValue={initialName}
        required
      />
      <UsernameField
        name="username"
        autoComplete="username"
        placeholder="seu-nome"
        defaultValue={slugifyUsername(initialName)}
        required
      />
      <PhoneInput name="whatsapp" placeholder="WhatsApp (opcional)" />

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
        {pending ? "Criando conta..." : "Concluir cadastro"}
      </button>
    </form>
  );
}
