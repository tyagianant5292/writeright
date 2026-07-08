"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";

type ProgressData = {
  totalChecks: number;
  avgScore: number;
  streak: number;
  weakAreas: { type: string; count: number }[];
  recent: { score: number; created_at: string }[];
};

export default function Progress() {
  const { user, setUser } = useAuth();
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingSub, setSavingSub] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetch("/api/progress")
      .then((r) => r.json())
      .then((d) => setData(d.error ? null : d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  async function toggleSub() {
    if (!user) return;
    setSavingSub(true);
    const next = !user.dailyEmail;
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      });
      if (res.ok) setUser({ ...user, dailyEmail: next });
    } finally {
      setSavingSub(false);
    }
  }

  return (
    <section id="progress" className="mx-auto mt-20 max-w-4xl">
      <h2 className="font-display text-2xl font-bold sm:text-3xl">📊 Your progress</h2>
      <p className="mt-1 text-muted">Keep practising daily — you can literally see yourself improve.</p>

      {loading ? (
        <div className="mt-6 grid animate-pulse gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card h-28" />
          ))}
        </div>
      ) : data && data.totalChecks > 0 ? (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <Stat label="Day streak" value={`${data.streak}`} suffix="🔥" accent />
            <Stat label="Checks done" value={`${data.totalChecks}`} />
            <Stat label="Average score" value={`${data.avgScore}`} suffix="/100" />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {/* Weak areas */}
            <div className="card p-6">
              <h3 className="font-display text-lg font-bold">Where you slip most</h3>
              {data.weakAreas.length === 0 ? (
                <p className="mt-3 text-muted">No mistakes tracked yet — nice!</p>
              ) : (
                <>
                  <p className="mt-1 text-sm text-muted">
                    You often make <span className="font-semibold text-foreground">{data.weakAreas[0].type}</span> mistakes. Focus there!
                  </p>
                  <ul className="mt-4 space-y-3">
                    {data.weakAreas.map((w) => {
                      const max = data.weakAreas[0].count || 1;
                      return (
                        <li key={w.type}>
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{w.type}</span>
                            <span className="text-muted">{w.count}×</span>
                          </div>
                          <div className="mt-1 h-2 overflow-hidden rounded-full bg-border">
                            <div
                              className="h-full rounded-full bg-brand"
                              style={{ width: `${(w.count / max) * 100}%` }}
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </div>

            {/* Recent scores */}
            <div className="card p-6">
              <h3 className="font-display text-lg font-bold">Recent scores</h3>
              <div className="mt-6 flex h-32 items-end gap-1.5">
                {data.recent.map((r, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t bg-gradient-to-t from-brand to-brand-2"
                      style={{ height: `${Math.max(6, r.score)}%` }}
                      title={`${r.score}/100`}
                    />
                  </div>
                ))}
              </div>
              <p className="mt-2 text-center text-xs text-muted">Last {data.recent.length} checks</p>
            </div>
          </div>
        </>
      ) : (
        <div className="card mt-6 p-8 text-center text-muted">
          No checks yet. Analyze some text above and your progress will appear here! 👆
        </div>
      )}

      {/* Daily email toggle */}
      <div className="card mt-4 flex items-center justify-between gap-4 p-5">
        <div>
          <p className="font-semibold">📬 Daily words email</p>
          <p className="text-sm text-muted">Get 5 new words in your inbox every morning.</p>
        </div>
        <button
          onClick={toggleSub}
          disabled={savingSub}
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
            user.dailyEmail ? "bg-brand" : "bg-border"
          }`}
          aria-pressed={user.dailyEmail}
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
              user.dailyEmail ? "left-6" : "left-1"
            }`}
          />
        </button>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  suffix,
  accent,
}: {
  label: string;
  value: string;
  suffix?: string;
  accent?: boolean;
}) {
  return (
    <div className="card p-6">
      <div className="flex items-baseline gap-1.5">
        <span className={`font-display text-4xl font-extrabold ${accent ? "text-gradient" : ""}`}>
          {value}
        </span>
        {suffix && <span className="text-lg text-muted">{suffix}</span>}
      </div>
      <div className="mt-1 text-sm text-muted">{label}</div>
    </div>
  );
}
