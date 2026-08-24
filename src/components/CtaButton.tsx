import { ArrowRight } from "lucide-react";

// Dois formatos: sem `subtitle` é o CTA "padrão" da página (uma linha,
// texto+ícone centralizados juntos); com `subtitle` é o formato de duas
// linhas (título+legenda à esquerda, ícone empurrado pra ponta com
// `ml-auto`). Os dois pulsam sempre — é o mesmo botão em momentos
// diferentes da página, então precisam chamar atenção do mesmo jeito.
export function CtaButton({
  href,
  title,
  subtitle,
  className = "",
}: {
  href: string;
  title: string;
  subtitle?: string;
  className?: string;
}) {
  const base =
    "animate-cta-pulse flex w-full items-center justify-center rounded-full bg-danger text-white transition active:scale-95 hover:bg-danger-dark";

  if (subtitle) {
    return (
      <a
        href={href}
        className={`${base} h-14 gap-2.5 px-4 shadow-md shadow-danger/15 xs:px-6 ${className}`}
      >
        <span className="flex flex-col items-start leading-tight">
          <span className="text-base font-bold">{title}</span>
          <span className="text-xs font-normal text-white/80">{subtitle}</span>
        </span>
        <ArrowRight size={20} strokeWidth={2.5} className="ml-auto shrink-0" />
      </a>
    );
  }

  return (
    <a href={href} className={`${base} h-13 gap-2 text-base font-semibold ${className}`}>
      {title}
      <ArrowRight size={18} strokeWidth={2.5} />
    </a>
  );
}
