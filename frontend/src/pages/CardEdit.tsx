import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import {
  api,
  getPermanentUrl,
  type CardDetail,
} from "../api.js";

export default function CardEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLDivElement>(null);

  const [card, setCard] = useState<CardDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await api.getCard(id);
        setCard(data);
        setName(data.name);
        setDestinationUrl(data.destination_url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    setSaveMsg("");
    try {
      await api.updateCard(id, { name, destination_url: destinationUrl });
      const data = await api.getCard(id);
      setCard(data);
      setSaveMsg("Guardado ✓");
      setTimeout(() => setSaveMsg(""), 3000);
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!id || !card) return;
    const newStatus = card.status === "active" ? "disabled" : "active";
    try {
      await api.updateCard(id, { status: newStatus });
      const data = await api.getCard(id);
      setCard(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  };

  const copyUrl = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const downloadSvg = () => {
    if (!card) return;
    const svgEl = canvasRef.current?.querySelector("svg");
    if (!svgEl) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgEl);
    const blob = new Blob([svgStr], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-${card.public_id}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPng = () => {
    if (!card) return;
    const canvasEl = canvasRef.current?.querySelector("canvas");
    if (!canvasEl) return;
    const url = canvasEl.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-${card.public_id}.png`;
    a.click();
  };

  if (loading) return <div className="page-loading">Cargando...</div>;
  if (error && !card) return <div className="page-loading">{error}</div>;
  if (!card) return <div className="page-loading">Card no encontrada</div>;

  const permanentUrl = getPermanentUrl(card.public_id);

  return (
    <div className="app-layout">
      <header className="topbar">
        <div className="topbar-brand">CARDS</div>
        <div className="topbar-actions">
          <button className="btn btn-ghost" onClick={() => navigate("/")}>
            ← Volver
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => {
              localStorage.removeItem("token");
              navigate("/login");
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="page-content">
        <div className="edit-layout">
          {/* Left: form */}
          <div className="edit-form-section">
            <div className="edit-header">
              <h2 className="page-title">{card.name}</h2>
              <span
                className={`badge ${card.status === "active" ? "badge-active" : "badge-disabled"}`}
              >
                {card.status === "active" ? "Activa" : "Desactivada"}
              </span>
            </div>

            <form onSubmit={handleSave} className="edit-form">
              <label className="field-label">Nombre</label>
              <input
                type="text"
                className="text-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <label className="field-label">URL de destino (HTTPS)</label>
              <input
                type="url"
                className="text-input"
                value={destinationUrl}
                onChange={(e) => setDestinationUrl(e.target.value)}
                required
                placeholder="https://..."
              />
              <p className="field-hint">
                Al cambiar este valor, el siguiente acceso a la tarjeta redirigirá
                al nuevo destino. No se modifica el QR ni el NFC.
              </p>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Guardando..." : "Guardar cambios"}
                </button>
                <button
                  type="button"
                  className={`btn ${card.status === "active" ? "btn-danger" : "btn-success"}`}
                  onClick={handleToggleStatus}
                >
                  {card.status === "active" ? "Desactivar" : "Activar"}
                </button>
                {saveMsg && <span className="save-msg">{saveMsg}</span>}
              </div>
            </form>

            <div className="info-section">
              <h3 className="section-title">Identidad</h3>
              <div className="info-row">
                <span className="field-label">public_id</span>
                <code className="mono">{card.public_id}</code>
              </div>
              <div className="info-row">
                <span className="field-label">URL permanente</span>
                <div className="copy-row">
                  <code className="mono url-mono">{permanentUrl}</code>
                  <button
                    className="btn btn-icon"
                    onClick={() => copyUrl(permanentUrl)}
                    title="Copiar URL"
                  >
                    {copied ? "✓" : "⧉"}
                  </button>
                </div>
              </div>
              <div className="info-row">
                <span className="field-label">URL para grabar en NFC</span>
                <div className="copy-row">
                  <code className="mono url-mono">{permanentUrl}</code>
                  <button
                    className="btn btn-icon"
                    onClick={() => copyUrl(permanentUrl)}
                    title="Copiar URL NFC"
                  >
                    {copied ? "✓" : "⧉"}
                  </button>
                </div>
              </div>
              <div className="info-row">
                <span className="field-label">Accesos totales</span>
                <span className="info-value">{card.access_count}</span>
              </div>
            </div>

            {card.history.length > 0 && (
              <div className="info-section">
                <h3 className="section-title">Historial de destinos</h3>
                <div className="history-list">
                  {card.history.map((h) => (
                    <div key={h.id} className="history-item">
                      <div className="history-urls">
                        {h.previous_url && (
                          <div className="history-url-prev">
                            <span className="history-label">Anterior:</span>
                            <span className="mono">{h.previous_url}</span>
                          </div>
                        )}
                        <div className="history-url-new">
                          <span className="history-label">Nuevo:</span>
                          <span className="mono">{h.new_url}</span>
                        </div>
                      </div>
                      <span className="history-date">
                        {new Date(h.changed_at).toLocaleString("es-AR")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: QR */}
          <div className="qr-section">
            <h3 className="section-title">Código QR</h3>
            <p className="field-hint">
              Codifica la URL permanente, no el destino.
            </p>
            <div className="qr-display" ref={canvasRef}>
              <QRCodeSVG value={permanentUrl} size={240} level="M" />
              {/* Hidden canvas for PNG export */}
              <div style={{ display: "none" }}>
                <QRCodeCanvas value={permanentUrl} size={240} level="M" />
              </div>
            </div>
            <code className="mono qr-url">{permanentUrl}</code>
            <div className="qr-actions">
              <button className="btn btn-secondary btn-sm" onClick={downloadSvg}>
                Descargar SVG
              </button>
              <button className="btn btn-secondary btn-sm" onClick={downloadPng}>
                Descargar PNG
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
