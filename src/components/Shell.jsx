import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { WalletProvider, useWallet } from "./Casino";
import { DAILY_AMOUNT, canClaimDaily, claimDaily, coins, postResult } from "../lib/casino";
import Avatar from "./Avatar";
import ErrorBoundary from "./ErrorBoundary";

const NAV = [
  { to: "/", icon: "🏠", label: "Início", end: true },
  { to: "/mesas", icon: "👥", label: "Mesas" },
  { to: "/economia", icon: "💼", label: "Economia" },
  { to: "/ranking", icon: "🏆", label: "Ranking" },
];

function Topbar({ onToast }) {
  const { user, profile, logout } = useAuth();
  const wallet = useWallet();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const location = useLocation();
  const [menu, setMenu] = useState(false);
  const menuRef = useRef(null);
  const q = location.pathname === "/" ? params.get("q") || "" : "";

  useEffect(() => {
    if (!menu) return undefined;
    const close = (e) => menuRef.current && !menuRef.current.contains(e.target) && setMenu(false);
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [menu]);

  function search(v) {
    navigate({ pathname: "/", search: v ? `?q=${encodeURIComponent(v)}` : "" }, { replace: location.pathname === "/" });
  }

  async function daily() {
    try {
      await claimDaily(user.uid);
      onToast(`🎁 +${coins(DAILY_AMOUNT)}`);
      postResult(user, profile, { type: "daily", bet: 0, payout: DAILY_AMOUNT, detail: "Pegou o bônus do dia" }).catch(() => {});
    } catch (e) {
      onToast(e.message);
    }
  }

  const ready = canClaimDaily(wallet);
  return (
    <header className="topbar">
      <NavLink to="/" className="brand" aria-label="Cassinora Land">
        <span className="brand-ico">🎰</span>
        <b>Cassinora Land</b>
      </NavLink>

      <label className="search">
        <span aria-hidden="true">🔍</span>
        <input type="search" value={q} onChange={(e) => search(e.target.value)} placeholder="Buscar jogos" aria-label="Buscar jogos" />
      </label>

      <div className="top-right">
        <button type="button" className={"daily-btn" + (ready ? " ready" : "")} onClick={daily} disabled={!wallet} title={ready ? "Pegar o bônus diário" : "Bônus de hoje já pego"}>
          🎁<span className="hide-sm"> {ready ? `+${DAILY_AMOUNT}` : "Pego"}</span>
        </button>
        <div className="wallet-pill" title="Carteira">
          <span>💰</span>
          <b>{wallet ? Math.round(wallet.balance || 0).toLocaleString("pt-BR") : "…"}</b>
        </div>
        <div className="user-menu" ref={menuRef}>
          <button type="button" className="user-btn" onClick={() => setMenu((v) => !v)} aria-expanded={menu} aria-label="Menu da conta">
            <Avatar src={profile?.photoURL} name={profile?.nickname} size={34} />
          </button>
          {menu && (
            <div className="user-pop">
              <div className="user-pop-name">
                <b>{profile?.nickname || "Jogador"}</b>
                <span>{user?.email}</span>
              </div>
              <button type="button" onClick={logout}>
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function Sidebar() {
  return (
    <nav className="sidebar" aria-label="Principal">
      {NAV.map((n) => (
        <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => "side-link" + (isActive ? " active" : "")}>
          <span>{n.icon}</span>
          {n.label}
        </NavLink>
      ))}
      <p className="side-note">Moedas de mentira, diversão de verdade. 🎲</p>
    </nav>
  );
}

function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Principal">
      {NAV.map((n) => (
        <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => "bn-link" + (isActive ? " active" : "")}>
          <span>{n.icon}</span>
          <em>{n.label}</em>
        </NavLink>
      ))}
    </nav>
  );
}

export default function Shell() {
  const location = useLocation();
  const [toast, setToast] = useState("");
  const timer = useRef(null);
  const showToast = (t) => {
    setToast(t);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), 2600);
  };
  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <WalletProvider>
      <div className="shell">
        <Topbar onToast={showToast} />
        <Sidebar />
        <main className="shell-main">
          <ErrorBoundary resetKey={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
        <BottomNav />
        {toast && <div className="toast">{toast}</div>}
      </div>
    </WalletProvider>
  );
}
