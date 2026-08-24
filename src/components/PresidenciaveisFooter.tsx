// Links sem href de propósito (ver mesmo padrão nos botões "Ver galeria
// completa" desta página) — as páginas legais ainda não existem, então
// aparecem aqui como texto simples em vez de link quebrado levando a um 404.
const LEGAL_LINKS = [
  "Política de privacidade",
  "Termos e condições",
  "Política de cookies",
];

export function PresidenciaveisFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="flex flex-col items-center gap-4 border-t border-white/10 px-6 pt-6 pb-6 text-center">
      <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        {LEGAL_LINKS.map((label) => (
          <span key={label} className="text-xs text-white/50">
            {label}
          </span>
        ))}
      </nav>

      <p className="text-xs text-white/40">
        © {year} Opop Bio - Molduras para Perfil.
      </p>
    </footer>
  );
}
