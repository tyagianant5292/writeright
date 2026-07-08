import { NextResponse } from "next/server";
import { analyzeText } from "@/lib/gemini";
import { getSession } from "@/lib/auth";
import { sql, ensureSchema, dbEnabled } from "@/lib/db";
import { getFreeCount, makeFreeToken, freeCookieOptions, FREE_COOKIE, FREE_LIMIT } from "@/lib/freelimit";

export const maxDuration = 60;

export async function POST(req: Request) {
  let body: { text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const text = (body.text ?? "").trim();
  if (text.length < 3) {
    return NextResponse.json({ error: "Please type at least a few words to analyze." }, { status: 400 });
  }
  if (text.length > 4000) {
    return NextResponse.json({ error: "That's a bit long — please keep it under 4000 characters." }, { status: 400 });
  }

  // Anonymous users: roz FREE_LIMIT free checks. Logged-in = unlimited.
  const session = await getSession();
  let freeUsed = 0;
  if (!session) {
    freeUsed = await getFreeCount();
    if (freeUsed >= FREE_LIMIT) {
      return NextResponse.json(
        {
          error: `You've used your ${FREE_LIMIT} free checks for today. Sign in (free) for unlimited checks and progress tracking.`,
          needLogin: true,
        },
        { status: 429 },
      );
    }
  }

  try {
    const analysis = await analyzeText(text);

    // Logged-in ho to progress save karo. AWAIT zaroori hai — Vercel serverless
    // response ke baad background work suspend kar deta hai, to save miss ho jaata.
    let saved = false;
    if (session && dbEnabled) {
      try {
        await saveProgress(session.userId, analysis.overallScore, analysis.mistakes.map((m) => m.type));
        saved = true;
      } catch (e) {
        console.error("[analyze] save progress failed:", e);
      }
    }

    const freeRemaining = session ? null : Math.max(0, FREE_LIMIT - (freeUsed + 1));
    const res = NextResponse.json({ analysis, saved, freeRemaining });
    if (!session) {
      res.cookies.set(FREE_COOKIE, await makeFreeToken(freeUsed + 1), freeCookieOptions);
    }
    return res;
  } catch (err) {
    console.error("[analyze] failed:", err);
    return NextResponse.json(
      { error: "Could not analyze right now. Please try again in a moment." },
      { status: 502 },
    );
  }
}

async function saveProgress(userId: string, score: number, types: string[]) {
  await ensureSchema();
  await sql!`INSERT INTO analyses (user_id, overall_score, mistake_count)
             VALUES (${userId}, ${score}, ${types.length})`;
  if (types.length > 0) {
    // Ek hi query me saari mistakes insert (UNNEST se).
    await sql!`INSERT INTO mistakes (user_id, type)
               SELECT ${userId}, t FROM UNNEST(${types}::text[]) AS t`;
  }
}
