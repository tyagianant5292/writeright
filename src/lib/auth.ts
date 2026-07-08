import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "dev-insecure-secret-change-me",
);
export const SESSION_COOKIE = "wr_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export type Session = { userId: string; email: string };

export async function createSessionToken(s: Session): Promise<string> {
  return new SignJWT({ email: s.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(s.userId)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SECRET);
}

/** Reads the session cookie (server-side). Returns null if not logged in. */
export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    if (!payload.sub || typeof payload.email !== "string") return null;
    return { userId: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: MAX_AGE,
};

/** 6-digit login code. */
export function generateCode(): string {
  // crypto is available in Node runtime
  const n = Math.floor(100000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 900000));
  return String(n);
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
