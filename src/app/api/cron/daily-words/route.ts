import { NextResponse } from "next/server";
import { sql, ensureSchema, dbEnabled } from "@/lib/db";
import { getDailyWords } from "@/lib/words";
import { sendDailyWords } from "@/lib/email";

export const maxDuration = 300;

// Vercel Cron isse roz call karta hai. CRON_SECRET set ho to Vercel
// use Bearer token ke roop me bhejta hai — hum verify karte hain.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  if (!dbEnabled) return NextResponse.json({ error: "DB not configured" }, { status: 503 });

  await ensureSchema();
  const subscribers = (await sql!`SELECT email FROM users WHERE daily_email = true`) as {
    email: string;
  }[];

  const words = getDailyWords();
  let sent = 0;
  const failed: string[] = [];

  for (const { email } of subscribers) {
    try {
      await sendDailyWords(email, words);
      sent++;
    } catch (e) {
      console.error("[cron] send failed for", email, e);
      failed.push(email);
    }
  }

  return NextResponse.json({ subscribers: subscribers.length, sent, failed: failed.length });
}
