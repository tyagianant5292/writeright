import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql, ensureSchema, dbEnabled } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  if (!dbEnabled) return NextResponse.json({ error: "DB not configured" }, { status: 503 });

  await ensureSchema();
  const uid = session.userId;

  const [totals] = (await sql!`
    SELECT COUNT(*)::int AS count,
           COALESCE(ROUND(AVG(overall_score))::int, 0) AS avg_score
    FROM analyses WHERE user_id = ${uid}
  `) as { count: number; avg_score: number }[];

  const weakAreas = (await sql!`
    SELECT type, COUNT(*)::int AS count
    FROM mistakes WHERE user_id = ${uid}
    GROUP BY type ORDER BY count DESC LIMIT 6
  `) as { type: string; count: number }[];

  const recent = (await sql!`
    SELECT overall_score AS score, created_at
    FROM analyses WHERE user_id = ${uid}
    ORDER BY created_at DESC LIMIT 10
  `) as { score: number; created_at: string }[];

  // Distinct active days (for streak) — last 60 days.
  // Neon `date` columns aa sakti hain Date object ya string ke roop me.
  const days = (await sql!`
    SELECT DISTINCT to_char((created_at AT TIME ZONE 'UTC')::date, 'YYYY-MM-DD') AS day
    FROM analyses WHERE user_id = ${uid}
    ORDER BY day DESC LIMIT 60
  `) as { day: string }[];

  const streak = computeStreak(days.map((d) => String(d.day)));

  return NextResponse.json({
    totalChecks: totals?.count ?? 0,
    avgScore: totals?.avg_score ?? 0,
    streak,
    weakAreas,
    recent: recent.reverse(),
  });
}

/** Consecutive-day streak counting back from today (or yesterday). */
function computeStreak(dayStrings: string[]): number {
  const days = new Set(dayStrings.map((d) => d.slice(0, 10)));
  if (days.size === 0) return 0;

  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const today = new Date();
  const todayStr = fmt(today);
  const yest = new Date(today);
  yest.setUTCDate(yest.getUTCDate() - 1);

  // Streak tabhi count karo jab aaj ya kal activity ho
  let cursor = new Date(today);
  if (!days.has(todayStr)) {
    if (!days.has(fmt(yest))) return 0;
    cursor = yest;
  }
  let streak = 0;
  while (days.has(fmt(cursor))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}
