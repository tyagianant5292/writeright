"use client";

import { useRef, useState } from "react";
import { useAuth } from "./AuthProvider";

type SpeechResult = {
  transcript: string;
  pronunciationScore: number;
  fluencyScore: number;
  overall: number;
  feedback: string;
  wordTips: { word: string; issue: string; tip: string }[];
};

const PROMPTS = [
  "I usually wake up early and go for a walk before work.",
  "Last weekend, I visited my friend and we watched a movie together.",
  "Learning a new language takes patience, practice and confidence.",
];

function color(score: number) {
  if (score >= 80) return "var(--good)";
  if (score >= 60) return "var(--warn)";
  return "var(--bad)";
}

export default function Speaking() {
  const { openLogin } = useAuth();
  const [status, setStatus] = useState<"idle" | "recording" | "processing" | "done" | "error">("idle");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SpeechResult | null>(null);
  const [prompt] = useState(() => PROMPTS[Math.floor((Date.now() / 86400000) % PROMPTS.length)]);

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function start() {
    setError("");
    setResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "";
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        void handleStop();
      };
      mediaRef.current = rec;
      rec.start();
      setStatus("recording");
      setSeconds(0);
      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s >= 45) stop(); // auto-stop at 45s
          return s + 1;
        });
      }, 1000);
    } catch {
      setError("Mic access needed. Please allow microphone permission and try again.");
      setStatus("error");
    }
  }

  function stop() {
    if (timerRef.current) clearInterval(timerRef.current);
    mediaRef.current?.state !== "inactive" && mediaRef.current?.stop();
  }

  async function handleStop() {
    setStatus("processing");
    const blob = new Blob(chunksRef.current, { type: mediaRef.current?.mimeType || "audio/webm" });
    const base64 = await blobToBase64(blob);
    try {
      const res = await fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audio: base64, mimeType: blob.type }),
      });
      const json = await res.json();
      if (res.status === 429 && json.needLogin) {
        setError(json.error);
        setStatus("error");
        openLogin();
        return;
      }
      if (!res.ok) throw new Error(json.error ?? "Could not analyze");
      setResult(json.result);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not analyze");
      setStatus("error");
    }
  }

  return (
    <section id="speaking" className="mx-auto mt-20 max-w-3xl">
      <h2 className="font-display text-2xl font-bold sm:text-3xl">🎤 Speaking practice</h2>
      <p className="mt-1 text-muted">
        Read the sentence aloud (or say anything). We&apos;ll score your pronunciation & fluency.
      </p>

      <div className="card mt-6 p-6 text-center">
        <p className="rounded-xl bg-brand/5 px-4 py-3 text-lg font-medium">“{prompt}”</p>

        <div className="mt-6 flex flex-col items-center">
          {status === "recording" ? (
            <>
              <button
                onClick={stop}
                className="relative grid h-20 w-20 place-items-center rounded-full bg-bad text-white"
              >
                <span className="absolute inset-0 animate-ping rounded-full bg-bad/40" />
                <span className="h-6 w-6 rounded bg-white" />
              </button>
              <p className="mt-3 font-mono text-lg text-bad">● {seconds}s — tap to stop</p>
            </>
          ) : status === "processing" ? (
            <div className="flex items-center gap-2 text-muted">
              <svg viewBox="0 0 24 24" className="spin h-6 w-6" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              Listening & scoring your speech…
            </div>
          ) : (
            <button
              onClick={start}
              className="grid h-20 w-20 place-items-center rounded-full bg-brand text-white shadow-lg shadow-brand/30 transition hover:brightness-110"
              aria-label="Start recording"
            >
              <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="2" width="6" height="12" rx="3" />
                <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
              </svg>
            </button>
          )}
          {status !== "recording" && status !== "processing" && (
            <p className="mt-3 text-sm text-muted">Tap the mic and start speaking</p>
          )}
        </div>

        {error && <p className="mt-4 text-sm text-bad">{error}</p>}
      </div>

      {result && status === "done" && (
        <div className="reveal mt-5 space-y-4">
          <div className="card grid grid-cols-3 gap-2 p-6 text-center">
            <ScoreBox label="Overall" value={result.overall} />
            <ScoreBox label="Pronunciation" value={result.pronunciationScore} />
            <ScoreBox label="Fluency" value={result.fluencyScore} />
          </div>

          <div className="card p-6">
            <h3 className="text-sm font-semibold text-muted">We heard you say</h3>
            <p className="mt-1 text-lg">“{result.transcript}”</p>
            <p className="mt-4 rounded-xl bg-brand/5 p-4">{result.feedback}</p>
          </div>

          {result.wordTips.length > 0 && (
            <div className="card p-6">
              <h3 className="font-display text-lg font-bold">Words to work on</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {result.wordTips.map((w, i) => (
                  <div key={i} className="rounded-xl border border-border p-4">
                    <p className="font-semibold">{w.word}</p>
                    <p className="text-sm text-muted">{w.issue}</p>
                    <p className="mt-1 text-sm text-brand">👉 {w.tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function ScoreBox({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="font-display text-3xl font-extrabold" style={{ color: color(value) }}>
        {value}
      </div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
