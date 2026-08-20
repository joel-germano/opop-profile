"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BadgeDollarSign, Image as ImageIcon, LogOut, Receipt, Users, Vote } from "lucide-react";
import { logoutAdminAction } from "@/app/admin/actions";

const NAV_ITEMS = [
  { href: "/admin", label: "Vendas", icon: BadgeDollarSign },
  { href: "/admin/usuarios", label: "Usuários", icon: Users },
  { href: "/admin/molduras", label: "Molduras", icon: ImageIcon },
  { href: "/admin/pagamentos", label: "Pagamentos", icon: Receipt },
  { href: "/admin/presidenciaveis", label: "Presidenciáveis", icon: Vote },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#1c1c1c]">
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <span className="font-heading text-xl font-normal tracking-wide text-white">
          Admin
        </span>
        <form action={logoutAdminAction}>
          <button
            type="submit"
            className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition active:scale-95 hover:bg-white/20"
          >
            <LogOut size={15} strokeWidth={1.75} />
            Sair
          </button>
        </form>
      </header>

      <nav className="flex gap-1 overflow-x-auto border-b border-white/10 px-6">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${
                active
                  ? "border-brand text-brand-light"
                  : "border-transparent text-white/60 hover:text-white/90"
              }`}
            >
              <Icon size={16} strokeWidth={1.75} />
              {label}
            </Link>
          );
        })}
      </nav>

      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
