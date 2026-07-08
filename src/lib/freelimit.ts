import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

// Anonymous (bina login) users ke liye roz FREE_LIMIT free AI checks.
// Count ek signed cookie me hota hai (tamper-proof, JWT).

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "dev-insecure-secret-change-me",
);
export const FREE_COOKIE = "wr_free";
export const FREE_LIMIT = 3;

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Aaj tak kitne free checks use hue (anonymous). */
export async function getFreeCount(): Promise<number> {
  const token = (await cookies()).get(FREE_COOKIE)?.value;
  if (!token) return 0;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    if (payload.d !== todayStr()) return 0; // naya din → reset
    return typeof payload.c === "number" ? payload.c : 0;
  } catch {
    return 0;
  }
}

export async function makeFreeToken(count: number): Promise<string> {
  return new SignJWT({ d: todayStr(), c: count })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2d")
    .sign(SECRET);
}

export const freeCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 48,
};
