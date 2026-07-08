"use client";

import { useState } from "react";
import type { Analysis } from "@/lib/gemini";
import { useAuth } from "./AuthProvider";

const SAMPLES = [
  "Yesterday I go to market and buyed some vegetables for my mother.",
  "He don't have no time for meeting because he is very busy person.",
  "I am working in this company since three years and learn many things.",
];

function scoreColor(score: number) {
  if (score >= 80) return "var(--good)";
  if (score >= 60) return "var(--warn)";
  return "var(--bad)";
}

export default function Analyzer() {
  const { user, openLogin } = useAuth();
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<Analysis | null>(null);
  const [copied, setCopied] = useState(false);
  const [freeRemaining, setFreeRemaining] = useState<number | null>(null);
  const [limitHit, setLimitHit] = useState(false);

  async function analyze() {
    if (text.trim().length < 3) return;
    setStatus("loading");
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const json = await res.json();
      if (res.status === 429 && json.needLogin) {
        setLimitHit(true);
        setError(json.error);
        setStatus("error");
        openLogin();
        return;
      }
      if (!res.ok) throw new Error(json.error ?? "Something went wrong");
      setResult(json.analysis);
      if (typeof json.freeRemaining === "number") setFreeRemaining(json.freeRemaining);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  const chars = text.length;

  return (
    <div className="mx-auto max-w-3xl">
      {/* Input */}
      <div className="card p-5 sm:p-6">
        <label htmlFor="text" className="text-sm font-semibold text-muted">
          Write anything in English
        </label>
        <textarea
          id="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") analyze();
          }}
          rows={5}
          maxLength={4000}
          placeholder="e.g. Yesterday I go to market and buyed some vegetables…"
          className="mt-2 w-full resize-y rounded-xl border border-border bg-background/60 px-4 py-3 text-base outline-none transition-colors placeholder:text-muted/60 focus:border-brand"
        />

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <span>Try:</span>
            {SAMPLES.map((s, i) => (
              <button
                key={i}
                onClick={() => setText(s)}
                className="rounded-full border border-border bg-background px-2.5 py-1 transition-colors hover:border-brand hover:text-brand"
              >
                Sample {i + 1}
              </button>
            ))}
          </div>
          <span className="text-xs text-muted">{chars}/4000</span>
        </div>

        <button
          onClick={analyze}
          disabled={status === "loading" || text.trim().length < 3}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3.5 font-semibold text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {status === "loading" ? (
            <>
              <Spinner /> Analyzing…
            </>
          ) : (
            <>Check my English ✨</>
          )}
        </button>
        <span className="ml-3 hidden text-xs text-muted sm:inline">
          or press ⌘/Ctrl + Enter
        </span>

        {!user && freeRemaining !== null && !limitHit && (
          <p className="mt-3 text-xs text-muted">
            {freeRemaining > 0
              ? `${freeRemaining} free check${freeRemaining === 1 ? "" : "s"} left today · `
              : "That was your last free check today · "}
            <button onClick={openLogin} className="font-semibold text-brand hover:underline">
              Sign in
            </button>{" "}
            for unlimited + progress tracking.
          </p>
        )}
      </div>

      {status === "error" && (
        <div className="mt-4 rounded-xl border border-bad/30 bg-bad/5 px-4 py-3 text-sm text-bad">
          <p>{error}</p>
          {limitHit && (
            <button
              onClick={openLogin}
              className="mt-2 rounded-lg bg-brand px-4 py-2 font-semibold text-white transition hover:brightness-110"
            >
              Sign in — it&apos;s free
            </button>
          )}
        </div>
      )}

      {result && status === "done" && <Results r={result} copied={copied} setCopied={setCopied} />}
    </div>
  );
}

function Results({
  r,
  copied,
  setCopied,
}: {
  r: Analysis;
  copied: boolean;
  setCopied: (v: boolean) => void;
}) {
  return (
    <div className="reveal mt-6 space-y-5">
      {/* Overall */}
      <div className="card flex flex-col items-center gap-5 p-6 sm:flex-row sm:items-center">
        <ScoreRing score={r.overallScore} />
        <div className="text-center sm:text-left">
          <span className="inline-block rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
            {r.level}
          </span>
          <p className="mt-2 text-lg font-medium">{r.summary}</p>
        </div>
      </div>

      {/* Category scores */}
      <div className="card p-6">
        <h3 className="font-display text-lg font-bold">Your scores</h3>
        <div className="mt-4 space-y-4">
          {r.categories.map((c) => (
            <div key={c.key}>
              <div className="flex items-baseline justify-between">
                <span className="font-medium">{c.name}</span>
                <span className="text-sm font-bold" style={{ color: scoreColor(c.score) }}>
                  {c.score}
                </span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${c.score}%`, background: scoreColor(c.score) }}
                />
              </div>
              {c.note && <p className="mt-1 text-xs text-muted">{c.note}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Mistakes */}
      <div className="card p-6">
        <h3 className="font-display text-lg font-bold">
          {r.mistakes.length > 0
            ? `Corrections (${r.mistakes.length})`
            : "Corrections"}
        </h3>
        {r.mistakes.length === 0 ? (
          <p className="mt-3 rounded-xl bg-good/10 px-4 py-3 text-good">
            🎉 No mistakes found — great writing!
          </p>
        ) : (
          <ul className="mt-4 space-y-4">
            {r.mistakes.map((m, i) => (
              <li key={i} className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="rounded bg-bad/10 px-2 py-0.5 text-bad line-through decoration-bad/60">
                    {m.original}
                  </span>
                  <span className="text-muted">→</span>
                  <span className="rounded bg-good/10 px-2 py-0.5 font-semibold text-good">
                    {m.correction}
                  </span>
                  <span className="ml-auto rounded-full border border-border px-2 py-0.5 text-xs text-muted">
                    {m.type}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted">{m.explanation}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Pronunciation tips */}
      {r.pronunciationTips.length > 0 && (
        <div className="card p-6">
          <h3 className="font-display text-lg font-bold">🗣️ Pronunciation tips</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {r.pronunciationTips.map((p, i) => (
              <div key={i} className="rounded-xl border border-border p-4">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold">{p.word}</span>
                  <span className="rounded bg-brand/10 px-2 py-0.5 text-sm text-brand">
                    {p.phonetic}
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-muted">{p.tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Improved version */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold">✅ Improved version</h3>
          <button
            onClick={() => {
              navigator.clipboard.writeText(r.improved);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:border-brand hover:text-brand"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <p className="mt-3 whitespace-pre-wrap rounded-xl bg-good/5 p-4 leading-relaxed">
          {r.improved}
        </p>
      </div>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const R = 42;
  const C = 2 * Math.PI * R;
  const dash = (score / 100) * C;
  const color = scoreColor(score);
  return (
    <div className="relative h-28 w-28 shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={R} fill="none" stroke="var(--border)" strokeWidth="9" />
        <circle
          cx="50"
          cy="50"
          r={R}
          fill="none"
          stroke={color}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${C}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-3xl font-extrabold" style={{ color }}>
          {score}
        </span>
        <span className="text-xs text-muted">/ 100</span>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg viewBox="0 0 24 24" className="spin h-5 w-5" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
