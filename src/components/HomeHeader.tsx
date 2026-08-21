import Image from "next/image";
import Link from "next/link";

export function HomeHeader() {
  return (
    <div className="flex items-center justify-between bg-decor-coral px-6 py-6">
      <Link href="/">
        <Image
          src="/logo-opop.png"
          alt="Opop Profile"
          width={512}
          height={134}
          priority
          className="h-9 w-auto"
        />
      </Link>
      <Link
        href="/login"
        className="rounded-full bg-danger px-5 py-2 text-sm font-semibold text-white transition active:scale-95 hover:bg-danger-dark"
      >
        Entrar
      </Link>
    </div>
  );
}
