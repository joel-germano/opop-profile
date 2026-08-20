"use client";

import { useActionState, useRef, useState } from "react";
import Image from "next/image";
import { Camera, Check } from "lucide-react";
import { updateProfileAction, type UpdateProfileState } from "@/app/painel/perfil/actions";
import { resizeImageToSquareDataUrl } from "@/lib/resize-avatar";

const initialState: UpdateProfileState = null;

export function ProfileForm({
  initialName,
  initialUsername,
  initialWhatsapp,
  initialPhotoUrl,
}: {
  initialName: string;
  initialUsername: string;
  initialWhatsapp: string;
  initialPhotoUrl: string;
}) {
  const [state, formAction, pending] = useActionState(updateProfileAction, initialState);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await resizeImageToSquareDataUrl(file);
    setPhotoPreview(dataUrl);
    setPhotoDataUrl(dataUrl);
  };

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">
      <input type="hidden" name="photoDataUrl" value={photoDataUrl ?? ""} />

      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-white/10 text-white/60 transition active:scale-95"
          aria-label="Trocar foto de perfil"
        >
          <Image
            src={photoPreview ?? initialPhotoUrl}
            alt="Foto de perfil"
            fill
            className="object-cover"
          />
          <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition hover:opacity-100">
            <Camera size={20} strokeWidth={1.75} className="text-white" />
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

      <input
        name="name"
        autoComplete="name"
        placeholder="Nome completo"
        defaultValue={initialName}
        required
        className="w-full rounded-xl bg-white/10 px-4 py-3.5 text-base text-white placeholder:text-white/40 focus:outline-none"
      />
      <input
        name="username"
        autoComplete="username"
        placeholder="Username"
        defaultValue={initialUsername}
        required
        className="w-full rounded-xl bg-white/10 px-4 py-3.5 text-base text-white placeholder:text-white/40 focus:outline-none"
      />
      <input
        name="whatsapp"
        type="tel"
        autoComplete="tel"
        placeholder="WhatsApp"
        defaultValue={initialWhatsapp}
        required
        className="w-full rounded-xl bg-white/10 px-4 py-3.5 text-base text-white placeholder:text-white/40 focus:outline-none"
      />

      {state && "error" in state && (
        <p className="text-sm text-red-400" role="alert">
          {state.error}
        </p>
      )}
      {state && "success" in state && (
        <p className="flex items-center gap-2 text-sm text-brand-light">
          <Check size={16} /> Perfil atualizado.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 flex h-14 w-full items-center justify-center rounded-full bg-brand text-base font-semibold text-black transition active:scale-95 hover:bg-brand-light disabled:opacity-60"
      >
        {pending ? "Salvando..." : "Salvar alterações"}
      </button>
    </form>
  );
}
