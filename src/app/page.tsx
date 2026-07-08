import Analyzer from "@/components/Analyzer";
import DailyWords from "@/components/DailyWords";
import Speaking from "@/components/Speaking";
import Progress from "@/components/Progress";
import { AuthProvider } from "@/components/AuthProvider";
import UserMenu from "@/components/UserMenu";

export default function Home() {
  return (
    <AuthProvider>
      <div className="relative">
        {/* Background flourish */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px]"
          style={{
            background:
              "radial-gradient(60% 60% at 50% 0%, rgba(99,102,241,0.12), transparent 70%), radial-gradient(40% 50% at 85% 10%, rgba(217,70,239,0.08), transparent 70%)",
          }}
        />

        {/* Header */}
        <header className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-5 sm:px-8">
          <a href="#" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-white shadow-lg shadow-brand/30">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
            </span>
            <span className="flex items-baseline gap-1.5">
              <span className="font-display text-xl font-extrabold">
                Write<span className="text-brand">Right</span>
              </span>
              <span className="hidden text-xs font-medium text-muted sm:inline">by infinityagi</span>
            </span>
          </a>
          <UserMenu />
        </header>

        <main className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
          {/* Hero */}
          <section className="pt-8 pb-10 text-center sm:pt-14">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-medium text-muted">
              ⚡ Powered by AI · Instant feedback
            </span>
            <h1 className="mx-auto mt-5 max-w-3xl font-display text-4xl font-extrabold leading-[1.05] sm:text-6xl">
              Improve your English,
              <br />
              <span className="text-gradient">one sentence at a time.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-muted">
              Type or speak in English and get instant AI feedback — grammar, vocabulary,
              sentence structure, spelling and pronunciation — with corrections you actually
              understand. Sign in to track your progress.
            </p>
          </section>

          <Analyzer />

          {/* How it scores */}
          <section className="mx-auto mt-16 grid max-w-3xl gap-3 sm:grid-cols-5">
            {[
              ["Grammar", "📚"],
              ["Vocabulary", "💬"],
              ["Sentences", "🔤"],
              ["Spelling", "✍️"],
              ["Pronunciation", "🗣️"],
            ].map(([label, icon]) => (
              <div key={label} className="card flex flex-col items-center gap-1 px-2 py-3 text-center">
                <span className="text-xl">{icon}</span>
                <span className="text-xs font-medium text-muted">{label}</span>
              </div>
            ))}
          </section>

          <Speaking />
          <Progress />
          <DailyWords />
        </main>

        <footer className="border-t border-border py-8 text-center text-sm text-muted">
          <p>
            Built with 💜 · <span className="font-semibold">WriteRight by infinityagi</span> — practice a little every day.
          </p>
        </footer>
      </div>
    </AuthProvider>
  );
}
