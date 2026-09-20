import { Router } from "express";
import { pool } from "../db.js";

export const redirectRouter = Router();

// GET /c/:publicId — public redirect resolver
// No authentication required; this is the core product flow.
redirectRouter.get("/:publicId", async (req, res) => {
  const { publicId } = req.params;

  try {
    const result = await pool.query(
      "SELECT id, destination_url, status FROM cards WHERE public_id = $1",
      [publicId]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .set("Cache-Control", "no-store")
        .send("Card no encontrada");
    }

    const card = result.rows[0];

    if (card.status !== "active") {
      return res
        .status(410)
        .set("Cache-Control", "no-store")
        .send("Card desactivada");
    }

    // Log access (fire-and-forget, minimal data)
    pool
      .query("INSERT INTO card_accesses (card_id) VALUES ($1)", [card.id])
      .catch((err) => console.error("Access log error:", err));

    // 302 Found — temporary redirect, never cached
    res.set("Cache-Control", "no-store");
    return res.redirect(302, card.destination_url);
  } catch (err) {
    console.error("Redirect error:", err);
    return res
      .status(500)
      .set("Cache-Control", "no-store")
      .send("Error interno del servidor");
  }
});
