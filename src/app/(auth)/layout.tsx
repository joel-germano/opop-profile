import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 min-h-screen overflow-x-hidden bg-[#2A2A2A]">
      <div className="hidden md:block flex-1 bg-[#2A2A2A]" />

      <main
        className="flex w-full flex-col items-center gap-8 overflow-x-hidden px-6 py-10 md:w-120 md:flex-none border-x border-white/10 bg-[#2A2A2A]"
        style={{
          paddingTop: "max(2.5rem, env(safe-area-inset-top))",
          paddingBottom: "max(2.5rem, env(safe-area-inset-bottom))",
        }}
      >
        <Link
          href="/"
          className="font-heading text-2xl font-normal tracking-wide text-white"
        >
          {SITE_NAME}
        </Link>

        {children}
      </main>

      <div className="hidden md:block flex-1 bg-[#2A2A2A]" />
    </div>
  );
}
