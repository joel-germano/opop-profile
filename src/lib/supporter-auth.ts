import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { connectDB } from "@/lib/db";
import { SupporterModel, type Supporter } from "@/lib/models/supporter";
import { SUPPORTER_SESSION_COOKIE } from "@/lib/constants";

const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 365; // 1 ano — desbloqueio é vitalício

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET não está definida no .env");
  return new TextEncoder().encode(secret);
}

export async function createSupporterSession(supporterId: string) {
  const token = await new SignJWT({ sub: supporterId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(SUPPORTER_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

async function getSupporterIdFromSession(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SUPPORTER_SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export async function getCurrentSupporter(): Promise<
  (Omit<Supporter, "passwordHash"> & { _id: string }) | null
> {
  const supporterId = await getSupporterIdFromSession();
  if (!supporterId) return null;

  await connectDB();
  const supporter = await SupporterModel.findById(supporterId).select("-passwordHash").lean();
  if (!supporter) return null;

  return { ...supporter, _id: String(supporter._id) } as Omit<Supporter, "passwordHash"> & {
    _id: string;
  };
}
