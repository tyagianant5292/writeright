import { NextResponse } from "next/server";
import { sql, ensureSchema, upsertUser, dbEnabled } from "@/lib/db";
import { createSessionToken, sessionCookieOptions, SESSION_COOKIE, normalizeEmail } from "@/lib/auth";

export async function POST(req: Request) {
  if (!dbEnabled) {
    return NextResponse.json({ error: "Login is not configured." }, { status: 503 });
  }
  let body: { email?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const email = normalizeEmail(body.email ?? "");
  const code = (body.code ?? "").trim();
  if (!email || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "Enter the 6-digit code." }, { status: 400 });
  }

  try {
    await ensureSchema();
    const rows = (await sql!`
      SELECT code FROM login_codes
      WHERE email = ${email} AND code = ${code} AND expires_at > now()
      LIMIT 1
    `) as { code: string }[];

    if (rows.length === 0) {
      return NextResponse.json({ error: "Invalid or expired code." }, { status: 401 });
    }

    await sql!`DELETE FROM login_codes WHERE email = ${email}`;
    const user = await upsertUser(email);
    const token = await createSessionToken({ userId: user.id, email: user.email });

    const res = NextResponse.json({
      ok: true,
      user: { email: user.email, dailyEmail: user.daily_email },
    });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
    return res;
  } catch (err) {
    console.error("[verify] failed:", err);
    return NextResponse.json({ error: "Could not verify. Try again." }, { status: 502 });
  }
}
