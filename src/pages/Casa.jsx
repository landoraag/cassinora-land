import { useEffect, useMemo, useRef, useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { Link, useNavigate, useParams } from "react-router-dom";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { useCollection } from "../lib/useCollection";
import { useOnline } from "../lib/presence";
import { useWallet } from "../components/Casino";
import { DollShape } from "../components/Doll";
import { Shell, HouseDefs, buildHouse, px } from "../components/HouseArt";
import { HOME_ACTIONS, ITEMS, decorCount, interact, liveStats, rest, restLeft } from "../lib/rpg";
import { dollOf } from "../lib/doll";
import { WALL_H } from "../lib/houseplan";
import { useNow } from "../components/RPG";

// Casa em corte isométrico. Os cômodos crescem com o nível da casa. Várias pessoas entram juntas (presence), andam,
// falam em balões e usam os móveis (cada um dá um bônus de energia, humor ou saúde).
const EMOTES = ["👋", "😂", "❤️", "👏", "💃", "😴"];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const BASE_W = 960;
const ASPECT = 1.6;

function Bubble({ text, y = -92 }) {
  const w = Math.min(190, 16 + text.length * 6.6);
  return (
    <g transform={`translate(0 ${y})`}>
      <rect x={-w / 2} y="-18" width={w} height="22" rx="10" fill="#fff" stroke="#333" strokeWidth="1.5" />
      <path d="M-5 4 L0 11 L5 4Z" fill="#fff" stroke="#333" strokeWidth="1.5" />
      <rect x="-6" y="2" width="12" height="3" fill="#fff" />
      <text y="-3" fontSize="12" textAnchor="middle" fill="#111" fontWeight="600">{text.slice(0, 28)}</text>
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
  const [pos, setPos] = useState({ x: 1.2, y: 4.9, dir: 1, dur: 0 });
  const [moving, setMoving] = useState(false);
  const [say, setSay] = useState({ t: "", at: 0 });
  const [text, setText] = useState("");
  const [zoom, setZoom] = useState(1);
  const svgRef = useRef(null);
  const camRef = useRef({ x: 0, y: 0, z: 1 });
  const posRef = useRef({ x: 1.2, y: 4.9 });
  const walkTimer = useRef(null);
  const cool = useRef({});
  const prevX = useRef({});
  const w = uid === user.uid ? me : wallets.find((x) => x.id === uid);
  const house = ITEMS[w?.assets?.house];
  const tier = house?.tier || 1;
  const mine = uid === user.uid;
  const hour = new Date().getHours();
  const night = hour >= 19 || hour < 6;
  const path = `/casa/${uid}`;

  const decorSlots = useMemo(() => new Set(Object.keys(w?.decor || {}).map((id) => ITEMS[id]?.slot).filter(Boolean)), [w?.decor]);
  const built = useMemo(() => buildHouse(tier, (s) => decorSlots.has(s), night), [tier, decorSlots, night]);
  const { plan } = built;

  // enquadramento: casas pequenas cabem inteiras; as grandes seguem o boneco
  const bounds = useMemo(() => ({ x1: -plan.D * 32 - 40, x2: plan.W * 32 + 40, y1: -WALL_H - 40, y2: (plan.W + plan.D) * 16 + 60 }), [plan]);
  useEffect(() => {
    const fit = Math.min(BASE_W / (bounds.x2 - bounds.x1), BASE_W / ASPECT / (bounds.y2 - bounds.y1));
    const z = clamp(fit, 0.9, 1.9);
    camRef.current.z = z;
    camRef.current.x = (bounds.x1 + bounds.x2) / 2;
    camRef.current.y = (bounds.y1 + bounds.y2) / 2;
    setZoom(z);
  }, [bounds]);
  useEffect(() => {
    let raf;
    const tick = () => {
      const svg = svgRef.current;
      const c = camRef.current;
      if (svg) {
        const vw = BASE_W / c.z;
        const vh = vw / ASPECT;
        const bw = bounds.x2 - bounds.x1;
        const bh = bounds.y2 - bounds.y1;
        const [sx, sy] = px(posRef.current.x, posRef.current.y, 40);
        const tx = bw <= vw ? (bounds.x1 + bounds.x2) / 2 : clamp(sx, bounds.x1 + vw / 2, bounds.x2 - vw / 2);
        const ty = bh <= vh ? (bounds.y1 + bounds.y2) / 2 : clamp(sy, bounds.y1 + vh / 2, bounds.y2 - vh / 2);
        c.x += (tx - c.x) * 0.08;
        c.y += (ty - c.y) * 0.08;
        svg.setAttribute("viewBox", `${(c.x - vw / 2).toFixed(1)} ${(c.y - vh / 2).toFixed(1)} ${vw.toFixed(1)} ${vh.toFixed(1)}`);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [bounds]);

  useEffect(() => {
    if (!msg) return undefined;
    const t = setTimeout(() => setMsg(""), 3800);
    return () => clearTimeout(t);
  }, [msg]);

  const publish = (extra = {}) =>
    setDoc(doc(db, "presence", user.uid), { path, at: Date.now(), hx: Math.round(posRef.current.x * 100), hy: Math.round(posRef.current.y * 100), ...extra }, { merge: true }).catch(() => {});

  useEffect(() => {
    publish({ say: "", sayAt: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  function goTo(x, y, then) {
    const tx = clamp(x, 0.7, plan.W - 0.7);
    const ty = clamp(y, 0.9, plan.D - 0.7);
    const d = Math.hypot(tx - posRef.current.x, ty - posRef.current.y);
    const dur = Math.max(0.15, d / 3.4);
    const dir = tx - ty >= posRef.current.x - posRef.current.y ? 1 : -1;
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
    const svg = svgRef.current;
    const p = svg.createSVGPoint();
    p.x = e.clientX;
    p.y = e.clientY;
    const q = p.matrixTransform(svg.getScreenCTM().inverse());
    const u = q.x / 32;
    const v = q.y / 16;
    goTo((u + v) / 2, (v - u) / 2);
  }

  function talk(t) {
    const clean = String(t || "").trim().slice(0, 40);
    if (!clean) return;
    setSay({ t: clean, at: Date.now() });
    publish({ say: clean, sayAt: Date.now() });
  }

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

  function useFurniture(u) {
    goTo(u.stand[0], u.stand[1], async () => {
      if (u.kind === "bed") {
        if (mine) return sleep();
        talk("😴 sentou na cama");
        return undefined;
      }
      const a = HOME_ACTIONS[u.kind];
      if (!a) return undefined;
      const t = Date.now();
      talk(`${a.icon} ${a.say}`);
      if (t - (cool.current[u.kind] || 0) < 45000) {
        setMsg(`${a.icon} Você curtiu um pouco, mas já se sente bem por agora (volte em instantes para ganhar mais).`);
        return undefined;
      }
      cool.current[u.kind] = t;
      try {
        const d = await interact(user.uid, u.kind);
        setMsg(`${a.icon} ${Object.entries(d).map(([k, v]) => `+${v} ${{ energy: "⚡", mood: "😊", health: "❤️‍🩹" }[k] || k}`).join(" · ")}`);
      } catch (e) {
        setMsg(e.message);
      }
      return undefined;
    });
  }

  const guests = useMemo(() => online.filter((p) => p.id !== user.uid && p.path === path && Number.isFinite(p.hx)), [online, user.uid, path]);

  if (!w) return <div className="page"><p className="muted">Procurando a casa…</p></div>;
  if (!house)
    return (
      <div className="page">
        <p className="muted">Esta pessoa ainda não tem casa.</p>
        <Link to="/cidade" className="btn btn-ghost">‹ Voltar à cidade</Link>
      </div>
    );
  const myW = me || w;
  const myStats = liveStats(myW, now);
  const left = restLeft(w, now);
  const vehicle = ITEMS[w.assets?.vehicle];
  const pets = Object.keys(w.pets || {}).map((id) => ITEMS[id]).filter(Boolean);

  const ents = [
    { id: "me", gx: pos.x, gy: pos.y, dir: pos.dir, dur: pos.dur, mv: moving, cfg: dollOf(myW), name: myW.persona?.name || "Você", say: now - say.at < 7000 ? say.t : "", st: myStats },
    ...guests.map((p) => {
      const gx = p.hx / 100;
      const gy = clamp(p.hy / 100, 0.5, plan.D);
      const prev = prevX.current[p.id];
      const dir = prev === undefined || p.hx === prev ? 1 : p.hx - p.hy > prev ? 1 : -1;
      prevX.current[p.id] = p.hx - p.hy;
      return { id: p.id, gx, gy, dir, dur: 1.2, mv: false, cfg: p.wallet ? dollOf(p.wallet) : undefined, name: p.wallet?.persona?.name || p.nickname, say: p.say && Date.now() - (p.sayAt || 0) < 7000 ? p.say : "", st: p.wallet ? liveStats(p.wallet, now) : null };
    }),
  ];
  const draw = [
    ...built.items.map((i) => ({ ...i, d: i.depth })),
    ...ents.map((e) => ({ key: "e-" + e.id, d: e.gx + e.gy + 0.4, ent: e })),
  ].sort((a, b) => a.d - b.d);
  const uses = built.items.filter((i) => i.use).map((i) => i.use);
  const [oxs, oys] = px(0, 0);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>{house.icon} Casa de {w.persona?.name || w.nickname}</h1>
          <p className="muted">{house.name} · {plan.rooms.length} {plan.rooms.length > 1 ? "cômodos" : "cômodo"} · {decorCount(w)} móveis · 👥 {guests.length + 1} aqui</p>
        </div>
        <button type="button" className="btn btn-ghost" onClick={() => navigate("/cidade")}>‹ Voltar à cidade</button>
      </div>
      <div className="city-stage house-stage">
        <svg ref={svgRef} className="city-map" viewBox={`${-BASE_W / 2} 0 ${BASE_W} ${BASE_W / ASPECT}`} style={{ cursor: "pointer", background: "#0b1030" }} onPointerDown={floorClick} role="img" aria-label="Interior da casa">
          <HouseDefs />
          <rect x="-1500" y="-900" width="3500" height="2600" fill="url(#hs-bg)" />
          {Array.from({ length: 40 }, (_, i) => <circle key={i} cx={-700 + ((i * 197) % 1500)} cy={-300 + ((i * 89) % 500)} r={i % 5 ? 1 : 1.6} fill="#fff" opacity=".55" />)}
          <Shell plan={plan} night={night} />
          {draw.map((o) =>
            o.ent ? (
              <g key={o.key} style={{ transform: `translate(${px(o.ent.gx, o.ent.gy)[0]}px, ${px(o.ent.gx, o.ent.gy)[1]}px)`, transition: `transform ${o.ent.dur}s linear` }} pointerEvents="none">
                <ellipse cx="0" cy="0" rx="20" ry="7" fill="rgba(0,0,0,.35)" />
                <g transform={`scale(${o.ent.dir * 0.56} 0.56) translate(-60 -153)`} className={o.ent.mv ? "doll-walk" : ""}>
                  <DollShape cfg={o.ent.cfg} mood={o.ent.st?.mood ?? 60} energy={o.ent.st?.energy} health={o.ent.st?.health} />
                </g>
                <text y="14" fontSize="11" fontWeight="700" textAnchor="middle" fill="#fff" stroke="rgba(0,0,0,.75)" strokeWidth="3" paintOrder="stroke">{o.ent.name}</text>
                {o.ent.say && <Bubble text={o.ent.say} />}
              </g>
            ) : (
              <g key={o.key} className={o.use ? "house-use" : undefined} onPointerDown={o.use ? (e) => { e.stopPropagation(); useFurniture(o.use); } : undefined} style={o.use ? { cursor: "pointer" } : undefined}>{o.node}</g>
            )
          )}
          {uses.map((u) => {
            const [hx, hy] = px(...u.at);
            return (
              <g key={"hint-" + u.kind + u.stand[0]} transform={`translate(${hx} ${hy - 10})`} style={{ cursor: "pointer" }} onPointerDown={(e) => { e.stopPropagation(); useFurniture(u); }}>
                <g className="cm-marker">
                  <circle r="11" fill="#fff" stroke="#f59e0b" strokeWidth="2.2" />
                  <text y="5" fontSize="13" textAnchor="middle">{u.kind === "bed" ? "🛏️" : HOME_ACTIONS[u.kind]?.icon}</text>
                </g>
              </g>
            );
          })}
          {vehicle && <text x={oxs - 60} y={oys + 40} fontSize="1" />}
        </svg>
        <div className="city-zoom">
          <button type="button" aria-label="Aproximar" onClick={() => { camRef.current.z = clamp(camRef.current.z * 1.2, 0.7, 2.6); setZoom(camRef.current.z); }}>＋</button>
          <button type="button" aria-label="Afastar" onClick={() => { camRef.current.z = clamp(camRef.current.z / 1.2, 0.7, 2.6); setZoom(camRef.current.z); }}>－</button>
          <small>{zoom.toFixed(1)}×</small>
        </div>
      </div>
      <div className="city-hud" style={{ marginTop: 10 }}>
        <span className="city-chip">⚡ {myStats.energy}/{myStats.maxEnergy}</span>
        <span className="city-chip">😊 {myStats.mood}</span>
        <span className="city-chip">❤️‍🩹 {myStats.health}</span>
        {pets.length > 0 && <span className="city-chip">{pets.map((p) => p.icon).join(" ")}</span>}
        {mine ? (
          <>
            <button type="button" className="btn btn-gradient" disabled={busy || left > 0} onClick={() => { const b = uses.find((u) => u.kind === "bed"); if (b) useFurniture(b); else sleep(); }}>
              😴 {left > 0 ? `Descansar em ${Math.ceil(left / 1000)}s` : "Descansar na cama"}
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
      <p className="game-hint">Toque no chão para andar e nos móveis com ✨ para usar. A casa cresce com o nível (kitnet, casa, apartamento, mansão) e cada móvel que você compra aparece na sala. Várias pessoas podem entrar juntas.</p>
      {msg && <p className="game-hint">{msg}</p>}
    </div>
  );
}
