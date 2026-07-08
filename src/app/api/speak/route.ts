import { NextResponse } from "next/server";
import { analyzeSpeech } from "@/lib/gemini";

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

  try {
    const result = await analyzeSpeech(audio, mimeType);
    return NextResponse.json({ result });
  } catch (err) {
    console.error("[speak] failed:", err);
    return NextResponse.json({ error: "Could not analyze your speech. Please try again." }, { status: 502 });
  }
}
