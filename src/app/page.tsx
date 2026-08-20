import Link from "next/link";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export default function Home() {
  return (
    <div className="flex flex-1 min-h-screen overflow-x-hidden bg-[#2A2A2A]">
      <div className="hidden md:block flex-1 bg-[#2A2A2A]" />

      <main
        className="flex w-full flex-col items-center justify-center gap-8 overflow-x-hidden px-6 py-10 text-center md:w-120 md:flex-none border-x border-white/10 bg-[#2A2A2A]"
        style={{
          paddingTop: "max(2.5rem, env(safe-area-inset-top))",
          paddingBottom: "max(2.5rem, env(safe-area-inset-bottom))",
        }}
      >
        <div>
          <h1 className="font-heading text-3xl font-normal tracking-wide text-white">
            {SITE_NAME}
          </h1>
          <p className="mt-4 text-lg leading-snug text-white/60">
            {SITE_DESCRIPTION}
          </p>
        </div>

        <Link
          href="/login"
          className="flex h-14 w-full max-w-xs items-center justify-center gap-2 rounded-full bg-brand text-base font-semibold text-black transition active:scale-95 hover:bg-brand-light"
        >
          Entrar
        </Link>
      </main>

      <div className="hidden md:block flex-1 bg-[#2A2A2A]" />
    </div>
  );
}
