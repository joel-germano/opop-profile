import { PanelShell } from "@/components/PanelShell";

// /painel agora é acessível sem login — a pessoa monta a campanha inteira
// primeiro e só precisa de conta no fim, ao publicar. Rotas que ainda
// exigem sessão de verdade (perfil, checkout) continuam se protegendo por
// conta própria dentro de cada page.tsx/actions.ts.
export default function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PanelShell>{children}</PanelShell>;
}
