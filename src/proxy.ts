import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { ADMIN_SESSION_COOKIE } from "@/lib/constants";

async function isValidSession(request: NextRequest, cookieName: string): Promise<boolean> {
  const token = request.cookies.get(cookieName)?.value;
  if (!token) return false;

  try {
    await jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET));
    return true;
  } catch {
    return false;
  }
}

// /painel não passa mais por aqui: o fluxo agora deixa a pessoa preencher
// tudo (moldura, detalhes, legenda) sem conta, e só pede login/cadastro no
// fim, ao "Publicar" (ver PainelSteps.tsx). As rotas que exigem sessão de
// verdade (ex: as actions em painel/actions.ts) continuam checando
// `getCurrentUser()` cada uma por conta própria.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login") return NextResponse.next();
  if (await isValidSession(request, ADMIN_SESSION_COOKIE)) return NextResponse.next();
  return NextResponse.redirect(new URL("/admin/login", request.url));
}

export const config = {
  matcher: ["/admin/:path*"],
};
