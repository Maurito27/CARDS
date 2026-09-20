import { Router } from "express";
import { pool } from "../db.js";

export const prospectsRouter = Router();

// ─── Dashboard metrics ─────────────────────────────────────────────
prospectsRouter.get("/metrics/dashboard", async (_req, res) => {
  try {
    const statusRows = await pool.query(
      "SELECT status, COUNT(*)::int AS count FROM prospects GROUP BY status"
    );
    const byStatus: Record<string, number> = {};
    statusRows.rows.forEach((r) => { byStatus[r.status] = r.count; });

    const zoneRows = await pool.query(
      "SELECT zona, COUNT(*)::int AS count FROM prospects WHERE zona IS NOT NULL AND zona != '' GROUP BY zona ORDER BY count DESC"
    );
    const byZone: Record<string, number> = {};
    zoneRows.rows.forEach((r) => { byZone[r.zona] = r.count; });

    const evidenceRows = await pool.query(
      "SELECT commercial_evidence, COUNT(*)::int AS count FROM prospects WHERE commercial_evidence IS NOT NULL AND commercial_evidence != '' GROUP BY commercial_evidence"
    );
    const byEvidence: Record<string, number> = {};
    evidenceRows.rows.forEach((r) => { byEvidence[r.commercial_evidence] = r.count; });

    const objectionRows = await pool.query(
      "SELECT main_objection, COUNT(*)::int AS count FROM prospects WHERE main_objection IS NOT NULL AND main_objection != '' GROUP BY main_objection ORDER BY count DESC LIMIT 10"
    );
    const topObjections = objectionRows.rows.map((r) => ({
      objection: r.main_objection, count: r.count,
    }));

    const featureRows = await pool.query(
      "SELECT most_valued_feature, COUNT(*)::int AS count FROM prospects WHERE most_valued_feature IS NOT NULL AND most_valued_feature != '' GROUP BY most_valued_feature ORDER BY count DESC LIMIT 10"
    );
    const topValuedFeatures = featureRows.rows.map((r) => ({
      feature: r.most_valued_feature, count: r.count,
    }));

    const totalResult = await pool.query("SELECT COUNT(*)::int AS count FROM prospects");
    const totalProspects = totalResult.rows[0].count;

    const salesResult = await pool.query(
      "SELECT COUNT(*)::int AS count FROM prospects WHERE status = 'confirmado'"
    );
    const totalSales = salesResult.rows[0].count;

    res.json({
      byStatus,
      byZone,
      byEvidence,
      topObjections,
      topValuedFeatures,
      totalProspects,
      totalSales,
    });
  } catch {
    res.status(500).json({ error: "Error al obtener métricas" });
  }
});

// ─── List prospects (with optional filters) ────────────────────────
prospectsRouter.get("/", async (req, res) => {
  try {
    const { status, zona, priority } = req.query;
    const where: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (status && typeof status === "string") {
      where.push(`status = $${idx++}`);
      params.push(status);
    }
    if (zona && typeof zona === "string") {
      where.push(`zona = $${idx++}`);
      params.push(zona);
    }
    if (priority && typeof priority === "string") {
      where.push(`priority = $${idx++}`);
      params.push(priority);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
    const result = await pool.query(
      `SELECT * FROM prospects ${whereClause} ORDER BY
        CASE priority WHEN 'alta' THEN 0 WHEN 'media' THEN 1 ELSE 2 END,
        CASE status WHEN 'descartado' THEN 1 ELSE 0 END,
        created_at DESC`,
      params
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: "Error al obtener prospectos" });
  }
});

// ─── Get single prospect with visits ───────────────────────────────
prospectsRouter.get("/:id", async (req, res) => {
  try {
    const prospectResult = await pool.query("SELECT * FROM prospects WHERE id = $1", [
      req.params.id,
    ]);
    if (prospectResult.rows.length === 0) {
      return res.status(404).json({ error: "Prospecto no encontrado" });
    }

    const visitsResult = await pool.query(
      "SELECT * FROM prospect_visits WHERE prospect_id = $1 ORDER BY visit_date DESC",
      [req.params.id]
    );

    res.json({ ...prospectResult.rows[0], visits: visitsResult.rows });
  } catch {
    res.status(500).json({ error: "Error al obtener el prospecto" });
  }
});

// ─── Create prospect ──────────────────────────────────────────────
prospectsRouter.post("/", async (req, res) => {
  const b = req.body;
  if (!b.negocio || !b.negocio.trim()) {
    return res.status(400).json({ error: "El nombre del negocio es obligatorio" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO prospects (
        negocio, rubro, zona, direccion, google_maps, web, instagram,
        whatsapp_phone, source, status, priority, current_solution,
        observed_problem, hypothesis, decision_maker, decision_maker_contact,
        approx_tables, visit_objective, notes, responsible
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
      RETURNING *`,
      [
        b.negocio?.trim(),
        b.rubro || null,
        b.zona || null,
        b.direccion || null,
        b.google_maps || null,
        b.web || null,
        b.instagram || null,
        b.whatsapp_phone || null,
        b.source || "Manual",
        b.status || "sin_procesar",
        b.priority || "media",
        b.current_solution || null,
        b.observed_problem || null,
        b.hypothesis || null,
        b.decision_maker || null,
        b.decision_maker_contact || null,
        b.approx_tables || null,
        b.visit_objective || null,
        b.notes || null,
        b.responsible || "Mauro",
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch {
    res.status(500).json({ error: "Error al crear el prospecto" });
  }
});

// ─── Import prospects from JSON array ─────────────────────────────
prospectsRouter.post("/import", async (req, res) => {
  const items = Array.isArray(req.body) ? req.body : req.body.prospects;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Se espera un array de prospectos o { prospects: [...] }" });
  }

  const mapField = (item: Record<string, unknown>, ...keys: string[]): unknown => {
    for (const k of keys) {
      if (item[k] !== undefined && item[k] !== null && item[k] !== "") return item[k];
    }
    return null;
  };

  try {
    let inserted = 0;
    const errors: string[] = [];

    for (const item of items) {
      const negocio = mapField(item as Record<string, unknown>, "negocio", "business_name", "name", "nombre", "business") as string | null;
      if (!negocio || !String(negocio).trim()) {
        errors.push(`Fila ${inserted + errors.length + 1}: falta nombre del negocio`);
        continue;
      }

      try {
        await pool.query(
          `INSERT INTO prospects (
            negocio, rubro, zona, direccion, google_maps, web, instagram,
            whatsapp_phone, source, status, priority
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
          [
            String(negocio).trim(),
            mapField(item as Record<string, unknown>, "rubro", "category", "industry", "tipo"),
            mapField(item as Record<string, unknown>, "zona", "zone", "neighborhood", "barrio", "area"),
            mapField(item as Record<string, unknown>, "direccion", "address", "dirección", "location"),
            mapField(item as Record<string, unknown>, "google_maps", "maps_url", "google_maps_url", "maps", "google_maps_link"),
            mapField(item as Record<string, unknown>, "web", "website", "url", "sitio", "pagina_web"),
            mapField(item as Record<string, unknown>, "instagram", "ig", "insta"),
            mapField(item as Record<string, unknown>, "whatsapp_phone", "whatsapp", "phone", "telefono", "tel", "phone_number", "whatsapp_number"),
            mapField(item as Record<string, unknown>, "source", "fuente", "origen") || "Importado",
            "sin_procesar",
            "media",
          ]
        );
        inserted++;
      } catch {
        errors.push(`"${String(negocio).trim()}": error al insertar`);
      }
    }

    res.status(201).json({ inserted, errors, total: items.length });
  } catch {
    res.status(500).json({ error: "Error al importar prospectos" });
  }
});

// ─── Update prospect ──────────────────────────────────────────────
prospectsRouter.patch("/:id", async (req, res) => {
  const allowedFields = [
    "negocio", "rubro", "zona", "direccion", "google_maps", "web", "instagram",
    "whatsapp_phone", "source", "status", "priority", "current_solution",
    "observed_problem", "hypothesis", "decision_maker", "decision_maker_contact",
    "approx_tables", "visit_objective", "result", "commercial_evidence",
    "most_valued_feature", "main_objection", "price_presented", "next_action",
    "next_action_date", "responsible", "payment_status", "notes",
  ];

  try {
    const current = await pool.query("SELECT * FROM prospects WHERE id = $1", [req.params.id]);
    if (current.rows.length === 0) {
      return res.status(404).json({ error: "Prospecto no encontrado" });
    }

    const updates: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = $${idx++}`);
        values.push(req.body[field]);
      }
    }

    if (updates.length === 0) {
      return res.json(current.rows[0]);
    }

    updates.push("updated_at = NOW()");
    values.push(req.params.id);

    const result = await pool.query(
      `UPDATE prospects SET ${updates.join(", ")} WHERE id = $${idx} RETURNING *`,
      values
    );
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: "Error al actualizar el prospecto" });
  }
});

// ─── Delete prospect ──────────────────────────────────────────────
prospectsRouter.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM prospects WHERE id = $1 RETURNING id", [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Prospecto no encontrado" });
    }
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Error al eliminar el prospecto" });
  }
});

// ─── Add visit log ─────────────────────────────────────────────────
prospectsRouter.post("/:id/visits", async (req, res) => {
  const b = req.body;
  try {
    const prospectCheck = await pool.query("SELECT id FROM prospects WHERE id = $1", [req.params.id]);
    if (prospectCheck.rows.length === 0) {
      return res.status(404).json({ error: "Prospecto no encontrado" });
    }

    const result = await pool.query(
      `INSERT INTO prospect_visits (
        prospect_id, problem_detected, current_solution, last_real_case,
        frequency, decision_maker, interest_level, objection, valued_feature,
        next_step, next_step_date, evidence_level, result, notes
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      RETURNING *`,
      [
        req.params.id,
        b.problem_detected || null,
        b.current_solution || null,
        b.last_real_case || null,
        b.frequency || null,
        b.decision_maker || null,
        b.interest_level || null,
        b.objection || null,
        b.valued_feature || null,
        b.next_step || null,
        b.next_step_date || null,
        b.evidence_level || null,
        b.result || null,
        b.notes || null,
      ]
    );

    // Also update the prospect with key visit data
    const prospectUpdates: string[] = ["status = 'visitado'", "updated_at = NOW()"];
    const prospectValues: unknown[] = [];
    let pIdx = 1;

    if (b.result) { prospectUpdates.push(`result = $${pIdx++}`); prospectValues.push(b.result); }
    if (b.evidence_level) { prospectUpdates.push(`commercial_evidence = $${pIdx++}`); prospectValues.push(b.evidence_level); }
    if (b.objection) { prospectUpdates.push(`main_objection = $${pIdx++}`); prospectValues.push(b.objection); }
    if (b.valued_feature) { prospectUpdates.push(`most_valued_feature = $${pIdx++}`); prospectValues.push(b.valued_feature); }
    if (b.decision_maker) { prospectUpdates.push(`decision_maker = $${pIdx++}`); prospectValues.push(b.decision_maker); }
    if (b.current_solution) { prospectUpdates.push(`current_solution = $${pIdx++}`); prospectValues.push(b.current_solution); }
    if (b.problem_detected) { prospectUpdates.push(`observed_problem = $${pIdx++}`); prospectValues.push(b.problem_detected); }
    if (b.next_step) { prospectUpdates.push(`next_action = $${pIdx++}`); prospectValues.push(b.next_step); }
    if (b.next_step_date) { prospectUpdates.push(`next_action_date = $${pIdx++}`); prospectValues.push(b.next_step_date); }

    // Advance status based on result
    if (b.result === "venta" || b.result === "propuesta" || b.result === "piloto" || b.result === "demo" || b.result === "decisor") {
      prospectValues.push(b.result === "venta" ? "confirmado" : b.result === "propuesta" ? "propuesta" : b.result === "piloto" ? "piloto" : b.result === "demo" ? "demo" : "oportunidad");
      prospectUpdates.push(`status = $${pIdx++}`);
    }

    prospectValues.push(req.params.id);
    await pool.query(
      `UPDATE prospects SET ${prospectUpdates.join(", ")} WHERE id = $${pIdx}`,
      prospectValues
    );

    res.status(201).json(result.rows[0]);
  } catch {
    res.status(500).json({ error: "Error al registrar la visita" });
  }
});
