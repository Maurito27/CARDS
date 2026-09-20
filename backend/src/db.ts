import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgres://cards:cards_dev_password@db:5432/cards",
});

export async function query(text: string, params?: unknown[]) {
  return pool.query(text, params);
}
