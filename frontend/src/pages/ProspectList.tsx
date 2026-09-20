import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppNav from "../components/AppNav.js";
import {
  salesApi,
  PIPELINE_STATES,
  PRIORITIES,
  statusLabel,
  priorityLabel,
  evidenceLabel,
  type Prospect,
  type ImportResult,
  type DashboardMetrics,
} from "../salesApi.js";

export default function ProspectList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filterStatus, setFilterStatus] = useState(searchParams.get("status") || "");
  const [filterZone, setFilterZone] = useState(searchParams.get("zona") || "");
  const [filterPriority, setFilterPriority] = useState(searchParams.get("priority") || "");
  const [filterResearch, setFilterResearch] = useState(searchParams.get("research") || "");
  const [search, setSearch] = useState("");

  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [newNegocio, setNewNegocio] = useState("");
  const [newZona, setNewZona] = useState("");
  const [newRubro, setNewRubro] = useState("");
  const [newDireccion, setNewDireccion] = useState("");

  const fetchProspects = useCallback(async () => {
    try {
      const params: { status?: string; zona?: string; priority?: string } = {};
      if (filterStatus) params.status = filterStatus;
      if (filterZone) params.zona = filterZone;
      if (filterPriority) params.priority = filterPriority;
      const [data, m] = await Promise.all([salesApi.list(params), salesApi.metrics()]);
      setProspects(data);
      setMetrics(m);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar prospectos");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterZone, filterPriority]);

  useEffect(() => {
    fetchProspects();
  }, [fetchProspects]);

  // Sync filters to URL
  useEffect(() => {
    const params: Record<string, string> = {};
    if (filterStatus) params.status = filterStatus;
    if (filterZone) params.zona = filterZone;
    if (filterPriority) params.priority = filterPriority;
    setSearchParams(params, { replace: true });
  }, [filterStatus, filterZone, filterPriority, setSearchParams]);

  const zones = Array.from(new Set(prospects.map((p) => p.zona).filter(Boolean))) as string[];

  const filtered = prospects.filter((p) => {
    if (filterResearch && p.research_completeness !== filterResearch) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.negocio?.toLowerCase().includes(q) ||
      p.rubro?.toLowerCase().includes(q) ||
      p.direccion?.toLowerCase().includes(q) ||
      p.decision_maker?.toLowerCase().includes(q) ||
      p.hipotesis_comercial?.toLowerCase().includes(q) ||
      p.zona?.toLowerCase().includes(q)
    );
  });

  const handleImport = async () => {
    setImporting(true);
    setImportResult(null);
    try {
      const parsed = JSON.parse(importText);
      const result = await salesApi.import(parsed);
      setImportResult(result);
      if (result.inserted > 0) {
        await fetchProspects();
      }
    } catch (err) {
      setImportResult({
        inserted: 0,
        errors: [err instanceof Error ? err.message : "JSON inválido"],
        total: 0,
      });
    } finally {
      setImporting(false);
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImportText((ev.target?.result as string) || "");
    };
    reader.readAsText(file);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await salesApi.create({
        negocio: newNegocio,
        zona: newZona || undefined,
        rubro: newRubro || undefined,
        direccion: newDireccion || undefined,
      });
      setNewNegocio("");
      setNewZona("");
      setNewRubro("");
      setNewDireccion("");
      setShowCreate(false);
      await fetchProspects();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear");
    }
  };

  const handleQuickStatus = async (p: Prospect, newStatus: string) => {
    try {
      await salesApi.update(p.id, { status: newStatus });
      await fetchProspects();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "ID", "Negocio", "Rubro", "Zona", "Direccion", "Telefono",
      "Google Maps", "Web", "Instagram", "Rating", "Reseñas",
      "Research", "Estado", "Prioridad", "Hipotesis Comercial",
      "Solucion Actual", "Falta Saber", "Evidencia Comercial",
      "Funcion Mas Valorada", "Objecion Principal", "Precio Presentado",
      "Proxima Accion", "Fecha Proxima Accion", "Responsable",
      "Estado Pago", "Notas", "Contactado", "Fuente",
    ];
    const escape = (val: unknown) => {
      const s = val == null ? "" : String(val);
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };
    const rows = filtered.map((p) => [
      p.external_id || p.id, p.negocio, p.rubro, p.zona, p.direccion,
      p.whatsapp_phone, p.google_maps, p.web, p.instagram,
      p.rating_publico, p.cantidad_resenas_publicas,
      p.research_completeness, statusLabel(p.status), priorityLabel(p.priority),
      p.hipotesis_comercial, p.current_solution, p.que_falta_saber,
      p.commercial_evidence, p.most_valued_feature, p.main_objection,
      p.price_presented, p.next_action, p.next_action_date,
      p.responsible, p.payment_status, p.notes,
      p.contactado ? "Sí" : "No", p.source,
    ].map(escape).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prospectos_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="page-loading">Cargando prospectos...</div>;

  return (
    <div className="app-layout">
      <AppNav
        actions={
          <>
            <button className="btn btn-secondary" onClick={handleExportCSV}>
                Exportar CSV
            </button>
            <button className="btn btn-secondary" onClick={() => setShowImport(true)}>
                Importar JSON
            </button>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
              + Prospecto
            </button>
          </>
        }
      />

      <main className="page-content">
        {error && <div className="alert alert-error">{error}</div>}

        <div className="prospect-header-row">
          <h2 className="page-title">Prospectos — Sales Discovery</h2>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate("/sales/dashboard")}>
            Dashboard
          </button>
        </div>

        {/* Evidence rule notice */}
        <div className="evidence-notice">
          <strong>Regla:</strong> "Investigado" significa verificado públicamente. No implica necesidad, interés ni intención de compra. Campos vacíos = no verificado/no encontrado.
        </div>

        {/* KPI cards */}
        <div className="prospect-kpis">
          <div className="prospect-kpi">
            <b>{metrics?.totalProspects ?? prospects.length}</b>
            <span>prospectos</span>
          </div>
          <div className="prospect-kpi">
            <b>{metrics?.totalZonas ?? zones.length}</b>
            <span>microzonas</span>
          </div>
          <div className="prospect-kpi">
            <b>{metrics?.totalPrioridadAlta ?? 0}</b>
            <span>prioridad alta</span>
          </div>
          <div className="prospect-kpi">
            <b>{metrics?.totalEnriquecidos ?? 0}</b>
            <span>enriquecidos</span>
          </div>
          <div className="prospect-kpi">
            <b>{metrics?.totalContactados ?? 0}</b>
            <span>contactados</span>
          </div>
        </div>

        {/* Filters */}
        <div className="filter-bar">
          <input
            type="text"
            className="text-input filter-search"
            placeholder="Buscar negocio, dirección, hipótesis..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="text-input filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Todos los estados</option>
            {PIPELINE_STATES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <select
            className="text-input filter-select"
            value={filterZone}
            onChange={(e) => setFilterZone(e.target.value)}
          >
            <option value="">Todas las zonas</option>
            {zones.map((z) => (
              <option key={z} value={z}>{z}</option>
            ))}
          </select>
          <select
            className="text-input filter-select"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option value="">Toda prioridad</option>
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          <select
            className="text-input filter-select"
            value={filterResearch}
            onChange={(e) => setFilterResearch(e.target.value)}
          >
            <option value="">Todo research</option>
            <option value="Básico">Básico</option>
            <option value="Enriquecido">Enriquecido</option>
          </select>
        </div>

        <p className="filter-count">{filtered.length} prospectos</p>

        {/* Prospect cards */}
        <div className="prospect-card-grid">
          {filtered.map((p) => (
            <div
              key={p.id}
              className={`prospect-card ${p.status === "descartado" ? "prospect-card-muted" : ""}`}
              onClick={() => navigate(`/sales/prospect/${p.id}`)}
            >
              <div className="prospect-card-top">
                <div className="prospect-card-title-row">
                  <span className="prospect-card-name">{p.negocio}</span>
                  {p.rating_publico != null && (
                    <span className="prospect-card-rating">
                      <span className="rating-star">★</span>
                      <span className="rating-value">{p.rating_publico}</span>
                      {p.cantidad_resenas_publicas != null && (
                        <span className="rating-reviews">({p.cantidad_resenas_publicas})</span>
                      )}
                    </span>
                  )}
                </div>
                <div className="prospect-card-meta">
                  {p.zona && <span className="prospect-card-zone">{p.zona}</span>}
                  {p.rubro && <span className="prospect-card-rubro">{p.rubro}</span>}
                </div>
                <div className="prospect-card-contact">
                  {p.whatsapp_phone && <span className="prospect-card-phone">📞 {p.whatsapp_phone}</span>}
                  {p.google_maps && (
                    <a href={p.google_maps} target="_blank" rel="noopener noreferrer" className="prospect-map-link" onClick={(e) => e.stopPropagation()}>
                      📍 Maps
                    </a>
                  )}
                </div>
              </div>

              <div className="prospect-card-badges">
                <select
                  className="status-select"
                  value={p.status}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => handleQuickStatus(p, e.target.value)}
                >
                  {PIPELINE_STATES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <span className={`priority-badge priority-${p.priority}`}>
                  {priorityLabel(p.priority)}
                </span>
                {p.research_completeness && (
                  <span className={`research-badge research-${p.research_completeness === "Enriquecido" ? "enriched" : "basic"}`}>
                    {p.research_completeness}
                  </span>
                )}
              </div>

              {p.hipotesis_comercial && (
                <p className="prospect-card-hypothesis">{p.hipotesis_comercial}</p>
              )}

              {p.next_action && (
                <div className="prospect-card-next">
                  <span className="prospect-next-action">→ {p.next_action}</span>
                  {p.next_action_date && (
                    <span className="prospect-next-date">
                      {new Date(p.next_action_date).toLocaleDateString("es-AR")}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {filtered.length === 0 && !error && (
          <div className="empty-state">
            <p>No hay prospectos con estos filtros.</p>
          </div>
        )}
      </main>

      {/* Import modal */}
      {showImport && (
        <div className="modal-overlay" onClick={() => setShowImport(false)}>
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Importar prospectos (JSON)</h3>
            <p className="field-hint">
              Pegá el JSON de prospectos o subí un archivo .json. Se mapean automáticamente todos los campos: negocio, rubro, zona, direccion, google_maps, web, instagram, telefono, rating, reseñas, research, hipótesis, solución actual, próxima acción y más.
            </p>
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleFileImport}
              className="file-input"
            />
            <textarea
              className="text-input import-textarea"
              placeholder='[\n  { "negocio": "Café XYZ", "zona": "Palermo", "rubro": "Cafetería" }\n]'
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={10}
            />
            {importResult && (
              <div className="import-result">
                <p className="import-success">Importados: {importResult.inserted} / {importResult.total}</p>
                {importResult.errors.length > 0 && (
                  <ul className="import-errors">
                    {importResult.errors.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => { setShowImport(false); setImportResult(null); setImportText(""); }}>
                Cerrar
              </button>
              <button
                className="btn btn-primary"
                onClick={handleImport}
                disabled={importing || !importText.trim()}
              >
                {importing ? "Importando..." : "Importar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Nuevo prospecto</h3>
            <form onSubmit={handleCreate}>
              <label className="field-label">Negocio *</label>
              <input
                type="text"
                className="text-input"
                placeholder="Café XYZ"
                value={newNegocio}
                onChange={(e) => setNewNegocio(e.target.value)}
                required
                autoFocus
              />
              <label className="field-label">Zona</label>
              <input
                type="text"
                className="text-input"
                placeholder="Palermo"
                value={newZona}
                onChange={(e) => setNewZona(e.target.value)}
              />
              <label className="field-label">Rubro</label>
              <input
                type="text"
                className="text-input"
                placeholder="Cafetería"
                value={newRubro}
                onChange={(e) => setNewRubro(e.target.value)}
              />
              <label className="field-label">Dirección</label>
              <input
                type="text"
                className="text-input"
                placeholder="Av. Santa Fe 1234"
                value={newDireccion}
                onChange={(e) => setNewDireccion(e.target.value)}
              />
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
