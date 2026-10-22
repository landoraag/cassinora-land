import { useEffect, useMemo, useRef, useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useOnline } from "../lib/presence";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCollection } from "../lib/useCollection";
import { useWallet } from "../components/Casino";
import { DollShape } from "../components/Doll";
import { HOME_ACTIONS, ITEMS, decorCount, interact, liveStats, rest, restLeft } from "../lib/rpg";
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

const SPOTS = { shelf: [115, 428], fireplace: [255, 428], piano: [375, 432], aquarium: [495, 428], tv: [605, 432], sofa: [175, 432], plant: [738, 428] };
const FRIDGE = [772, 428];
const EMOTES = ["👋", "😂", "❤️", "👏", "💃", "😴"];
const X0 = 40, X1 = 760, Y0 = 412, Y1 = 466;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function Bubble({ text, y = -86 }) {
  const w = Math.min(180, 16 + text.length * 6.6);
  return (
    <g transform={`translate(0 ${y})`}>
      <rect x={-w / 2} y="-18" width={w} height="22" rx="10" fill="#fff" stroke="#333" strokeWidth="1.5" />
      <path d="M-5 4 L0 11 L5 4Z" fill="#fff" stroke="#333" strokeWidth="1.5" />
      <rect x="-6" y="2" width="12" height="3" fill="#fff" />
      <text y="-3" fontSize="12" textAnchor="middle" fill="#111" fontWeight="600">{text.slice(0, 26)}</text>
    </g>
  );
}

export default function Casa() {
  const { uid } = useParams();
  const { user } = useAuth();
  const me = useWallet();
  const navigate = useNavigate();
  const { data: wallets } = useCollection("wallets");
  const online = useOnline();
  const now = useNow(1000);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [pos, setPos] = useState({ x: 400, y: 440, dir: 1, dur: 0 });
  const [moving, setMoving] = useState(false);
  const [say, setSay] = useState({ t: "", at: 0 });
  const [text, setText] = useState("");
  const svgRef = useRef(null);
  const posRef = useRef({ x: 400, y: 440 });
  const walkTimer = useRef(null);
  const cool = useRef({});
  const prevX = useRef({});
  const w = uid === user.uid ? me : wallets.find((x) => x.id === uid);
  const house = ITEMS[w?.assets?.house];
  const mine = uid === user.uid;
  const hour = new Date().getHours();
  const night = hour >= 19 || hour < 6;
  const path = `/casa/${uid}`;

  useEffect(() => {
    if (!msg) return undefined;
    const t = setTimeout(() => setMsg(""), 3500);
    return () => clearTimeout(t);
  }, [msg]);

  const publish = (extra = {}) =>
    setDoc(doc(db, "presence", user.uid), { path, at: Date.now(), hx: Math.round(posRef.current.x), hy: Math.round(posRef.current.y), ...extra }, { merge: true }).catch(() => {});

  useEffect(() => {
    publish({ say: "", sayAt: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  function goTo(x, y, then) {
    const tx = clamp(x, X0, X1);
    const ty = clamp(y, Y0, Y1);
    const d = Math.hypot(tx - posRef.current.x, ty - posRef.current.y);
    const dur = Math.max(0.15, d / 200);
    const dir = tx >= posRef.current.x ? 1 : -1;
    posRef.current = { x: tx, y: ty };
    setPos({ x: tx, y: ty, dir, dur });
    setMoving(true);
    publish();
    clearTimeout(walkTimer.current);
    walkTimer.current = setTimeout(() => {
      setMoving(false);
      then?.();
    }, dur * 1000);
  }
  useEffect(() => () => clearTimeout(walkTimer.current), []);

  function floorClick(e) {
    const r = svgRef.current.getBoundingClientRect();
    goTo(((e.clientX - r.left) / r.width) * 800, ((e.clientY - r.top) / r.height) * 480);
  }

  function talk(t) {
    const clean = String(t || "").trim().slice(0, 40);
    if (!clean) return;
    setSay({ t: clean, at: Date.now() });
    publish({ say: clean, sayAt: Date.now() });
  }

  function useFurniture(kind, spot) {
    goTo(spot[0], spot[1], async () => {
      const a = HOME_ACTIONS[kind];
      if (!a) return;
      const t = Date.now();
      if (t - (cool.current[kind] || 0) < 45000) {
        talk(`${a.icon} ${a.say}`);
        setMsg(`${a.icon} Você curtiu um pouco, mas já se sente bem por agora (volte em instantes para ganhar mais).`);
        return;
      }
      cool.current[kind] = t;
      talk(`${a.icon} ${a.say}`);
      try {
        const d = await interact(user.uid, kind);
        setMsg(`${a.icon} ${Object.entries(d).map(([k, v]) => `+${v} ${{ energy: "⚡", mood: "😊", health: "❤️‍🩹" }[k] || k}`).join(" · ")}`);
      } catch (e) {
        setMsg(e.message);
      }
    });
  }

  const guests = useMemo(
    () => online.filter((p) => p.id !== user.uid && p.path === path && Number.isFinite(p.hx)),
    [online, user.uid, path]
  );

  if (!w) return <div className="page"><p className="muted">Procurando a casa…</p></div>;
  if (!house)
    return (
      <div className="page">
        <p className="muted">Esta pessoa ainda não tem casa.</p>
        <Link to="/cidade" className="btn btn-ghost">‹ Voltar à cidade</Link>
      </div>
    );
  const st = liveStats(w, now);
  const myW = me || w;
  const myStats = liveStats(myW, now);
  const left = restLeft(w, now);
  const wall = ["#c9b8a0", "#bcd0e0", "#d8c0d0", "#e3d39a"][house.tier - 1] || "#c9b8a0";
  const decor = Object.keys(w.decor || {}).map((id) => ITEMS[id]).filter(Boolean);
  const vehicle = ITEMS[w.assets?.vehicle];
  const pets = Object.keys(w.pets || {}).map((id) => ITEMS[id]).filter(Boolean);

  async function sleep() {
    setBusy(true);
    try {
      const d = await rest(user.uid);
      talk("😴 Zzz…");
      setMsg(`😴 Descansou: +${d.energy} ⚡ · +${d.health} ❤️‍🩹 · +${d.mood} 😊`);
    } catch (e) {
      setMsg(e.message);
    }
    setBusy(false);
  }

  // entidades ordenadas por profundidade (y)
  const ents = [
    { id: "me", x: pos.x, y: pos.y, dir: pos.dir, dur: pos.dur, mv: moving, cfg: dollOf(myW), name: myW.persona?.name || "Você", say: now - say.at < 7000 ? say.t : "", st: myStats, me: true },
    ...guests.map((p) => {
      const px = prevX.current[p.id];
      const dir = px === undefined || p.hx === px ? 1 : p.hx > px ? 1 : -1;
      prevX.current[p.id] = p.hx;
      return { id: p.id, x: p.hx, y: clamp(p.hy, Y0, Y1), dir, dur: 1.2, mv: false, cfg: p.wallet ? dollOf(p.wallet) : undefined, name: p.wallet?.persona?.name || p.nickname, say: p.say && Date.now() - (p.sayAt || 0) < 7000 ? p.say : "", st: p.wallet ? liveStats(p.wallet, now) : null };
    }),
  ].sort((a, b) => a.y - b.y);

  const spots = decor.filter((d) => SPOTS[d.slot]).map((d) => [d.slot, SPOTS[d.slot], d.id]);
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>{house.icon} Casa de {w.persona?.name || w.nickname}</h1>
          <p className="muted">{house.name} · {decorCount(w)} móveis · 👥 {guests.length + 1} aqui</p>
        </div>
        <button type="button" className="btn btn-ghost" onClick={() => navigate("/cidade")}>‹ Voltar à cidade</button>
      </div>
      <svg ref={svgRef} className="city-map" viewBox="0 0 800 480" style={{ cursor: "pointer", background: "#222" }} onPointerDown={floorClick} role="img" aria-label="Interior da casa">
        <defs>
          <linearGradient id="hw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={shade(wall, 0.12)} /><stop offset="1" stopColor={shade(wall, -0.12)} /></linearGradient>
          <linearGradient id="hf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6f512f" /><stop offset="1" stopColor="#a47a4a" /></linearGradient>
          <filter id="hs" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="3" dy="5" stdDeviation="3" floodColor="#000" floodOpacity=".35" /></filter>
        </defs>
        <rect width="800" height="400" fill="url(#hw)" />
        {Array.from({ length: 12 }, (_, i) => <rect key={i} x={i * 70} y="0" width="2" height="396" fill="rgba(255,255,255,.07)" />)}
        <rect y="396" width="800" height="14" fill="#4a3620" />
        <rect y="410" width="800" height="70" fill="url(#hf)" />
        {Array.from({ length: 6 }, (_, i) => <path key={i} d={`M0 ${416 + i * 12} H800`} stroke="rgba(0,0,0,.18)" />)}
        {Array.from({ length: 14 }, (_, i) => <path key={i} d={`M${i * 62 + ((i % 2) * 20)} 410 L${i * 62 - 60 + ((i % 2) * 20)} 480`} stroke="rgba(0,0,0,.12)" />)}
        <g filter="url(#hs)">
          <rect x="600" y="60" width="150" height="120" rx="6" fill={night ? "#0b1030" : "#9bd4ff"} stroke="#f5f5f5" strokeWidth="8" />
          <path d="M675 60 V180 M600 120 H750" stroke="#f5f5f5" strokeWidth="5" />
          <text x="700" y="110" fontSize="26" textAnchor="middle">{night ? "🌙" : "☀️"}</text>
        </g>
        {house.tier >= 4 && <text x="400" y="40" fontSize="40" textAnchor="middle">🪔</text>}
        {w.decor?.["d-tapete"] && SLOTS.rug("rug")}
        <g filter="url(#hs)">
          {decor.filter((d) => d.slot !== "rug").map((d) => SLOTS[d.slot]?.(d.id))}
          <g>
            <rect x="750" y="300" width="42" height="100" rx="5" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="2" />
            <path d="M750 340 H792" stroke="#9ca3af" strokeWidth="2" />
            <rect x="782" y="316" width="3" height="16" fill="#9ca3af" />
          </g>
        </g>
        {vehicle && <text x="60" y="470" fontSize="30">{vehicle.icon}</text>}
        {pets.map((p, i) => <text key={p.id} x={110 + i * 40} y="472" fontSize="24">{p.icon}</text>)}
        {/* pontos de interação */}
        {[...spots, ["fridge", FRIDGE, "fridge"]].map(([kind, [sx, sy], key]) => (
          <g key={"sp-" + key} style={{ cursor: "pointer" }} onPointerDown={(e) => { e.stopPropagation(); useFurniture(kind, [sx, sy]); }}>
            <circle cx={sx} cy={sy + 6} r="15" fill="rgba(255,255,255,.18)" stroke="#fff" strokeWidth="1.5" strokeDasharray="3 3" className="cy-blink" />
            <text x={sx} y={sy + 11} fontSize="15" textAnchor="middle">{HOME_ACTIONS[kind].icon}</text>
          </g>
        ))}
        {ents.map((e) => (
          <g key={e.id} style={{ transform: `translate(${e.x}px, ${e.y}px)`, transition: `transform ${e.dur}s linear` }} pointerEvents="none">
            <ellipse cx="0" cy="0" rx="22" ry="6" fill="rgba(0,0,0,.32)" />
            <g transform={`scale(${e.dir * 0.8} 0.8) translate(-60 -153)`} className={e.mv ? "doll-walk" : ""}>
              <DollShape cfg={e.cfg} mood={e.st?.mood ?? 60} energy={e.st?.energy} health={e.st?.health} />
            </g>
            <text y="14" fontSize="11" fontWeight="700" textAnchor="middle" fill="#fff" stroke="rgba(0,0,0,.75)" strokeWidth="3" paintOrder="stroke">{e.name}</text>
            {e.say && <Bubble text={e.say} />}
          </g>
        ))}
        {night && <rect width="800" height="480" fill="#0b1030" opacity="0.28" pointerEvents="none" />}
      </svg>
      <div className="city-hud" style={{ marginTop: 10 }}>
        <span className="city-chip">⚡ {myStats.energy}/{myStats.maxEnergy}</span>
        <span className="city-chip">😊 {myStats.mood}</span>
        <span className="city-chip">❤️‍🩹 {myStats.health}</span>
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
      <form className="city-hud" style={{ marginTop: 8 }} onSubmit={(e) => { e.preventDefault(); talk(text); setText(""); }}>
        {EMOTES.map((m) => <button type="button" key={m} className="btn btn-ghost" onClick={() => talk(m)}>{m}</button>)}
        <input className="input" style={{ flex: 1, minWidth: 140 }} value={text} maxLength={40} placeholder="Diga algo…" onChange={(e) => setText(e.target.value)} />
        <button className="btn btn-gradient" type="submit">Falar</button>
      </form>
      <p className="game-hint">Toque no chão para andar. Toque nos móveis com ✨ para usar (sofá, TV, piano, lareira…). Várias pessoas podem entrar na mesma casa.</p>
      {msg && <p className="game-hint">{msg}</p>}
    </div>
  );
}
