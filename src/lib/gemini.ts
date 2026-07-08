// Gemini helper — English text ko analyze karta hai aur structured JSON deta hai.
// GEMINI_API_KEY .env se aati hai. Native fetch use hota hai (koi SDK nahi).

const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
const API_KEY = process.env.GEMINI_API_KEY;

export const CATEGORY_KEYS = [
  "grammar",
  "vocabulary",
  "sentence_structure",
  "spelling_punctuation",
  "pronunciation",
] as const;

export type Analysis = {
  overallScore: number;
  level: string;
  summary: string;
  categories: {
    key: string;
    name: string;
    score: number;
    note: string;
  }[];
  mistakes: {
    original: string;
    correction: string;
    type: string;
    explanation: string;
  }[];
  pronunciationTips: {
    word: string;
    phonetic: string;
    tip: string;
  }[];
  improved: string;
};

export class GeminiError extends Error {
  status: number;
  rateLimited: boolean;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.rateLimited = status === 429 || status === 503 || status === 500;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Gemini generateContent call with retry on transient (429/503/500) errors. */
async function callGemini(body: object): Promise<string> {
  if (!API_KEY) throw new GeminiError("GEMINI_API_KEY is not set", 500);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
  const maxAttempts = 3;
  let lastDetail = "";
  let lastStatus = 500;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "x-goog-api-key": API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json();
      const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!raw) throw new GeminiError("Empty response from Gemini", 502);
      return raw;
    }

    lastStatus = res.status;
    lastDetail = await res.text().catch(() => "");
    // Sirf server errors (503/500) pe retry. 429 = quota exceeded — retry se
    // quota aur jaldi khatam hoga, isliye turant fail karo (clear message ke saath).
    const transient = res.status === 503 || res.status === 500;
    if (transient && attempt < maxAttempts) {
      await sleep(attempt * 900); // 0.9s, 1.8s backoff
      continue;
    }
    break;
  }

  throw new GeminiError(`Gemini error ${lastStatus}: ${lastDetail.slice(0, 200)}`, lastStatus);
}

// ── Speaking / pronunciation analysis (audio in) ──────────────
export type SpeechResult = {
  transcript: string;
  pronunciationScore: number;
  fluencyScore: number;
  overall: number;
  feedback: string;
  wordTips: { word: string; issue: string; tip: string }[];
};

const speechSchema = {
  type: "object",
  properties: {
    transcript: { type: "string" },
    pronunciationScore: { type: "integer" },
    fluencyScore: { type: "integer" },
    overall: { type: "integer" },
    feedback: { type: "string" },
    wordTips: {
      type: "array",
      items: {
        type: "object",
        properties: {
          word: { type: "string" },
          issue: { type: "string" },
          tip: { type: "string" },
        },
        required: ["word", "issue", "tip"],
      },
    },
  },
  required: ["transcript", "pronunciationScore", "fluencyScore", "overall", "feedback", "wordTips"],
};

const SPEECH_SYSTEM = `You are an English pronunciation and fluency coach for Hindi-speaking learners.
Listen to the audio of the user speaking English and return JSON:
- transcript: exactly what you heard them say.
- pronunciationScore: 0-100 (clarity of individual sounds/words).
- fluencyScore: 0-100 (pace, pauses, smoothness).
- overall: 0-100 overall speaking quality.
- feedback: 2-3 warm, specific sentences. Mention what was good and what to improve. A tiny Hindi hint is welcome.
- wordTips: up to 4 words they mispronounced or could improve. Each: word, issue (what was off), tip (how to say it, simple respelling).
Be encouraging and honest. If audio is unclear or empty, say so in feedback and give low scores.`;

export async function analyzeSpeech(base64Audio: string, mimeType: string): Promise<SpeechResult> {
  const raw = await callGemini({
    systemInstruction: { parts: [{ text: SPEECH_SYSTEM }] },
    contents: [
      {
        parts: [
          { text: "Evaluate this spoken English audio." },
          { inline_data: { mime_type: mimeType, data: base64Audio } },
        ],
      },
    ],
    generationConfig: { temperature: 0.3, responseMimeType: "application/json", responseSchema: speechSchema },
  });
  return JSON.parse(raw) as SpeechResult;
}
