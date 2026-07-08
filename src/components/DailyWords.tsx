import { getDailyWords } from "@/lib/words";

export default function DailyWords() {
  const words = getDailyWords();
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <section id="words" className="mx-auto mt-20 max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold sm:text-3xl">
            📅 Word of the day
          </h2>
          <p className="mt-1 text-muted">
            5 new words every day — learn them, use them in a sentence.
          </p>
        </div>
        <span className="rounded-full border border-border bg-surface px-3 py-1 text-sm text-muted">
          {today}
        </span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {words.map((w) => (
          <article key={w.word} className="card p-5">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="font-display text-xl font-bold text-gradient">{w.word}</h3>
              <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs text-brand">
                {w.type}
              </span>
            </div>
            <p className="mt-2 font-medium">{w.meaning}</p>
            <p className="text-sm text-brand-2">{w.hindi}</p>
            <p className="mt-3 border-l-2 border-border pl-3 text-sm italic text-muted">
              “{w.example}”
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
