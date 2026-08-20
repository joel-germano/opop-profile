"use client";

import { useActionState, useRef, useState } from "react";
import Image from "next/image";
import { Camera, Check } from "lucide-react";
import { updateCandidateAction, type CandidateFormState } from "@/app/admin/(dashboard)/presidenciaveis/actions";
import { resizeImageToSquareDataUrl } from "@/lib/resize-avatar";

const initialState: CandidateFormState = null;

export function AdminCandidateEditForm({
  candidateId,
  initialName,
  initialSlug,
  initialPhotoUrl,
}: {
  candidateId: string;
  initialName: string;
  initialSlug: string;
  initialPhotoUrl: string;
}) {
  const boundAction = updateCandidateAction.bind(null, candidateId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);
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
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <input type="hidden" name="photoDataUrl" value={photoDataUrl ?? ""} />

      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-white/10 text-white/60 transition active:scale-95"
          aria-label="Trocar foto do candidato"
        >
          <Image
            src={photoPreview ?? initialPhotoUrl}
            alt="Foto do candidato"
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

      <label className="flex flex-col gap-1.5 text-sm text-white/60">
        Nome
        <input
          name="name"
          defaultValue={initialName}
          required
          className="rounded-xl bg-white/10 px-4 py-3 text-base text-white focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm text-white/60">
        Slug
        <input
          name="slug"
          defaultValue={initialSlug}
          required
          className="rounded-xl bg-white/10 px-4 py-3 text-base text-white focus:outline-none"
        />
      </label>

      {state && "error" in state && (
        <p className="text-sm text-red-400" role="alert">
          {state.error}
        </p>
      )}
      {state && "success" in state && (
        <p className="flex items-center gap-2 text-sm text-brand-light">
          <Check size={16} /> Salvo.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex h-12 w-full items-center justify-center rounded-full bg-brand text-sm font-semibold text-black transition active:scale-95 hover:bg-brand-light disabled:opacity-60"
      >
        {pending ? "Salvando..." : "Salvar"}
      </button>
    </form>
  );
}
