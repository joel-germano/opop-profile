"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera, Crown, Home, LogOut, Menu, Settings, User, X } from "lucide-react";
import { logoutAction } from "@/app/painel/actions";

type PanelUser = {
  name: string;
  username: string;
  photoUrl: string;
  plan: "free" | "premium";
};

export function PanelShell({
  user,
  children,
}: {
  user: PanelUser;
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { href: "/painel", label: "Início", icon: Home },
    { href: `/${user.username}`, label: "Criar arte", icon: Camera },
    { href: "/painel/configuracoes", label: "Molduras", icon: Settings },
    { href: "/painel/perfil", label: "Meu perfil", icon: User },
    ...(user.plan === "premium"
      ? []
      : [{ href: "/painel/checkout", label: "Torne-se Premium", icon: Crown }]),
  ];

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = isSidebarOpen ? "hidden" : previousOverflow;
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isSidebarOpen]);

  return (
    <div className="flex flex-1 min-h-screen overflow-x-hidden bg-[#2A2A2A]">
      <div className="hidden md:block flex-1 bg-[#2A2A2A]" />

      <div
        className="flex w-full flex-col overflow-x-hidden md:w-120 md:flex-none border-x border-white/10 bg-[#2A2A2A]"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 px-6 py-6">
          <div className="flex items-center gap-2 rounded-full bg-white/10 py-1.5 pl-1.5 pr-4">
            <Image
              src={user.photoUrl}
              alt={user.name}
              width={40}
              height={40}
              className="h-10 w-10 rounded-full object-cover"
            />
            <span className="max-w-40 truncate text-base font-bold text-white">
              {user.name}
            </span>
            {user.plan === "premium" && (
              <span
                aria-label="Conta Premium"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-decor-lime/20 text-decor-lime"
              >
                <Crown size={13} strokeWidth={2} />
              </span>
            )}
          </div>

          <button
            type="button"
            aria-label="Abrir menu"
            onClick={() => setIsSidebarOpen(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition active:scale-90 hover:bg-white/20"
          >
            <Menu size={20} strokeWidth={1.75} />
          </button>
        </header>

        <main className="flex-1 px-6 pb-10">{children}</main>
      </div>

      <div className="hidden md:block flex-1 bg-[#2A2A2A]" />

      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-[#1c1c1c] md:left-1/2 md:right-auto md:w-120 md:-translate-x-1/2 md:border-x md:border-white/10"
          style={{
            paddingTop: "env(safe-area-inset-top)",
            paddingBottom: "env(safe-area-inset-bottom)",
            paddingLeft: "env(safe-area-inset-left)",
            paddingRight: "env(safe-area-inset-right)",
          }}
        >
          <div className="flex shrink-0 items-center justify-between px-4 py-3 sm:py-4">
            <div className="w-10" />
            <h2 className="text-lg font-bold tracking-tight text-white">
              Menu
            </h2>
            <button
              type="button"
              aria-label="Fechar"
              onClick={() => setIsSidebarOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition active:scale-90 hover:bg-white/20"
            >
              <X size={16} strokeWidth={2} />
            </button>
          </div>

          <nav className="flex flex-1 flex-col gap-2 px-6 pb-8">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-2xl p-3 transition ${
                    active
                      ? "bg-primary/15 text-primary-light"
                      : "bg-white/5 text-white/90 active:bg-white/10"
                  }`}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10">
                    <Icon size={19} strokeWidth={1.75} />
                  </span>
                  <span className="text-sm font-medium">{label}</span>
                </Link>
              );
            })}

            <form action={logoutAction}>
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-2xl bg-white/5 p-3 text-white/90 transition active:bg-white/10"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10">
                  <LogOut size={19} strokeWidth={1.75} />
                </span>
                <span className="text-sm font-medium">Sair</span>
              </button>
            </form>
          </nav>
        </div>
      )}
    </div>
  );
}
