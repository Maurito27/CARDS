import { Router } from "express";
import { pool } from "../db.js";
import { generatePublicId } from "../utils/publicId.js";
import { validateDestinationUrl } from "../utils/urlValidation.js";

export const cardsRouter = Router();

// List all cards
cardsRouter.get("/", async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, public_id, name, destination_url, status, created_at, updated_at
       FROM cards ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: "Error al obtener tarjetas" });
  }
});

// Get single card with history and access count
cardsRouter.get("/:id", async (req, res) => {
  try {
    const cardResult = await pool.query("SELECT * FROM cards WHERE id = $1", [
      req.params.id,
    ]);
    if (cardResult.rows.length === 0) {
      return res.status(404).json({ error: "Card no encontrada" });
    }

    const historyResult = await pool.query(
      `SELECT id, previous_url, new_url, changed_at
       FROM card_destination_history WHERE card_id = $1
       ORDER BY changed_at DESC`,
      [req.params.id]
    );

    const accessResult = await pool.query(
      "SELECT COUNT(*) FROM card_accesses WHERE card_id = $1",
      [req.params.id]
    );

    res.json({
      ...cardResult.rows[0],
      history: historyResult.rows,
      access_count: parseInt(accessResult.rows[0].count, 10),
    });
  } catch {
    res.status(500).json({ error: "Error al obtener la tarjeta" });
  }
});

// Create card
cardsRouter.post("/", async (req, res) => {
  const { name, destination_url } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "El nombre es obligatorio" });
  }

  const validation = validateDestinationUrl(destination_url);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  try {
    const publicId = generatePublicId();
    const result = await pool.query(
      `INSERT INTO cards (public_id, name, destination_url)
       VALUES ($1, $2, $3) RETURNING *`,
      [publicId, name.trim(), destination_url]
    );

    // Log initial destination
    await pool.query(
      `INSERT INTO card_destination_history (card_id, previous_url, new_url)
       VALUES ($1, NULL, $2)`,
      [result.rows[0].id, destination_url]
    );

    res.status(201).json(result.rows[0]);
  } catch {
    res.status(500).json({ error: "Error al crear la tarjeta" });
  }
});

// Update card (name, destination_url, status)
cardsRouter.patch("/:id", async (req, res) => {
  const { name, destination_url, status } = req.body;

  try {
    const current = await pool.query("SELECT * FROM cards WHERE id = $1", [
      req.params.id,
    ]);
    if (current.rows.length === 0) {
      return res.status(404).json({ error: "Card no encontrada" });
    }

    const card = current.rows[0];
    const updates: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (name !== undefined) {
      if (!name.trim()) return res.status(400).json({ error: "El nombre es obligatorio" });
      updates.push(`name = $${idx++}`);
      values.push(name.trim());
    }

    if (destination_url !== undefined && destination_url !== card.destination_url) {
      const validation = validateDestinationUrl(destination_url);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }
      updates.push(`destination_url = $${idx++}`);
      values.push(destination_url);

      // Log history
      await pool.query(
        `INSERT INTO card_destination_history (card_id, previous_url, new_url)
         VALUES ($1, $2, $3)`,
        [card.id, card.destination_url, destination_url]
      );
    }

    if (status !== undefined) {
      if (!["active", "disabled"].includes(status)) {
        return res.status(400).json({ error: "Estado inválido" });
      }
      updates.push(`status = $${idx++}`);
      values.push(status);
    }

    if (updates.length === 0) {
      return res.json(card);
    }

    updates.push(`updated_at = NOW()`);
    values.push(req.params.id);

    const result = await pool.query(
      `UPDATE cards SET ${updates.join(", ")} WHERE id = $${idx} RETURNING *`,
      values
    );

    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: "Error al actualizar la tarjeta" });
  }
});
