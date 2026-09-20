import { useNavigate, useLocation } from "react-router-dom";

interface AppNavProps {
  actions?: React.ReactNode;
}

export default function AppNav({ actions }: AppNavProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const isCards = location.pathname === "/" || location.pathname.startsWith("/cards");
  const isSales = location.pathname.startsWith("/sales");

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-brand">CARDS</div>
        <nav className="topbar-nav">
          <button
            className={`nav-link ${isCards ? "nav-active" : ""}`}
            onClick={() => navigate("/")}
          >
            Tarjetas
          </button>
          <button
            className={`nav-link ${isSales ? "nav-active" : ""}`}
            onClick={() => navigate("/sales")}
          >
            Sales Discovery
          </button>
        </nav>
      </div>
      <div className="topbar-actions">
        {actions}
        <button className="btn btn-ghost" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}
