import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Shell from "./components/Shell";
import Lobby from "./pages/Lobby";
import Mesas from "./pages/Mesas";
import Economia from "./pages/Economia";
import RankingPage from "./pages/Ranking";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="full-loader">
        <div className="spinner" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Register />} />
      <Route
        element={
          <PrivateRoute>
            <Shell />
          </PrivateRoute>
        }
      >
        <Route index element={<Lobby />} />
        <Route path="mesas" element={<Mesas />} />
        <Route path="economia" element={<Economia />} />
        <Route path="ranking" element={<RankingPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
