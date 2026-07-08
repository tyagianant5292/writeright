import { NextResponse } from "next/server";
import { sql, ensureSchema, dbEnabled } from "@/lib/db";
import { generateCode, normalizeEmail } from "@/lib/auth";
import { sendLoginCode } from "@/lib/email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  if (!dbEnabled) {
    return NextResponse.json({ error: "Login is not configured." }, { status: 503 });
  }
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const email = normalizeEmail(body.email ?? "");
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }

  try {
    await ensureSchema();
    const code = generateCode();
    await sql!`DELETE FROM login_codes WHERE email = ${email}`;
    await sql!`INSERT INTO login_codes (email, code, expires_at)
               VALUES (${email}, ${code}, now() + interval '10 minutes')`;
    await sendLoginCode(email, code);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[request-code] failed:", err);
    return NextResponse.json({ error: "Could not send code. Try again." }, { status: 502 });
  }
}
