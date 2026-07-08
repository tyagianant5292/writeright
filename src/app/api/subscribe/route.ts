import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql, ensureSchema, dbEnabled } from "@/lib/db";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  if (!dbEnabled) return NextResponse.json({ error: "DB not configured" }, { status: 503 });

  let body: { enabled?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const enabled = Boolean(body.enabled);

  await ensureSchema();
  await sql!`UPDATE users SET daily_email = ${enabled} WHERE id = ${session.userId}`;
  return NextResponse.json({ ok: true, dailyEmail: enabled });
}
