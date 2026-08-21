import Image from "next/image";
import Link from "next/link";

const FOOTER_LINKS = [
  { href: "#como-funciona", label: "Como funciona" },
  { href: "/login", label: "Entrar" },
  { href: "/cadastro", label: "Criar minha moldura" },
];

export function HomeFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="flex flex-col items-center gap-6 border-t border-white/10 px-6 pt-10 pb-8 text-center">
      <Link href="/">
        <Image
          src="/logo-opop-v3.png"
          alt="Opop Profile"
          width={512}
          height={134}
          className="h-7 w-auto"
        />
      </Link>

      <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        {FOOTER_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm text-white/60 transition hover:text-white"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="flex flex-col items-center gap-1 text-xs text-white/40">
        <p>© {year} Opop Profile. Todos os direitos reservados.</p>
        <p>
          Desenvolvido por{" "}
          <a
            href="https://wa.me/5547996848876"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-white/60 underline decoration-white/30 underline-offset-2 transition hover:text-white"
          >
            Joel Germano
          </a>
        </p>
      </div>
    </footer>
  );
}
