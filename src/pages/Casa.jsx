import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCollection } from "../lib/useCollection";
import { useWallet } from "../components/Casino";
import { DollShape } from "../components/Doll";
import { ITEMS, decorCount, liveStats, rest, restLeft } from "../lib/rpg";
import { dollOf, shade } from "../lib/doll";
import { useNow } from "../components/RPG";

// Interior 2D da casa: sala com os móveis comprados. O dono pode descansar (energia, saúde e humor).
const SLOTS = {
  rug: (k) => <ellipse key={k} cx="400" cy="420" rx="170" ry="34" fill="#8b3a3a" stroke="#5c2020" strokeWidth="3" />,
  picture: (k) => (
    <g key={k}>
      <rect x="330" y="70" width="110" height="76" rx="4" fill="#5b3a1e" />
      <rect x="338" y="78" width="94" height="60" fill="#7cc4ff" />
      <path d="M338 138 L370 106 L396 128 L412 112 L432 138Z" fill="#3f9e5a" />
    </g>
  ),
  tv: (k) => (
    <g key={k}>
      <rect x="520" y="190" width="170" height="100" rx="6" fill="#111" stroke="#333" strokeWidth="4" />
      <rect x="528" y="198" width="154" height="84" fill="#1d4ed8" />
      <text x="605" y="250" fontSize="30" textAnchor="middle">📺</text>
      <rect x="590" y="290" width="30" height="14" fill="#333" />
    </g>
  ),
  sofa: (k) => (
    <g key={k}>
      <rect x="70" y="300" width="210" height="80" rx="14" fill="#2563eb" />
      <rect x="62" y="270" width="226" height="50" rx="14" fill="#1d4ed8" />
      <rect x="62" y="330" width="26" height="60" rx="10" fill="#1e40af" />
      <rect x="262" y="330" width="26" height="60" rx="10" fill="#1e40af" />
    </g>
  ),
  plant: (k) => (
    <g key={k}>
      <rect x="718" y="350" width="40" height="40" rx="6" fill="#b45309" />
      <circle cx="738" cy="334" r="26" fill="#2e8b4a" />
      <circle cx="722" cy="320" r="16" fill="#3aa35a" />
      <circle cx="754" cy="322" r="16" fill="#3aa35a" />
    </g>
  ),
  shelf: (k) => (
    <g key={k}>
      <rect x="40" y="110" width="150" height="130" fill="#7c4a2b" stroke="#4a2c18" strokeWidth="3" />
      {[0, 1, 2].map((r) => <rect key={r} x="46" y={118 + r * 40} width="138" height="4" fill="#4a2c18" />)}
      {[0, 1, 2].flatMap((r) => [0, 1, 2, 3, 4].map((c) => <rect key={r + "-" + c} x={52 + c * 26} y={92 + r * 40 + 26} width="16" height="30" fill={["#ef4444", "#3b82f6", "#facc15", "#22c55e", "#a855f7"][(r + c) % 5]} />))}
    </g>
  ),
  aquarium: (k) => (
    <g key={k}>
      <rect x="440" y="300" width="110" height="70" rx="6" fill="#38bdf8" opacity="0.7" stroke="#e0f2fe" strokeWidth="3" />
      <text x="470" y="345" fontSize="22">🐠</text>
      <text x="505" y="330" fontSize="16">🐟</text>
    </g>
  ),
  piano: (k) => (
    <g key={k}>
      <rect x="300" y="300" width="150" height="80" rx="6" fill="#111" />
      <rect x="306" y="340" width="138" height="22" fill="#fff" />
      <text x="375" y="330" fontSize="18" textAnchor="middle">🎹</text>
    </g>
  ),
  fireplace: (k) => (
    <g key={k}>
      <rect x="200" y="200" width="110" height="110" fill="#6b7280" stroke="#374151" strokeWidth="4" />
      <rect x="220" y="230" width="70" height="80" fill="#111" />
      <text x="255" y="296" fontSize="34" textAnchor="middle">🔥</text>
    </g>
  ),
};

export default function Casa() {
  const { uid } = useParams();
  const { user } = useAuth();
  const me = useWallet();
  const navigate = useNavigate();
  const { data: wallets } = useCollection("wallets");
  const now = useNow(1000);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const w = uid === user.uid ? me : wallets.find((x) => x.id === uid);
  const house = ITEMS[w?.assets?.house];
  const mine = uid === user.uid;
  const hour = new Date().getHours();
  const night = hour >= 19 || hour < 6;
  useEffect(() => {
    if (!msg) return undefined;
    const t = setTimeout(() => setMsg(""), 3500);
    return () => clearTimeout(t);
  }, [msg]);

  if (!w) return <div className="page"><p className="muted">Procurando a casa…</p></div>;
  if (!house)
    return (
      <div className="page">
        <p className="muted">Esta pessoa ainda não tem casa.</p>
        <Link to="/cidade" className="btn btn-ghost">‹ Voltar à cidade</Link>
      </div>
    );
  const st = liveStats(w, now);
  const left = restLeft(w, now);
  const wall = ["#c9b8a0", "#bcd0e0", "#d8c0d0", "#e3d39a"][house.tier - 1] || "#c9b8a0";
  const decor = Object.keys(w.decor || {}).map((id) => ITEMS[id]).filter(Boolean);

  async function sleep() {
    setBusy(true);
    try {
      const d = await rest(user.uid);
      setMsg(`😴 Descansou: +${d.energy} ⚡ · +${d.health} ❤️‍🩹 · +${d.mood} 😊`);
    } catch (e) {
      setMsg(e.message);
    }
    setBusy(false);
  }

  const vehicle = ITEMS[w.assets?.vehicle];
  const pets = Object.keys(w.pets || {}).map((id) => ITEMS[id]).filter(Boolean);
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>{house.icon} Casa de {w.persona?.name || w.nickname}</h1>
          <p className="muted">{house.name} · {decorCount(w)} móveis</p>
        </div>
        <button type="button" className="btn btn-ghost" onClick={() => navigate("/cidade")}>‹ Voltar à cidade</button>
      </div>
      <svg className="city-map" viewBox="0 0 800 480" style={{ cursor: "default" }} role="img" aria-label="Interior da casa">
        <rect width="800" height="480" fill={wall} />
        <rect y="400" width="800" height="80" fill="#8a6a45" />
        <rect y="396" width="800" height="6" fill="#5c4326" />
        <rect x="600" y="60" width="150" height="120" rx="6" fill={night ? "#0b1030" : "#9bd4ff"} stroke="#f5f5f5" strokeWidth="8" />
        <path d="M675 60 V180 M600 120 H750" stroke="#f5f5f5" strokeWidth="5" />
        <text x="700" y="110" fontSize="26" textAnchor="middle">{night ? "🌙" : "☀️"}</text>
        {house.tier >= 4 && <text x="400" y="40" fontSize="40" textAnchor="middle">🪔</text>}
        {SLOTS.rug && w.decor?.["d-tapete"] && SLOTS.rug("rug")}
        {decor.filter((d) => d.slot !== "rug").map((d) => SLOTS[d.slot]?.(d.id))}
        {vehicle && <text x="60" y="455" fontSize="34">{vehicle.icon}</text>}
        {pets.map((p, i) => <text key={p.id} x={160 + i * 44} y="455" fontSize="28">{p.icon}</text>)}
        <g transform="translate(400 440) scale(0.95)">
          <g transform="translate(-60 -163)">
            <DollShape cfg={dollOf(w)} mood={st.mood} energy={st.energy} health={st.health} />
          </g>
        </g>
        {night && <rect width="800" height="480" fill="#0b1030" opacity="0.28" pointerEvents="none" />}
      </svg>
      <div className="city-hud" style={{ marginTop: 10 }}>
        <span className="city-chip">⚡ {st.energy}/{st.maxEnergy}</span>
        <span className="city-chip">😊 {st.mood}</span>
        <span className="city-chip">❤️‍🩹 {st.health}</span>
        {mine ? (
          <>
            <button type="button" className="btn btn-gradient" disabled={busy || left > 0} onClick={sleep}>
              😴 {left > 0 ? `Descansar em ${Math.ceil(left / 1000)}s` : "Descansar"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => navigate("/economia?abrir=shops")}>🛋️ Comprar móveis</button>
          </>
        ) : (
          <span className="muted">Você está visitando.</span>
        )}
      </div>
      {msg && <p className="game-hint">{msg}</p>}
    </div>
  );
}
