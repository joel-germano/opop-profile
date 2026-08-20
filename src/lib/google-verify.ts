import "server-only";
import { createRemoteJWKSet, jwtVerify } from "jose";

const GOOGLE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs")
);

export async function verifyGoogleIdToken(
  idToken: string
): Promise<{ email: string; name: string; googleId: string } | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error("GOOGLE_CLIENT_ID não está definida no .env");

  try {
    const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      audience: clientId,
    });

    if (typeof payload.email !== "string" || typeof payload.sub !== "string") return null;
    if (payload.email_verified === false) return null;

    return {
      email: payload.email.toLowerCase(),
      name: typeof payload.name === "string" ? payload.name : payload.email,
      googleId: payload.sub,
    };
  } catch {
    return null;
  }
}
