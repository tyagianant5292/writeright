import type { Analysis } from "./gemini";

// ─────────────────────────────────────────────────────────────
//  Text analysis via ANY OpenAI-compatible API.
//  Provider switch karne ke liye SIRF ye 3 env vars badlo — code nahi:
//    AI_TEXT_BASE_URL   e.g. https://model.iamsaif.ai/v1
//    AI_TEXT_API_KEY    e.g. sk-...
//    AI_TEXT_MODEL      e.g. google/gemma-4-31B-it
//  (OpenAI, Groq, OpenRouter, xAI, DeepSeek, local vLLM — sab isi
//   standard pe chalte hain.)
// ─────────────────────────────────────────────────────────────

const BASE_URL = (process.env.AI_TEXT_BASE_URL ?? "").replace(/\/$/, "");
const API_KEY = process.env.AI_TEXT_API_KEY;
const MODEL = process.env.AI_TEXT_MODEL ?? "google/gemma-4-31B-it";

export class TextAIError extends Error {
  status: number;
  rateLimited: boolean;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.rateLimited = status === 429 || status === 503 || status === 500;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const SYSTEM = `You are an expert, encouraging English writing coach for Hindi-speaking learners in India.
Analyze the user's English text and return ONLY a JSON object (no markdown, no extra text) with EXACTLY this shape:
{
  "overallScore": <int 0-100 overall English quality>,
  "level": <"Beginner"|"Elementary"|"Intermediate"|"Upper-Intermediate"|"Advanced">,
  "summary": <1-2 warm sentences; a short Hindi phrase is welcome>,
  "categories": [
    {"key":"grammar","name":"Grammar","score":<0-100>,"note":<max 12 words>},
    {"key":"vocabulary","name":"Vocabulary","score":<0-100>,"note":<...>},
    {"key":"sentence_structure","name":"Sentence Structure","score":<0-100>,"note":<...>},
    {"key":"spelling_punctuation","name":"Spelling & Punctuation","score":<0-100>,"note":<...>},
    {"key":"pronunciation","name":"Pronunciation","score":<0-100>,"note":<...>}
  ],
  "mistakes": [
    {"original":<wrong phrase>,"correction":<fixed phrase>,"type":<short label e.g. "Verb Tense","Article","Spelling">,"explanation":<1 short sentence with the rule; a tiny Hindi hint in brackets is welcome>}
  ],
  "pronunciationTips": [
    {"word":<tricky word from text>,"phonetic":<simple respelling like "KER-nul">,"tip":<how to say it>}
  ],
  "improved": <corrected natural version of the WHOLE text, same meaning and tone>
}
Include ALL five categories in that exact order. List every real mistake. pronunciationTips: 0-4 items.
If the text is already perfect, return empty "mistakes" and high scores. Never invent errors that aren't there.`;

async function chat(text: string): Promise<string> {
  if (!BASE_URL || !API_KEY) throw new TextAIError("Text AI is not configured (missing env)", 500);

  const maxAttempts = 3;
  let lastStatus = 500;
  let lastDetail = "";

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: `Analyze this text:\n\n"""${text}"""` },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content) throw new TextAIError("Empty response from model", 502);
      return content;
    }

    lastStatus = res.status;
    lastDetail = await res.text().catch(() => "");
    // Sirf server errors (500/503) pe retry; 429 pe turant fail.
    if ((res.status === 500 || res.status === 503) && attempt < maxAttempts) {
      await sleep(attempt * 900);
      continue;
    }
    break;
  }
  throw new TextAIError(`Text AI error ${lastStatus}: ${lastDetail.slice(0, 200)}`, lastStatus);
}

/** Model output se JSON nikaalo (code fences / extra text ke bawajood). */
function extractJson(raw: string): string {
  let s = raw.trim();
  // ```json ... ``` fences hata do
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  // pehle { se aakhri } tak
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) s = s.slice(start, end + 1);
  return s;
}

const CATS = [
  ["grammar", "Grammar"],
  ["vocabulary", "Vocabulary"],
  ["sentence_structure", "Sentence Structure"],
  ["spelling_punctuation", "Spelling & Punctuation"],
  ["pronunciation", "Pronunciation"],
] as const;

/** Kachra/aadhe response se bhi UI na toote — normalize + guard. */
function normalize(obj: Record<string, unknown>): Analysis {
  const num = (v: unknown, d = 0) => {
    const n = Math.round(Number(v));
    return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : d;
  };
  const str = (v: unknown, d = "") => (typeof v === "string" ? v : d);
  const arr = (v: unknown) => (Array.isArray(v) ? v : []);

  const rawCats = arr(obj.categories) as Record<string, unknown>[];
  const byKey = new Map(rawCats.map((c) => [String(c.key), c]));
  const categories = CATS.map(([key, name]) => {
    const c = byKey.get(key) ?? rawCats.find((x) => String(x.name) === name) ?? {};
    return { key, name, score: num(c.score), note: str(c.note) };
  });

  return {
    overallScore: num(obj.overallScore),
    level: str(obj.level, "—"),
    summary: str(obj.summary, "Here's your feedback."),
    categories,
    mistakes: arr(obj.mistakes)
      .map((m: Record<string, unknown>) => ({
        original: str(m.original),
        correction: str(m.correction),
        type: str(m.type, "Correction"),
        explanation: str(m.explanation),
      }))
      .filter((m) => m.original || m.correction),
    pronunciationTips: arr(obj.pronunciationTips)
      .map((p: Record<string, unknown>) => ({
        word: str(p.word),
        phonetic: str(p.phonetic),
        tip: str(p.tip),
      }))
      .filter((p) => p.word),
    improved: str(obj.improved),
  };
}

export async function analyzeText(text: string): Promise<Analysis> {
  const raw = await chat(text);
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(extractJson(raw));
  } catch {
    throw new TextAIError("Model returned invalid JSON", 502);
  }
  return normalize(parsed);
}
