import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password);
      navigate("/");
    } catch {
      setError("E-mail ou senha incorretos.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-brand">
          <span>🎰</span>
          <b>Cassinora Land</b>
        </div>
        <p className="auth-sub">Entre para jogar. Aqui as moedas são de mentira.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            E-mail
            <input type="email" value={email} required onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" />
          </label>
          <label>
            Senha
            <input type="password" value={password} required onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </label>
          {error && <p className="auth-error">{error}</p>}
          <button className="btn btn-gradient" disabled={busy} type="submit">
            {busy ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <p className="auth-foot">
          Ainda não tem conta? <Link to="/registro">Registre-se</Link>
        </p>
      </div>
    </div>
  );
}
