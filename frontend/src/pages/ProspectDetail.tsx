import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppNav from "../components/AppNav.js";
import {
  salesApi,
  PIPELINE_STATES,
  PAYMENT_STATES,
  EVIDENCE_LEVELS,
  VISIT_RESULTS,
  PRIORITIES,
  HYPOTHESES,
  VISIT_QUESTIONS,
  FOLLOW_UP_QUESTIONS,
  OBJECTIONS,
  CTA_OPTIONS,
  OPENING_SCRIPT,
  DEMO_SCRIPT,
  POST_DEMO_QUESTIONS,
  statusLabel,
  paymentLabel,
  evidenceLabel,
  priorityLabel,
  resultLabel,
  type ProspectDetail,
} from "../salesApi.js";

export default function ProspectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [prospect, setProspect] = useState<ProspectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"machete" | "datos" | "visitas">("machete");
  const [expandedObjection, setExpandedObjection] = useState<number | null>(null);
  const [showVisitForm, setShowVisitForm] = useState(false);

  // Visit form state
  const [visit, setVisit] = useState({
    problem_detected: "",
    current_solution: "",
    last_real_case: "",
    frequency: "",
    decision_maker: "",
    interest_level: "",
    objection: "",
    valued_feature: "",
    next_step: "",
    next_step_date: "",
    evidence_level: "",
    result: "",
    notes: "",
  });
  const [savingVisit, setSavingVisit] = useState(false);

  // Edit state for datos tab
  const [editData, setEditData] = useState<Record<string, unknown>>({});
  const [savingData, setSavingData] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await salesApi.get(id);
        setProspect(data);
        setEditData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const refresh = async () => {
    if (!id) return;
    const data = await salesApi.get(id);
    setProspect(data);
    setEditData(data);
  };

  const handleQuickUpdate = async (field: string, value: unknown) => {
    if (!id) return;
    try {
      await salesApi.update(id, { [field]: value } as Partial<ProspectDetail>);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  };

  const handleSaveData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSavingData(true);
    setSaveMsg("");
    try {
      await salesApi.update(id, editData as Partial<ProspectDetail>);
      await refresh();
      setSaveMsg("Guardado ✓");
      setTimeout(() => setSaveMsg(""), 3000);
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSavingData(false);
    }
  };

  const handleSubmitVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSavingVisit(true);
    try {
      await salesApi.addVisit(id, visit);
      setVisit({
        problem_detected: "", current_solution: "", last_real_case: "",
        frequency: "", decision_maker: "", interest_level: "",
        objection: "", valued_feature: "", next_step: "",
        next_step_date: "", evidence_level: "", result: "", notes: "",
      });
      setShowVisitForm(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrar visita");
    } finally {
      setSavingVisit(false);
    }
  };

  if (loading) return <div className="page-loading">Cargando prospecto...</div>;
  if (error && !prospect) return <div className="page-loading">{error}</div>;
  if (!prospect) return <div className="page-loading">Prospecto no encontrado</div>;

  const hypothesisLabel = prospect.hypothesis
    ? HYPOTHESES.find((h) => h.value === prospect.hypothesis)?.label
    : null;

  return (
    <div className="app-layout">
      <AppNav />

      <main className="page-content prospect-detail">
        {error && <div className="alert alert-error">{error}</div>}

        {/* Header */}
        <div className="prospect-detail-header">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate("/sales")}>
            ← Volver
          </button>
          <h2 className="prospect-detail-title">{prospect.negocio}</h2>
          <div className="prospect-detail-badges">
            <span className={`status-badge status-${prospect.status}`}>
              {statusLabel(prospect.status)}
            </span>
            <span className={`priority-badge priority-${prospect.priority}`}>
              {priorityLabel(prospect.priority)}
            </span>
            {prospect.zona && <span className="zone-badge">{prospect.zona}</span>}
          </div>
        </div>

        {/* Quick controls */}
        <div className="quick-controls">
          <div className="quick-control-group">
            <label className="quick-control-label">Estado</label>
            <select
              className="text-input"
              value={prospect.status}
              onChange={(e) => handleQuickUpdate("status", e.target.value)}
            >
              {PIPELINE_STATES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className="quick-control-group">
            <label className="quick-control-label">Prioridad</label>
            <select
              className="text-input"
              value={prospect.priority}
              onChange={(e) => handleQuickUpdate("priority", e.target.value)}
            >
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          <div className="quick-control-group">
            <label className="quick-control-label">Pago</label>
            <select
              className="text-input"
              value={prospect.payment_status}
              onChange={(e) => handleQuickUpdate("payment_status", e.target.value)}
            >
              {PAYMENT_STATES.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowVisitForm(true)}
          >
            + Registrar visita
          </button>
        </div>

        {/* Tabs */}
        <div className="tab-bar">
          <button
            className={`tab-btn ${activeTab === "machete" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("machete")}
          >
            Machete operativo
          </button>
          <button
            className={`tab-btn ${activeTab === "datos" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("datos")}
          >
            Datos del prospecto
          </button>
          <button
            className={`tab-btn ${activeTab === "visitas" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("visitas")}
          >
            Visitas ({prospect.visits.length})
          </button>
        </div>

        {/* ─── MACHETE OPERATIVO ─── */}
        {activeTab === "machete" && (
          <div className="machete-container">
            {/* ANTES DE ENTRAR */}
            <div className="machete-section machete-before">
              <h3 className="machete-section-title">📋 ANTES DE ENTRAR</h3>
              <div className="machete-info-grid">
                <div className="machete-info-item">
                  <span className="machete-info-label">Negocio</span>
                  <span className="machete-info-value">{prospect.negocio}</span>
                </div>
                <div className="machete-info-item">
                  <span className="machete-info-label">Rubro</span>
                  <span className="machete-info-value">{prospect.rubro || "—"}</span>
                </div>
                <div className="machete-info-item">
                  <span className="machete-info-label">Zona</span>
                  <span className="machete-info-value">{prospect.zona || "—"}</span>
                </div>
                <div className="machete-info-item">
                  <span className="machete-info-label">Dirección</span>
                  <span className="machete-info-value">{prospect.direccion || "—"}</span>
                </div>
                <div className="machete-info-item machete-info-full">
                  <span className="machete-info-label">Qué sabemos</span>
                  <span className="machete-info-value">{prospect.notes || "Sin información adicional"}</span>
                </div>
                <div className="machete-info-item machete-info-full">
                  <span className="machete-info-label">Solución digital actual</span>
                  <span className="machete-info-value">{prospect.current_solution || "Sin investigar"}</span>
                </div>
                <div className="machete-info-item machete-info-full">
                  <span className="machete-info-label">Hipótesis comercial</span>
                  <span className="machete-info-value">
                    {prospect.hipotesis_comercial || hypothesisLabel || "Sin hipótesis asignada"}
                  </span>
                </div>
                {prospect.que_falta_saber && (
                  <div className="machete-info-item machete-info-full">
                    <span className="machete-info-label">Qué falta saber</span>
                    <span className="machete-info-value">{prospect.que_falta_saber}</span>
                  </div>
                )}
                {(prospect.rating_publico != null || prospect.research_completeness) && (
                  <div className="machete-info-item">
                    <span className="machete-info-label">Research</span>
                    <span className="machete-info-value">
                      {prospect.research_completeness || "—"}
                      {prospect.rating_publico != null && ` · ★ ${prospect.rating_publico}`}
                      {prospect.cantidad_resenas_publicas != null && ` (${prospect.cantidad_resenas_publicas} reseñas)`}
                    </span>
                  </div>
                )}
                <div className="machete-info-item machete-info-full">
                  <span className="machete-info-label">Objetivo concreto</span>
                  <span className="machete-info-value">{prospect.visit_objective || "No definido"}</span>
                </div>
              </div>
              {(prospect.google_maps || prospect.web || prospect.instagram || prospect.whatsapp_phone) && (
                <div className="machete-links">
                  {prospect.google_maps && (
                    <a href={prospect.google_maps} target="_blank" rel="noopener noreferrer" className="machete-link">📍 Maps</a>
                  )}
                  {prospect.web && (
                    <a href={prospect.web} target="_blank" rel="noopener noreferrer" className="machete-link">🌐 Web</a>
                  )}
                  {prospect.instagram && (
                    <a href={prospect.instagram.startsWith("http") ? prospect.instagram : `https://instagram.com/${prospect.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="machete-link">📷 Instagram</a>
                  )}
                  {prospect.whatsapp_phone && (
                    <a href={`https://wa.me/${prospect.whatsapp_phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="machete-link">💬 WhatsApp</a>
                  )}
                </div>
              )}
            </div>

            {/* DURANTE LA VISITA */}
            <div className="machete-section machete-during">
              <h3 className="machete-section-title">🗣️ DURANTE LA VISITA</h3>

              <div className="machete-subsection">
                <h4 className="machete-subtitle">Guion de apertura</h4>
                <div className="machete-script">{OPENING_SCRIPT}</div>
              </div>

              <div className="machete-subsection">
                <h4 className="machete-subtitle">5 preguntas clave</h4>
                <ol className="machete-questions">
                  {VISIT_QUESTIONS.map((q, i) => (
                    <li key={i} className="machete-question">{q}</li>
                  ))}
                </ol>
              </div>

              <div className="machete-subsection">
                <h4 className="machete-subtitle">Repreguntas útiles</h4>
                <div className="machete-chips">
                  {FOLLOW_UP_QUESTIONS.map((q, i) => (
                    <span key={i} className="machete-chip">{q}</span>
                  ))}
                </div>
              </div>

              <div className="machete-subsection">
                <h4 className="machete-subtitle">CTA recomendado</h4>
                <div className="machete-cta-list">
                  {CTA_OPTIONS.map((c, i) => (
                    <span key={i} className="machete-cta-item">{c}</span>
                  ))}
                </div>
              </div>

              <div className="machete-subsection">
                <h4 className="machete-subtitle">Cuándo mostrar el producto</h4>
                <div className="machete-script">{DEMO_SCRIPT}</div>
                <div className="machete-post-demo">
                  {POST_DEMO_QUESTIONS.map((q, i) => (
                    <p key={i} className="machete-post-demo-q">→ {q}</p>
                  ))}
                </div>
              </div>

              <div className="machete-subsection">
                <h4 className="machete-subtitle">Manejo de objeciones</h4>
                <div className="objections-list">
                  {OBJECTIONS.map((o, i) => (
                    <div key={i} className="objection-item">
                      <button
                        className="objection-trigger"
                        onClick={() => setExpandedObjection(expandedObjection === i ? null : i)}
                      >
                        <span>“{o.trigger}”</span>
                        <span className="objection-toggle">{expandedObjection === i ? "▲" : "▼"}</span>
                      </button>
                      {expandedObjection === i && (
                        <div className="objection-response">{o.response}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* DESPUÉS DE SALIR */}
            <div className="machete-section machete-after">
              <div className="machete-after-header">
                <h3 className="machete-section-title">✅ DESPUÉS DE SALIR</h3>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowVisitForm(true)}
                >
                  Completar formulario
                </button>
              </div>
              <p className="machete-after-hint">
                Formulario rápido (~1 minuto). Registra el resultado de la visita.
              </p>
            </div>
          </div>
        )}

        {/* ─── DATOS ─── */}
        {activeTab === "datos" && (
          <form onSubmit={handleSaveData} className="prospect-edit-form">
            <div className="edit-grid">
              <div className="edit-field">
                <label className="field-label">Negocio *</label>
                <input className="text-input" value={editData.negocio as string || ""} onChange={(e) => setEditData({ ...editData, negocio: e.target.value })} required />
              </div>
              <div className="edit-field">
                <label className="field-label">Rubro</label>
                <input className="text-input" value={editData.rubro as string || ""} onChange={(e) => setEditData({ ...editData, rubro: e.target.value })} />
              </div>
              <div className="edit-field">
                <label className="field-label">Zona</label>
                <input className="text-input" value={editData.zona as string || ""} onChange={(e) => setEditData({ ...editData, zona: e.target.value })} />
              </div>
              <div className="edit-field">
                <label className="field-label">Dirección</label>
                <input className="text-input" value={editData.direccion as string || ""} onChange={(e) => setEditData({ ...editData, direccion: e.target.value })} />
              </div>
              <div className="edit-field">
                <label className="field-label">Google Maps</label>
                <input className="text-input" value={editData.google_maps as string || ""} onChange={(e) => setEditData({ ...editData, google_maps: e.target.value })} />
              </div>
              <div className="edit-field">
                <label className="field-label">Web</label>
                <input className="text-input" value={editData.web as string || ""} onChange={(e) => setEditData({ ...editData, web: e.target.value })} />
              </div>
              <div className="edit-field">
                <label className="field-label">Instagram</label>
                <input className="text-input" value={editData.instagram as string || ""} onChange={(e) => setEditData({ ...editData, instagram: e.target.value })} />
              </div>
              <div className="edit-field">
                <label className="field-label">WhatsApp / Teléfono</label>
                <input className="text-input" value={editData.whatsapp_phone as string || ""} onChange={(e) => setEditData({ ...editData, whatsapp_phone: e.target.value })} />
              </div>
              <div className="edit-field">
                <label className="field-label">Fuente</label>
                <input className="text-input" value={editData.source as string || ""} onChange={(e) => setEditData({ ...editData, source: e.target.value })} />
              </div>
              <div className="edit-field">
                <label className="field-label">Decisor</label>
                <input className="text-input" value={editData.decision_maker as string || ""} onChange={(e) => setEditData({ ...editData, decision_maker: e.target.value })} />
              </div>
              <div className="edit-field">
                <label className="field-label">Contacto del decisor</label>
                <input className="text-input" value={editData.decision_maker_contact as string || ""} onChange={(e) => setEditData({ ...editData, decision_maker_contact: e.target.value })} />
              </div>
              <div className="edit-field">
                <label className="field-label">Mesas aprox.</label>
                <input type="number" className="text-input" value={editData.approx_tables as number || ""} onChange={(e) => setEditData({ ...editData, approx_tables: e.target.value ? parseInt(e.target.value) : null })} />
              </div>
              <div className="edit-field">
                <label className="field-label">Hipótesis</label>
                <select className="text-input" value={editData.hypothesis as string || ""} onChange={(e) => setEditData({ ...editData, hypothesis: e.target.value || null })}>
                  <option value="">Sin asignar</option>
                  {HYPOTHESES.map((h) => (
                    <option key={h.value} value={h.value}>{h.value} — {h.label}</option>
                  ))}
                </select>
              </div>
              <div className="edit-field">
                <label className="field-label">Solución actual</label>
                <input className="text-input" value={editData.current_solution as string || ""} onChange={(e) => setEditData({ ...editData, current_solution: e.target.value })} />
              </div>
              <div className="edit-field">
                <label className="field-label">Problema observado</label>
                <textarea className="text-input" rows={2} value={editData.observed_problem as string || ""} onChange={(e) => setEditData({ ...editData, observed_problem: e.target.value })} />
              </div>
              <div className="edit-field">
                <label className="field-label">Objetivo de visita</label>
                <input className="text-input" value={editData.visit_objective as string || ""} onChange={(e) => setEditData({ ...editData, visit_objective: e.target.value })} />
              </div>
              <div className="edit-field">
                <label className="field-label">Función más valorada</label>
                <input className="text-input" value={editData.most_valued_feature as string || ""} onChange={(e) => setEditData({ ...editData, most_valued_feature: e.target.value })} />
              </div>
              <div className="edit-field">
                <label className="field-label">Objeción principal</label>
                <input className="text-input" value={editData.main_objection as string || ""} onChange={(e) => setEditData({ ...editData, main_objection: e.target.value })} />
              </div>
              <div className="edit-field">
                <label className="field-label">Precio presentado</label>
                <input className="text-input" value={editData.price_presented as string || ""} onChange={(e) => setEditData({ ...editData, price_presented: e.target.value })} />
              </div>
              <div className="edit-field">
                <label className="field-label">Próxima acción</label>
                <input className="text-input" value={editData.next_action as string || ""} onChange={(e) => setEditData({ ...editData, next_action: e.target.value })} />
              </div>
              <div className="edit-field">
                <label className="field-label">Fecha próxima acción</label>
                <input type="date" className="text-input" value={editData.next_action_date as string ? (editData.next_action_date as string).substring(0, 10) : ""} onChange={(e) => setEditData({ ...editData, next_action_date: e.target.value || null })} />
              </div>
              <div className="edit-field">
                <label className="field-label">Responsable</label>
                <input className="text-input" value={editData.responsible as string || ""} onChange={(e) => setEditData({ ...editData, responsible: e.target.value })} />
              </div>
              <div className="edit-field edit-field-full">
                <label className="field-label">Notas</label>
                <textarea className="text-input" rows={3} value={editData.notes as string || ""} onChange={(e) => setEditData({ ...editData, notes: e.target.value })} />
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={savingData}>
                {savingData ? "Guardando..." : "Guardar cambios"}
              </button>
              {saveMsg && <span className="save-msg">{saveMsg}</span>}
            </div>
          </form>
        )}

        {/* ─── VISITAS ─── */}
        {activeTab === "visitas" && (
          <div className="visits-list">
            {prospect.visits.length === 0 && (
              <div className="empty-state">
                <p>Sin visitas registradas.</p>
                <button className="btn btn-primary" onClick={() => setShowVisitForm(true)}>
                  Registrar primera visita
                </button>
              </div>
            )}
            {prospect.visits.map((v) => (
              <div key={v.id} className="visit-card">
                <div className="visit-card-header">
                  <span className="visit-date">
                    {new Date(v.visit_date).toLocaleString("es-AR")}
                  </span>
                  {v.result && (
                    <span className="visit-result-badge">{resultLabel(v.result)}</span>
                  )}
                  {v.evidence_level && (
                    <span className={`evidence-badge evidence-${v.evidence_level}`}>
                      {evidenceLabel(v.evidence_level)}
                    </span>
                  )}
                </div>
                <div className="visit-card-body">
                  {v.problem_detected && <p><strong>Problema:</strong> {v.problem_detected}</p>}
                  {v.current_solution && <p><strong>Solución actual:</strong> {v.current_solution}</p>}
                  {v.last_real_case && <p><strong>Último caso real:</strong> {v.last_real_case}</p>}
                  {v.frequency && <p><strong>Frecuencia:</strong> {v.frequency}</p>}
                  {v.decision_maker && <p><strong>Decisor:</strong> {v.decision_maker}</p>}
                  {v.objection && <p><strong>Objeción:</strong> {v.objection}</p>}
                  {v.valued_feature && <p><strong>Función valorada:</strong> {v.valued_feature}</p>}
                  {v.next_step && <p><strong>Próximo paso:</strong> {v.next_step}</p>}
                  {v.next_step_date && <p><strong>Fecha:</strong> {new Date(v.next_step_date).toLocaleDateString("es-AR")}</p>}
                  {v.notes && <p><strong>Notas:</strong> {v.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Visit form modal */}
      {showVisitForm && (
        <div className="modal-overlay" onClick={() => setShowVisitForm(false)}>
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Registrar visita — {prospect.negocio}</h3>
            <form onSubmit={handleSubmitVisit} className="visit-form">
              <div className="edit-grid">
                <div className="edit-field edit-field-full">
                  <label className="field-label">Problema detectado</label>
                  <textarea className="text-input" rows={2} value={visit.problem_detected} onChange={(e) => setVisit({ ...visit, problem_detected: e.target.value })} />
                </div>
                <div className="edit-field edit-field-full">
                  <label className="field-label">Solución actual</label>
                  <input className="text-input" value={visit.current_solution} onChange={(e) => setVisit({ ...visit, current_solution: e.target.value })} />
                </div>
                <div className="edit-field edit-field-full">
                  <label className="field-label">Último caso real</label>
                  <input className="text-input" value={visit.last_real_case} onChange={(e) => setVisit({ ...visit, last_real_case: e.target.value })} />
                </div>
                <div className="edit-field">
                  <label className="field-label">Frecuencia</label>
                  <input className="text-input" placeholder="Ej: semanal, mensual" value={visit.frequency} onChange={(e) => setVisit({ ...visit, frequency: e.target.value })} />
                </div>
                <div className="edit-field">
                  <label className="field-label">Decisor</label>
                  <input className="text-input" value={visit.decision_maker} onChange={(e) => setVisit({ ...visit, decision_maker: e.target.value })} />
                </div>
                <div className="edit-field">
                  <label className="field-label">Nivel de interés</label>
                  <select className="text-input" value={visit.interest_level} onChange={(e) => setVisit({ ...visit, interest_level: e.target.value })}>
                    <option value="">—</option>
                    <option value="bajo">Bajo</option>
                    <option value="medio">Medio</option>
                    <option value="alto">Alto</option>
                  </select>
                </div>
                <div className="edit-field">
                  <label className="field-label">Objeción</label>
                  <input className="text-input" value={visit.objection} onChange={(e) => setVisit({ ...visit, objection: e.target.value })} />
                </div>
                <div className="edit-field">
                  <label className="field-label">Función valorada</label>
                  <input className="text-input" value={visit.valued_feature} onChange={(e) => setVisit({ ...visit, valued_feature: e.target.value })} />
                </div>
                <div className="edit-field">
                  <label className="field-label">Resultado</label>
                  <select className="text-input" value={visit.result} onChange={(e) => setVisit({ ...visit, result: e.target.value })}>
                    <option value="">—</option>
                    {VISIT_RESULTS.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div className="edit-field">
                  <label className="field-label">Evidencia</label>
                  <select className="text-input" value={visit.evidence_level} onChange={(e) => setVisit({ ...visit, evidence_level: e.target.value })}>
                    <option value="">—</option>
                    {EVIDENCE_LEVELS.map((e) => (
                      <option key={e.value} value={e.value}>{e.label}</option>
                    ))}
                  </select>
                </div>
                <div className="edit-field">
                  <label className="field-label">Próximo paso</label>
                  <input className="text-input" value={visit.next_step} onChange={(e) => setVisit({ ...visit, next_step: e.target.value })} />
                </div>
                <div className="edit-field">
                  <label className="field-label">Fecha próximo paso</label>
                  <input type="date" className="text-input" value={visit.next_step_date} onChange={(e) => setVisit({ ...visit, next_step_date: e.target.value })} />
                </div>
                <div className="edit-field edit-field-full">
                  <label className="field-label">Notas</label>
                  <textarea className="text-input" rows={2} value={visit.notes} onChange={(e) => setVisit({ ...visit, notes: e.target.value })} />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowVisitForm(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingVisit}>
                  {savingVisit ? "Guardando..." : "Registrar visita"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
