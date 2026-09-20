import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.js";
import CardList from "./pages/CardList.js";
import CardEdit from "./pages/CardEdit.js";
import SalesDashboard from "./pages/SalesDashboard.js";
import ProspectList from "./pages/ProspectList.js";
import ProspectDetail from "./pages/ProspectDetail.js";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <CardList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cards/:id"
        element={
          <ProtectedRoute>
            <CardEdit />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sales"
        element={
          <ProtectedRoute>
            <ProspectList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sales/dashboard"
        element={
          <ProtectedRoute>
            <SalesDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sales/prospect/:id"
        element={
          <ProtectedRoute>
            <ProspectDetail />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
