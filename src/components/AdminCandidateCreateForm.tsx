"use client";

import { useActionState, useRef, useState } from "react";
import Image from "next/image";
import { Camera } from "lucide-react";
import { createCandidateAction, type CandidateFormState } from "@/app/admin/(dashboard)/presidenciaveis/actions";
import { resizeImageToSquareDataUrl } from "@/lib/resize-avatar";

const initialState: CandidateFormState = null;

export function AdminCandidateCreateForm() {
  const [state, formAction, pending] = useActionState(createCandidateAction, initialState);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await resizeImageToSquareDataUrl(file);
    setPhotoUrl(dataUrl);
  };

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <input type="hidden" name="photoDataUrl" value={photoUrl ?? ""} />

      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-white/10 text-white/60 transition active:scale-95"
          aria-label="Escolher foto do candidato"
        >
          {photoUrl ? (
            <Image src={photoUrl} alt="Foto do candidato" fill className="object-cover" />
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

      <label className="flex flex-col gap-1.5 text-sm text-white/60">
        Nome
        <input
          name="name"
          required
          className="rounded-xl bg-white/10 px-4 py-3 text-base text-white focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm text-white/60">
        Partido
        <input
          name="party"
          placeholder="ex: PT"
          className="rounded-xl bg-white/10 px-4 py-3 text-base text-white placeholder:text-white/30 focus:outline-none"
        />
      </label>

      <label className="flex items-center gap-3 text-sm text-white/60">
        <input
          type="color"
          name="color"
          defaultValue="#47C1F1"
          className="h-11 w-14 shrink-0 cursor-pointer rounded-lg border-0 bg-white/10 p-1"
        />
        Cor do candidato (usada no ranking)
      </label>

      <label className="flex flex-col gap-1.5 text-sm text-white/60">
        Slug (opcional — gerado do nome se deixar em branco)
        <input
          name="slug"
          placeholder="ex: nome-candidato"
          className="rounded-xl bg-white/10 px-4 py-3 text-base text-white placeholder:text-white/30 focus:outline-none"
        />
      </label>

      {state && "error" in state && (
        <p className="text-sm text-red-400" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 flex h-12 w-full items-center justify-center rounded-full bg-brand text-sm font-semibold text-black transition active:scale-95 hover:bg-brand-light disabled:opacity-60"
      >
        {pending ? "Criando..." : "Criar candidato"}
      </button>
    </form>
  );
}
