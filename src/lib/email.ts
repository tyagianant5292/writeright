import type { Word } from "./words";

// Brevo transactional emails: login OTP + daily words.
// BREVO_API_KEY na ho to console pe log (dev-friendly, crash nahi).

const apiKey = process.env.BREVO_API_KEY;
const FROM_EMAIL = process.env.NOTIFY_FROM_EMAIL ?? "no-reply@example.com";
const FROM_NAME = process.env.NOTIFY_FROM_NAME ?? "WriteRight by infinityagi";

async function send(to: string, subject: string, html: string, text: string) {
  if (!apiKey) {
    console.log(`[email] BREVO_API_KEY missing — would send to ${to}: ${subject}`);
    return;
  }
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": apiKey, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      sender: { name: FROM_NAME, email: FROM_EMAIL },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Brevo failed (${res.status}): ${detail.slice(0, 200)}`);
  }
}

const shell = (inner: string) => `<!doctype html><html><body style="margin:0;background:#f7f7fb;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;padding:24px">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e8e7f0">
    <div style="background:linear-gradient(100deg,#6366f1,#8b5cf6);padding:20px 28px">
      <span style="color:#fff;font-size:18px;font-weight:800;letter-spacing:-.02em">WriteRight <span style="opacity:.8;font-weight:500">by infinityagi</span></span>
    </div>
    <div style="padding:24px 28px;color:#16151d">${inner}</div>
  </div></body></html>`;

export async function sendLoginCode(email: string, code: string) {
  const html = shell(`
    <p style="margin:0 0 8px;font-size:15px">Your login code is:</p>
    <div style="font-size:34px;font-weight:800;letter-spacing:8px;color:#6366f1;margin:12px 0">${code}</div>
    <p style="color:#6b6a7b;font-size:13px;margin:8px 0 0">This code expires in 10 minutes. If you didn't request it, ignore this email.</p>
  `);
  await send(email, `${code} is your WriteRight login code`, html, `Your WriteRight login code is ${code} (expires in 10 minutes).`);
}

export async function sendDailyWords(email: string, words: Word[]) {
  const items = words
    .map(
      (w) => `<div style="border:1px solid #e8e7f0;border-radius:12px;padding:14px 16px;margin:10px 0">
        <div style="font-size:18px;font-weight:700;color:#6366f1">${w.word} <span style="font-size:12px;font-weight:500;color:#8b5cf6">(${w.type})</span></div>
        <div style="margin-top:4px;font-size:14px">${w.meaning} — <span style="color:#8b5cf6">${w.hindi}</span></div>
        <div style="margin-top:6px;font-size:13px;color:#6b6a7b;font-style:italic">"${w.example}"</div>
      </div>`,
    )
    .join("");
  const html = shell(`
    <p style="margin:0 0 6px;font-size:16px;font-weight:600">📅 Your 5 words for today</p>
    <p style="margin:0 0 8px;color:#6b6a7b;font-size:13px">Learn them, use each in a sentence today.</p>
    ${items}
    <p style="margin:16px 0 0;font-size:12px;color:#6b6a7b">You're getting this because you subscribed on WriteRight.</p>
  `);
  const text = "Your 5 words today:\n\n" + words.map((w) => `${w.word} (${w.type}) — ${w.meaning} / ${w.hindi}\n  e.g. ${w.example}`).join("\n\n");
  await send(email, "📅 Your 5 English words for today", html, text);
}
