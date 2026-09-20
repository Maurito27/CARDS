import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.js";
import CardList from "./pages/CardList.js";
import CardEdit from "./pages/CardEdit.js";

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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
