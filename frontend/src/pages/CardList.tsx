import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { api, getPermanentUrl, type Card } from "../api.js";
import AppNav from "../components/AppNav.js";

export default function CardList() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchCards = async () => {
    try {
      const data = await api.listCards();
      setCards(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar tarjetas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setCreating(true);
    try {
      await api.createCard({ name: newName, destination_url: newUrl });
      setNewName("");
      setNewUrl("");
      setShowCreate(false);
      await fetchCards();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Error al crear");
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (card: Card) => {
    const newStatus = card.status === "active" ? "disabled" : "active";
    try {
      await api.updateCard(card.id, { status: newStatus });
      await fetchCards();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cambiar estado");
    }
  };

  const copyUrl = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // ignore
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (loading) return <div className="page-loading">Cargando...</div>;

  return (
    <div className="app-layout">
      <AppNav
        actions={
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            + Nueva Card
          </button>
        }
      />

      <main className="page-content">
        {error && <div className="alert alert-error">{error}</div>}

        <h2 className="page-title">Tarjetas</h2>

        <div className="card-grid">
          {cards.map((card) => {
            const url = getPermanentUrl(card.public_id);
            return (
              <div
                key={card.id}
                className={`card-item ${card.status === "disabled" ? "card-disabled" : ""}`}
              >
                <div className="card-item-header">
                  <div className="card-item-header-info">
                    <span className="card-item-name">{card.name}</span>
                    <span
                      className={`badge ${card.status === "active" ? "badge-active" : "badge-disabled"}`}
                    >
                      {card.status === "active" ? "Activa" : "Desactivada"}
                    </span>
                  </div>
                  <div className="card-qr-thumb">
                    <QRCodeSVG value={url} size={48} level="M" />
                  </div>
                </div>

                <div className="card-item-field">
                  <span className="field-label">public_id</span>
                  <code className="mono">{card.public_id}</code>
                </div>

                <div className="card-item-field">
                  <span className="field-label">Destino</span>
                  <a
                    href={card.destination_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="dest-link"
                  >
                    {card.destination_url}
                  </a>
                </div>

                <div className="card-item-field">
                  <span className="field-label">URL permanente</span>
                  <div className="copy-row">
                    <code className="mono url-mono">{url}</code>
                    <button
                      className="btn btn-icon"
                      onClick={() => copyUrl(url, `url-${card.id}`)}
                      title="Copiar URL"
                    >
                      {copiedId === `url-${card.id}` ? "✓" : "⧉"}
                    </button>
                  </div>
                </div>

                <div className="card-item-actions">
                  <button
                    className="btn btn-secondary btn-sm btn-flex"
                    onClick={() => navigate(`/cards/${card.id}`)}
                  >
                    Editar
                  </button>
                  <button
                    className={`btn btn-sm btn-flex ${card.status === "active" ? "btn-danger" : "btn-success"}`}
                    onClick={() => handleToggleStatus(card)}
                  >
                    {card.status === "active" ? "Desactivar" : "Activar"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {cards.length === 0 && !error && (
          <div className="empty-state">
            <p>No hay tarjetas todavía.</p>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
              Crear primera Card
            </button>
          </div>
        )}
      </main>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Nueva Card</h3>
            <form onSubmit={handleCreate}>
              <label className="field-label">Nombre</label>
              <input
                type="text"
                className="text-input"
                placeholder="CARD A"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                autoFocus
              />
              <label className="field-label">URL de destino (HTTPS)</label>
              <input
                type="url"
                className="text-input"
                placeholder="https://wa.me/..."
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                required
              />
              {createError && <p className="form-error">{createError}</p>}
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowCreate(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? "Creando..." : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
