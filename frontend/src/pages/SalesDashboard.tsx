import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppNav from "../components/AppNav.js";
import {
  salesApi,
  PIPELINE_STATES,
  type DashboardMetrics,
  type Prospect,
} from "../salesApi.js";

export default function SalesDashboard() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([salesApi.metrics(), salesApi.list()])
      .then(([m, p]) => {
        setMetrics(m);
        setProspects(p);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading">Cargando dashboard...</div>;

  // Compute this week's activity from prospects
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);

  const weekProspects = prospects.filter(
    (p) => new Date(p.updated_at) >= weekStart
  );
  const weekVisited = weekProspects.filter((p) =>
    ["visitado", "oportunidad", "demo", "piloto", "propuesta", "negociacion", "confirmado"].includes(p.status)
  );
  const weekDecisors = weekProspects.filter(
    (p) => p.decision_maker && p.decision_maker.trim()
  );
  const weekOpportunities = weekProspects.filter((p) =>
    ["oportunidad", "demo", "piloto", "propuesta", "negociacion", "confirmado"].includes(p.status)
  );

  // Conversion rates
  const visited = prospects.filter((p) =>
    ["visitado", "oportunidad", "demo", "piloto", "propuesta", "negociacion", "confirmado"].includes(p.status)
  ).length;
  const opportunities = prospects.filter((p) =>
    ["oportunidad", "demo", "piloto", "propuesta", "negociacion", "confirmado"].includes(p.status)
  ).length;
  const demos = prospects.filter((p) =>
    ["demo", "piloto", "propuesta", "negociacion", "confirmado"].includes(p.status)
  ).length;
  const proposals = prospects.filter((p) =>
    ["propuesta", "negociacion", "confirmado"].includes(p.status)
  ).length;
  const sales = metrics?.totalSales || 0;

  const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);

  const cadenceTarget = 5;
  const cadencePct = Math.min(100, Math.round((weekVisited.length / cadenceTarget) * 100));

  return (
    <div className="app-layout">
      <AppNav />
      <main className="page-content">
        <h2 className="page-title">Sales Discovery — Dashboard</h2>

        {/* Cadence */}
        <div className="info-section">
          <h3 className="section-title">Cadencia semanal</h3>
          <div className="cadence-bar">
            <div className="cadence-fill" style={{ width: `${cadencePct}%` }} />
            <span className="cadence-label">
              {weekVisited.length} / {cadenceTarget} visitas esta semana
            </span>
          </div>
          <div className="metric-row">
            <div className="mini-metric">
              <span className="mini-metric-value">{weekProspects.length}</span>
              <span className="mini-metric-label">Prospectos actualizados</span>
            </div>
            <div className="mini-metric">
              <span className="mini-metric-value">{weekVisited.length}</span>
              <span className="mini-metric-label">Visitas</span>
            </div>
            <div className="mini-metric">
              <span className="mini-metric-value">{weekDecisors.length}</span>
              <span className="mini-metric-label">Conversaciones con decisores</span>
            </div>
            <div className="mini-metric">
              <span className="mini-metric-value">{weekOpportunities.length}</span>
              <span className="mini-metric-label">Oportunidades</span>
            </div>
          </div>
        </div>

        {/* Pipeline overview */}
        <div className="info-section">
          <h3 className="section-title">Pipeline</h3>
          <div className="pipeline-grid">
            {PIPELINE_STATES.map((s) => {
              const count = metrics?.byStatus[s.value] || 0;
              return (
                <div
                  key={s.value}
                  className={`pipeline-chip ${count > 0 ? "pipeline-chip-active" : ""} ${s.value === "descartado" ? "pipeline-chip-muted" : ""}`}
                  onClick={() => navigate(`/sales?status=${s.value}`)}
                >
                  <span className="pipeline-chip-count">{count}</span>
                  <span className="pipeline-chip-label">{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Conversion funnel */}
        <div className="info-section">
          <h3 className="section-title">Conversión</h3>
          <div className="funnel">
            <div className="funnel-row">
              <span className="funnel-label">Visitados</span>
              <span className="funnel-value">{visited}</span>
            </div>
            <div className="funnel-arrow">↓ {pct(opportunities, visited)}%</div>
            <div className="funnel-row">
              <span className="funnel-label">Oportunidades</span>
              <span className="funnel-value">{opportunities}</span>
            </div>
            <div className="funnel-arrow">↓ {pct(demos, opportunities)}%</div>
            <div className="funnel-row">
              <span className="funnel-label">Demos</span>
              <span className="funnel-value">{demos}</span>
            </div>
            <div className="funnel-arrow">↓ {pct(proposals, demos)}%</div>
            <div className="funnel-row">
              <span className="funnel-label">Propuestas</span>
              <span className="funnel-value">{proposals}</span>
            </div>
            <div className="funnel-arrow">↓ {pct(sales, proposals)}%</div>
            <div className="funnel-row funnel-row-highlight">
              <span className="funnel-label">Ventas</span>
              <span className="funnel-value">{sales}</span>
            </div>
            <div className="funnel-arrow funnel-arrow-total">
              Visita → Venta: {pct(sales, visited)}%
            </div>
          </div>
        </div>

        {/* Zones */}
        {metrics && Object.keys(metrics.byZone).length > 0 && (
          <div className="info-section">
            <h3 className="section-title">Por zona</h3>
            <div className="zone-list">
              {Object.entries(metrics.byZone).map(([zone, count]) => (
                <div key={zone} className="zone-item" onClick={() => navigate(`/sales?zona=${encodeURIComponent(zone)}`)}>
                  <span className="zone-name">{zone}</span>
                  <span className="zone-count">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top objections & features */}
        <div className="dashboard-two-col">
          {metrics && metrics.topObjections.length > 0 && (
            <div className="info-section">
              <h3 className="section-title">Objeciones frecuentes</h3>
              <div className="list-items">
                {metrics.topObjections.map((o, i) => (
                  <div key={i} className="list-item">
                    <span className="list-item-text">{o.objection}</span>
                    <span className="list-item-count">{o.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {metrics && metrics.topValuedFeatures.length > 0 && (
            <div className="info-section">
              <h3 className="section-title">Funciones más valoradas</h3>
              <div className="list-items">
                {metrics.topValuedFeatures.map((f, i) => (
                  <div key={i} className="list-item">
                    <span className="list-item-text">{f.feature}</span>
                    <span className="list-item-count">{f.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="dashboard-actions">
          <button className="btn btn-primary" onClick={() => navigate("/sales")}>
            Ver todos los prospectos
          </button>
        </div>
      </main>
    </div>
  );
}
