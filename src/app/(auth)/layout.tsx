import Image from "next/image";
import Link from "next/link";
import { BackButton } from "@/components/BackButton";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 min-h-screen overflow-x-hidden bg-[#2A2A2A]">
      <div className="hidden md:block flex-1 bg-[#2A2A2A]" />

      <main
        className="flex w-full flex-col items-center gap-5 overflow-x-hidden px-6 py-5 md:w-120 md:flex-none border-x border-white/10 bg-[#2A2A2A]"
        style={{
          paddingTop: "max(1.25rem, env(safe-area-inset-top))",
          paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))",
        }}
      >
        <div className="flex w-full items-center">
          <BackButton />
        </div>

        <Link href="/">
          <Image
            src="/logo-opop-v3.png"
            alt="Opop Profile"
            width={512}
            height={134}
            className="h-8 w-auto"
          />
        </Link>

        {children}
      </main>

      <div className="hidden md:block flex-1 bg-[#2A2A2A]" />
    </div>
  );
}
