import Link from "next/link";
import { Eye } from "lucide-react";

// Some quando ainda não tem link escolhido — nesse caso não existe nada pra
// pré-visualizar. Reaproveitado nos 3 passos de /painel (ver PainelSteps).
// Fica na sua própria linha, acima do cabeçalho do passo: ao lado do título
// ele espremia o texto em telas estreitas (ex: "Detalhes da campanha"
// quebrando em 3 linhas pra abrir espaço pro botão).
export function ProfilePreviewLink({ username }: { username: string }) {
  if (username.trim() === "") return null;

  return (
    <div className="mb-3 flex justify-center">
      <Link
        href={`/${username}`}
        className="flex shrink-0 items-center gap-2 rounded-full border border-danger/40 bg-danger/10 px-3.5 py-1 text-sm font-semibold text-danger-light transition hover:bg-danger/15"
      >
        <Eye size={16} strokeWidth={2} />
        Ver meu perfil
      </Link>
    </div>
  );
}
