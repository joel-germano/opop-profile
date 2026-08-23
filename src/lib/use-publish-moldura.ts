"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export const PUBLISH_MOLDURA_STORAGE_KEY = "opop_publish_moldura";

// Guarda a moldura vinda do "Publicar" (fim do fluxo em /painel) tanto na
// URL quanto no localStorage — assim ela continua aparecendo mesmo se a
// pessoa sair da tela de login/cadastro e voltar, ou alternar entre as duas
// (o link "Criar conta"/"Entrar" não carrega o parâmetro na URL).
export function usePublishMoldura(): string | null {
  const searchParams = useSearchParams();
  const fromUrl = searchParams.get("moldura");
  const [moldura, setMoldura] = useState<string | null>(fromUrl);

  useEffect(() => {
    try {
      if (fromUrl) {
        // Já é o valor inicial do estado — só precisa persistir.
        localStorage.setItem(PUBLISH_MOLDURA_STORAGE_KEY, fromUrl);
        return;
      }
      const stored = localStorage.getItem(PUBLISH_MOLDURA_STORAGE_KEY);
      if (stored) {
        // Lendo de fora do React (localStorage) — não dá pra saber esse
        // valor antes de montar, por isso o setState aqui é legítimo.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMoldura(stored);
      }
    } catch {
      // localStorage pode falhar (aba anônima, storage bloqueado) — sem
      // problema, a prévia simplesmente não aparece nesse caso.
    }
  }, [fromUrl]);

  return moldura;
}
