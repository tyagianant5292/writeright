import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql, ensureSchema, dbEnabled } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ user: null });

  let dailyEmail = false;
  if (dbEnabled) {
    try {
      await ensureSchema();
      const rows = (await sql!`SELECT daily_email FROM users WHERE id = ${session.userId}`) as {
        daily_email: boolean;
      }[];
      dailyEmail = rows[0]?.daily_email ?? false;
    } catch {
      /* ignore */
    }
  }
  return NextResponse.json({ user: { email: session.email, dailyEmail } });
}
