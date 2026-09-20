import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "./db.js";
import { redirectRouter } from "./routes/redirect.js";
import { cardsRouter } from "./routes/cards.js";
import { authRouter } from "./routes/auth.js";
import { prospectsRouter } from "./routes/prospects.js";
import { authMiddleware } from "./middleware/auth.js";
import { generatePublicId } from "./utils/publicId.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runMigrations() {
  const migrationsDir = path.join(__dirname, "migrations");
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
    await pool.query(sql);
    console.log(`[db] Migration applied: ${file}`);
  }
}

async function seedIfEmpty() {
  const existing = await pool.query("SELECT COUNT(*) FROM cards");
  if (parseInt(existing.rows[0].count, 10) > 0) {
    console.log("[seed] Cards already exist — skipping");
    return;
  }

  const cardA = await pool.query(
    `INSERT INTO cards (public_id, name, destination_url)
     VALUES ($1, $2, $3) RETURNING *`,
    [generatePublicId(), "CARD A", "https://wa.me/5491100000000"]
  );
  await pool.query(
    `INSERT INTO card_destination_history (card_id, previous_url, new_url)
     VALUES ($1, NULL, $2)`,
    [cardA.rows[0].id, "https://wa.me/5491100000000"]
  );

  const cardB = await pool.query(
    `INSERT INTO cards (public_id, name, destination_url)
     VALUES ($1, $2, $3) RETURNING *`,
    [generatePublicId(), "CARD B", "https://menu.example.com"]
  );
  await pool.query(
    `INSERT INTO card_destination_history (card_id, previous_url, new_url)
     VALUES ($1, NULL, $2)`,
    [cardB.rows[0].id, "https://menu.example.com"]
  );

  console.log(`[seed] CARD A public_id: ${cardA.rows[0].public_id}`);
  console.log(`[seed] CARD B public_id: ${cardB.rows[0].public_id}`);
}

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());

// Public routes
app.use("/c", redirectRouter);
app.use("/api/auth", authRouter);

// Protected routes
app.use("/api/cards", authMiddleware, cardsRouter);
app.use("/api/prospects", authMiddleware, prospectsRouter);

// Health check
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

const PORT = parseInt(process.env.PORT || "8000", 10);

runMigrations()
  .then(() => seedIfEmpty())
  .then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`[api] Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("[api] Startup failed:", err);
    process.exit(1);
  });
