import { neon } from "@neondatabase/serverless";

// Neon Postgres. DATABASE_URL na ho to null — login/progress features
// gracefully disabled ho jayenge (analyzer phir bhi chalega).

const url = process.env.DATABASE_URL;
export const sql = url ? neon(url) : null;
export const dbEnabled = Boolean(sql);

let ready: Promise<void> | null = null;

/** Tables ko lazily create karta hai (pehli DB call pe). */
export function ensureSchema(): Promise<void> {
  if (!sql) return Promise.resolve();
  if (!ready) {
    ready = (async () => {
      await sql`CREATE TABLE IF NOT EXISTS users (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        daily_email BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
      await sql`CREATE TABLE IF NOT EXISTS login_codes (
        email TEXT NOT NULL,
        code TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
      await sql`CREATE TABLE IF NOT EXISTS analyses (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id BIGINT NOT NULL,
        overall_score INT NOT NULL,
        mistake_count INT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
      await sql`CREATE TABLE IF NOT EXISTS mistakes (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id BIGINT NOT NULL,
        type TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    })();
  }
  return ready;
}

export type DBUser = { id: string; email: string; daily_email: boolean };

export async function upsertUser(email: string): Promise<DBUser> {
  await ensureSchema();
  const rows = (await sql!`
    INSERT INTO users (email) VALUES (${email})
    ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
    RETURNING id::text, email, daily_email
  `) as DBUser[];
  return rows[0];
}
