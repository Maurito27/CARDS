import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { token } = await api.login(email, password);
      localStorage.setItem("token", token);
      navigate("/");
    } catch {
      setError("Credenciales inválidas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">CARDS</div>
        <p className="login-subtitle">Panel de Administración NFC/QR</p>
        <form onSubmit={handleSubmit}>
          <label className="field-label">Email</label>
          <input
            type="email"
            className="text-input"
            placeholder="admin@cards.local"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
          <label className="field-label">Contraseña</label>
          <input
            type="password"
            className="text-input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
        <div className="login-hint">
          <p>Credenciales del PoC:</p>
          <p>
            <code>admin@cards.local</code> / <code>admin123</code>
          </p>
        </div>
      </div>
    </div>
  );
}
