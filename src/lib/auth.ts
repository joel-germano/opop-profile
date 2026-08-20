import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { connectDB } from "@/lib/db";
import { UserModel, type User } from "@/lib/models/user";
import { PENDING_GOOGLE_SIGNUP_COOKIE, SESSION_COOKIE } from "@/lib/constants";

const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30; // 30 dias
const PENDING_SIGNUP_DURATION_SECONDS = 60 * 10; // 10 min pra completar o cadastro

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET não está definida no .env");
  return new TextEncoder().encode(secret);
}

export async function createSession(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<
  (Omit<User, "passwordHash"> & { _id: string }) | null
> {
  const userId = await getSessionUserId();
  if (!userId) return null;

  await connectDB();
  const user = await UserModel.findById(userId).select("-passwordHash").lean();
  if (!user) return null;

  return { ...user, _id: String(user._id) } as Omit<User, "passwordHash"> & {
    _id: string;
  };
}

type PendingGoogleSignup = { email: string; name: string; googleId: string };

// Guarda os dados verificados do Google entre "detectamos que não tem conta"
// e "usuário terminou de preencher username/whatsapp/foto" — sem isso teria
// que confiar de novo num token vindo do cliente, ou criar a conta pela
// metade antes do cadastro estar completo.
export async function createPendingGoogleSignup(data: PendingGoogleSignup) {
  const token = await new SignJWT(data)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${PENDING_SIGNUP_DURATION_SECONDS}s`)
    .sign(getSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(PENDING_GOOGLE_SIGNUP_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: PENDING_SIGNUP_DURATION_SECONDS,
  });
}

export async function getPendingGoogleSignup(): Promise<PendingGoogleSignup | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(PENDING_GOOGLE_SIGNUP_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (
      typeof payload.email !== "string" ||
      typeof payload.name !== "string" ||
      typeof payload.googleId !== "string"
    ) {
      return null;
    }
    return { email: payload.email, name: payload.name, googleId: payload.googleId };
  } catch {
    return null;
  }
}

export async function clearPendingGoogleSignup() {
  const cookieStore = await cookies();
  cookieStore.delete(PENDING_GOOGLE_SIGNUP_COOKIE);
}
