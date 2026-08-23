"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { PREVIEW_AVATARS, randomPreviewAvatar } from "@/lib/preview-avatars";
import { PUBLISH_MOLDURA_STORAGE_KEY } from "@/lib/use-publish-moldura";

export function PublishMolduraPreview({
  moldura,
  title,
}: {
  moldura: string;
  title: string;
}) {
  const [previewAvatar, setPreviewAvatar] = useState(PREVIEW_AVATARS[0]);
  const [molduraFailed, setMolduraFailed] = useState(false);
  useEffect(() => {
    // Sorteio só pode acontecer depois de montar (não é sincronização com
    // props/estado, é aleatoriedade real — não dá pra fazer de outro jeito).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreviewAvatar(randomPreviewAvatar());
  }, []);

  // Se a moldura salva (localStorage/URL) já foi apagada no meio do fluxo,
  // a imagem quebra — limpa a referência obsoleta em vez de deixar o ícone
  // de imagem quebrada visível.
  const handleMolduraError = () => {
    setMolduraFailed(true);
    try {
      localStorage.removeItem(PUBLISH_MOLDURA_STORAGE_KEY);
    } catch {
      // localStorage indisponível — sem problema, só não limpa a referência.
    }
  };

  return (
    <div className="mt-2 flex flex-col items-center gap-4 text-center">
      <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
      <div className="relative h-32 w-32 overflow-hidden rounded-2xl bg-white/10">
        <Image
          src={previewAvatar}
          alt=""
          fill
          sizes="128px"
          className="scale-90 object-cover"
        />
        {!molduraFailed && (
          <Image
            src={moldura}
            alt=""
            fill
            sizes="128px"
            className="object-cover"
            onError={handleMolduraError}
          />
        )}
      </div>
    </div>
  );
}
