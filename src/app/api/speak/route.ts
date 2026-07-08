import { NextResponse } from "next/server";
import { analyzeSpeech } from "@/lib/gemini";
import { getSession } from "@/lib/auth";
import { getFreeCount, makeFreeToken, freeCookieOptions, FREE_COOKIE, FREE_LIMIT } from "@/lib/freelimit";

export const maxDuration = 60;

const ALLOWED = ["audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg", "audio/wav", "audio/aac", "audio/aiff"];

export async function POST(req: Request) {
  let body: { audio?: string; mimeType?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const audio = body.audio ?? "";
  // mime from the browser may include codecs, e.g. "audio/webm;codecs=opus"
  const mimeType = (body.mimeType ?? "audio/webm").split(";")[0].trim();

  if (!audio || audio.length < 100) {
    return NextResponse.json({ error: "Recording too short. Please speak a full sentence." }, { status: 400 });
  }
  if (audio.length > 8_000_000) {
    return NextResponse.json({ error: "Recording too long. Keep it under ~1 minute." }, { status: 400 });
  }
  if (!ALLOWED.includes(mimeType)) {
    return NextResponse.json({ error: `Unsupported audio format (${mimeType}).` }, { status: 400 });
  }

  // Anonymous users: same daily free pool as text checks.
  const session = await getSession();
  let freeUsed = 0;
  if (!session) {
    freeUsed = await getFreeCount();
    if (freeUsed >= FREE_LIMIT) {
      return NextResponse.json(
        {
          error: `You've used your ${FREE_LIMIT} free checks for today. Sign in (free) for unlimited practice.`,
          needLogin: true,
        },
        { status: 429 },
      );
    }
  }

  try {
    const result = await analyzeSpeech(audio, mimeType);
    const res = NextResponse.json({ result });
    if (!session) {
      res.cookies.set(FREE_COOKIE, await makeFreeToken(freeUsed + 1), freeCookieOptions);
    }
    return res;
  } catch (err) {
    console.error("[speak] failed:", err);
    return NextResponse.json({ error: "Could not analyze your speech. Please try again." }, { status: 502 });
  }
}
