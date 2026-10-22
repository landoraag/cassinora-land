import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { useCollection } from "../lib/useCollection";
import { MAP_H, MAP_W, PLOTS, claimPlot, routeTo, stepMove } from "../lib/city";
import { Backdrop, Layer, SORTED, depthIndex } from "./CityMap";
import { DollShape } from "./Doll";
import { dollOf } from "../lib/doll";
import { ITEMS, MAX_HEALTH, hasPersona, liveStats } from "../lib/rpg";
import { useOnline } from "../lib/presence";
import { useWallet } from "./Casino";
import { EcoModal } from "./Economy";
import { Hearts, Meter } from "./RPG";

const SCALE = 0.42; // tamanho do boneco no mapa
const ASPECT = 16 / 9;
const MIN_Z = 1;
const MAX_Z = 6;
const clampN = (v, a, b) => Math.max(a, Math.min(b, v));
let lastPos = [1230, 1075]; // lembra onde você parou ao entrar numa casa/loja e voltar
let lastZoom = 3;

const nightLevel = (d = new Date()) => {
  const h = d.getHours() + d.getMinutes() / 60;
  if (h >= 20 || h < 5) return 0.5;
  if (h >= 18) return 0.25 * ((h - 18) / 2) + 0.1;
  if (h < 7) return 0.25 * ((7 - h) / 2) + 0.05;
  return 0;
};

/* ---------------- o mapa ---------------- */
export default function City() {
  const { user } = useAuth();
  const wallet = useWallet();
  const navigate = useNavigate();
  const { data: wallets } = useCollection("wallets");
  const { data: metaList } = useCollection("meta");
  const online = useOnline();
  const svgRef = useRef(null);
  const playerRef = useRef(null);
  const dollRef = useRef(null);
  const st = useRef({ pos: [...lastPos], path: [], onArrive: null, keys: new Set(), moving: false, dir: 1, lastPub: 0 });
  const cam = useRef({ x: lastPos[0], y: lastPos[1] - 40, z: lastZoom, free: false });
  const ptrs = useRef(new Map());
  const gesture = useRef({ moved: false, pinch: 0 });
  const [night, setNight] = useState(nightLevel());
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");
  const [now, setNow] = useState(Date.now());
  const [split, setSplit] = useState(() => depthIndex(lastPos[1]));
  const [driving, setDriving] = useState(false);
  const [zoomShow, setZoomShow] = useState(lastZoom);

  useEffect(() => {
    const id = setInterval(() => {
      setNight(nightLevel());
      setNow(Date.now());
    }, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (wallet?.assets?.house && !Number.isInteger(wallet.plot)) claimPlot(user.uid).catch((e) => say(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet?.assets?.house, wallet?.plot]);

  const owners = useMemo(() => {
    const plots = metaList.find((m) => m.id === "city")?.plots || {};
    const byId = new Map(wallets.map((w) => [w.id, w]));
    const out = {};
    for (const [idx, uid] of Object.entries(plots)) {
      const w = byId.get(uid);
      if (w?.assets?.house) out[idx] = { ...w, id: uid };
    }
    return out;
  }, [metaList, wallets]);

  const say = (t) => {
    setToast(t);
    setTimeout(() => setToast(""), 3200);
  };

  const veh = wallet && ITEMS[wallet.assets?.vehicle];
  const speedRef = useRef(1);
  speedRef.current = driving && veh ? 1.5 + (veh.tier || 1) * 0.5 : 1;
  const drivingRef = useRef(false);
  drivingRef.current = driving;
  const splitRef = useRef(split);

  function applyCam() {
    const svg = svgRef.current;
    if (!svg) return;
    const c = cam.current;
    const w = MAP_W / c.z;
    const h = w / ASPECT;
    c.x = clampN(c.x, w / 2 - 200, MAP_W - w / 2 + 200);
    c.y = clampN(c.y, h / 2 - 150, MAP_H - h / 2 + 150);
    svg.setAttribute("viewBox", `${(c.x - w / 2).toFixed(1)} ${(c.y - h / 2).toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`);
  }
  function setZoom(z) {
    cam.current.z = clampN(z, MIN_Z, MAX_Z);
    lastZoom = cam.current.z;
    setZoomShow(cam.current.z);
    applyCam();
  }

  function draw() {
    const s = st.current;
    const g = playerRef.current;
    if (!g) return;
    g.setAttribute("transform", `translate(${s.pos[0].toFixed(1)} ${s.pos[1].toFixed(1)})`);
    dollRef.current?.setAttribute("transform", `scale(${s.dir * SCALE} ${SCALE}) translate(-60 -153)`);
    dollRef.current?.classList.toggle("doll-walk", s.moving && !drivingRef.current);
    const idx = depthIndex(s.pos[1]);
    if (idx !== splitRef.current) {
      splitRef.current = idx;
      setSplit(idx);
    }
  }

  function publish(force = false) {
    const s = st.current;
    const t = Date.now();
    if (!force && t - s.lastPub < 15000) return;
    s.lastPub = t;
    setDoc(doc(db, "presence", user.uid), { x: Math.round(s.pos[0]), y: Math.round(s.pos[1]), path: "/cidade", at: t }, { merge: true }).catch(() => {});
  }

  // laço de movimento + câmera
  useEffect(() => {
    let raf;
    let last = performance.now();
    applyCam();
    draw();
    const tick = (t) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      const s = st.current;
      const speed = 190 * speedRef.current;
      let dx = 0;
      let dy = 0;
      if (s.keys.size) {
        if (s.keys.has("ArrowLeft") || s.keys.has("a")) dx -= 1;
        if (s.keys.has("ArrowRight") || s.keys.has("d")) dx += 1;
        if (s.keys.has("ArrowUp") || s.keys.has("w")) dy -= 1;
        if (s.keys.has("ArrowDown") || s.keys.has("s")) dy += 1;
        if (dx || dy) {
          s.path = [];
          s.onArrive = null;
          cam.current.free = false;
          const k = (speed * dt) / Math.hypot(dx, dy);
          s.pos = stepMove(s.pos[0], s.pos[1], s.pos[0] + dx * k, s.pos[1] + dy * k);
          if (dx) s.dir = dx > 0 ? 1 : -1;
        }
      }
      if (!dx && !dy && s.path.length) {
        const [tx, ty] = s.path[0];
        const vx = tx - s.pos[0];
        const vy = ty - s.pos[1];
        const d = Math.hypot(vx, vy);
        const step = speed * dt;
        if (Math.abs(vx) > 2) s.dir = vx > 0 ? 1 : -1;
        if (d <= step) {
          s.pos = [tx, ty];
          s.path.shift();
          if (!s.path.length && s.onArrive) {
            const f = s.onArrive;
            s.onArrive = null;
            f();
          }
        } else s.pos = [s.pos[0] + (vx / d) * step, s.pos[1] + (vy / d) * step];
        s.moving = true;
      } else s.moving = !!(dx || dy);
      if (!s.moving) publish();
      lastPos = [...s.pos];
      const c = cam.current;
      if (!c.free) {
        const k = 1 - Math.pow(0.001, dt);
        c.x += (s.pos[0] - c.x) * k;
        c.y += (s.pos[1] - 40 - c.y) * k;
      }
      applyCam();
      draw();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const down = (e) => {
      if (e.target.closest?.("input,textarea,select")) return;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "a", "d", "w", "s"].includes(k)) {
        if (document.querySelector(".modal-backdrop")) return;
        st.current.keys.add(k);
        e.preventDefault();
      }
      if (k === "+" || k === "=") setZoom(cam.current.z * 1.25);
      if (k === "-") setZoom(cam.current.z / 1.25);
    };
    const up = (e) => st.current.keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key);
    const wheel = (e) => {
      e.preventDefault();
      setZoom(cam.current.z * (e.deltaY < 0 ? 1.15 : 1 / 1.15));
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    const svgEl = svgRef.current;
    svgEl?.addEventListener("wheel", wheel, { passive: false });
    publish(true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      svgEl?.removeEventListener("wheel", wheel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function walk(point, onArrive = null) {
    const s = st.current;
    s.path = routeTo(s.pos, point);
    s.onArrive = onArrive;
    cam.current.free = false;
  }

  function svgPoint(e) {
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM().inverse());
    return [p.x, p.y];
  }

  // arrastar = mover a câmera · dois dedos = zoom · toque = andar
  const onPointerDown = (e) => {
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    gesture.current = { moved: false, pinch: 0, sx: e.clientX, sy: e.clientY };
    if (ptrs.current.size === 2) {
      const [a, b] = [...ptrs.current.values()];
      gesture.current.pinch = Math.hypot(a.x - b.x, a.y - b.y);
      gesture.current.z0 = cam.current.z;
      gesture.current.moved = true;
    }
  };
  const onPointerMove = (e) => {
    const p = ptrs.current.get(e.pointerId);
    if (!p) return;
    const g = gesture.current;
    if (ptrs.current.size === 2) {
      ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const [a, b] = [...ptrs.current.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (g.pinch) setZoom(g.z0 * (d / g.pinch));
      return;
    }
    if (!g.moved && Math.hypot(e.clientX - g.sx, e.clientY - g.sy) > 8) g.moved = true;
    if (g.moved) {
      const r = svgRef.current.getBoundingClientRect();
      const k = MAP_W / cam.current.z / r.width;
      cam.current.x -= (e.clientX - p.x) * k;
      cam.current.y -= (e.clientY - p.y) * k;
      cam.current.free = true;
    }
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
  };
  const onPointerUp = (e) => {
    ptrs.current.delete(e.pointerId);
    const g = gesture.current;
    if (!g.moved && ptrs.current.size === 0 && !e.target.closest?.(".city-hit")) walk(svgPoint(e));
    if (ptrs.current.size === 0) setTimeout(() => (gesture.current.moved = false), 0);
  };

  const onBuilding = (b) => {
    if (gesture.current.moved) return;
    walk(b.door, () => {
      publish(true);
      if (b.action.route) navigate(b.action.route);
      else if (b.action.shop) navigate(`/loja/${b.action.shop}`);
      else setModal({ name: b.action.eco });
    });
  };
  const onPlot = (i) => {
    if (gesture.current.moved) return;
    const owner = owners[i];
    walk(PLOTS[i].door, () => {
      if (owner) navigate(`/casa/${owner.id}`);
      else say("Terreno à venda! Compre uma casa na Imobiliária (🏠) para construir aqui.");
    });
  };

  const me = wallet && hasPersona(wallet) ? wallet : null;
  const stats = me ? liveStats(me, now) : null;
  const doll = me ? dollOf(me) : null;
  const pet = me && Object.keys(me.pets || {}).map((id) => ITEMS[id]).find(Boolean);
  const others = online.filter((p) => p.id !== user.uid && p.path?.startsWith("/cidade") && Number.isFinite(p.x) && p.x >= 0 && p.x <= MAP_W && p.y >= 0 && p.y <= MAP_H);
  const clock = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const total = SORTED.length;

  const playerEl = (
    <g ref={playerRef} pointerEvents="none">
      <ellipse cx="0" cy="0" rx={driving ? 28 : 14} ry={driving ? 7 : 4} fill="rgba(0,0,0,0.3)" />
      {pet && !driving && <text x="30" y="-2" fontSize="16" textAnchor="middle">{pet.icon}</text>}
      <g ref={dollRef} style={{ display: driving ? "none" : undefined }}>{doll && <DollShape cfg={doll} mood={stats.mood} energy={stats.energy} health={stats.health} />}</g>
      {driving && veh && (
        <g>
          {doll && <g transform={`scale(0.3 0.3) translate(-60 -263)`}><DollShape cfg={doll} mood={stats.mood} /></g>}
          <text x="0" y="4" fontSize="54" textAnchor="middle">{veh.icon}</text>
        </g>
      )}
      <text y="-74" fontSize="13" fontWeight="700" textAnchor="middle" fill="#fff" stroke="rgba(0,0,0,0.75)" strokeWidth="3" paintOrder="stroke">
        {me?.persona?.name || "Você"}
      </text>
    </g>
  );

  return (
    <div className={"city" + (night > 0.2 ? " is-night" : "")}>
      <div className="city-hud">
        {stats ? (
          <>
            <span className="city-meters">
              <Meter label="⚡" value={stats.energy} max={stats.maxEnergy} kind="energy" />
              <Meter label="😊" value={stats.mood} max={100} kind="mood" />
              <Meter label="❤️‍🩹" value={stats.health} max={MAX_HEALTH} kind="health" />
            </span>
            <span className="city-chip"><Hearts n={stats.lives} /></span>
            <span className="city-chip">🌟 {stats.fame}</span>
          </>
        ) : (
          <button type="button" className="btn btn-gradient" onClick={() => setModal({ name: "create" })}>🧑 Criar meu boneco</button>
        )}
        <span className="city-chip">{night > 0.2 ? "🌙" : "☀️"} {clock}</span>
        <span className="city-chip">🟢 {others.length + 1} na cidade</span>
        {veh && (
          <button type="button" className={"btn " + (driving ? "btn-gradient" : "btn-ghost")} onClick={() => setDriving((d) => !d)}>
            {veh.icon} {driving ? "Descer" : "Dirigir"}
          </button>
        )}
      </div>

      <div className="city-stage">
        <svg ref={svgRef} className="city-map" viewBox="0 0 800 450" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} role="img" aria-label="Mapa da cidade">
          <Backdrop />
          <Layer from={0} to={split} owners={owners} onBuilding={onBuilding} onPlot={onPlot} />
          {playerEl}
          <Layer from={split} to={total} owners={owners} onBuilding={onBuilding} onPlot={onPlot} />
          {others.map((p) => (
            <g key={p.id} style={{ transform: `translate(${p.x}px, ${p.y}px)`, transition: "transform 2.5s linear" }} pointerEvents="none">
              <ellipse rx="14" ry="4" fill="rgba(0,0,0,.3)" />
              <g transform={`scale(${SCALE}) translate(-60 -153)`}>
                <DollShape cfg={p.wallet ? dollOf(p.wallet) : undefined} mood={p.wallet ? liveStats(p.wallet).mood : 60} />
              </g>
              <text y="-74" fontSize="13" textAnchor="middle" fill="#fff" stroke="rgba(0,0,0,0.7)" strokeWidth="3" paintOrder="stroke">{p.nickname}</text>
            </g>
          ))}
        </svg>
        <div className="city-night" style={{ opacity: night > 0.2 ? Math.min(0.55, night) : 0 }} />
        <div className="city-zoom">
          <button type="button" aria-label="Aproximar" onClick={() => setZoom(cam.current.z * 1.3)}>＋</button>
          <button type="button" aria-label="Afastar" onClick={() => setZoom(cam.current.z / 1.3)}>－</button>
          <button type="button" aria-label="Seguir meu boneco" title="Seguir meu boneco" onClick={() => { cam.current.free = false; }}>🎯</button>
          <button type="button" aria-label="Mapa inteiro" title="Ver o mapa inteiro" onClick={() => { cam.current.free = true; cam.current.x = MAP_W / 2; cam.current.y = MAP_H / 2; setZoom(1); }}>🗺️</button>
          <small>{zoomShow.toFixed(1)}×</small>
        </div>
      </div>
      <p className="game-hint city-help">Toque no mapa para andar (ou use as setas / WASD). Arraste para olhar em volta, use a roda do mouse ou dois dedos para aproximar. Toque num prédio para entrar na loja, ou numa casa para visitar.{veh ? " Use Dirigir para andar mais rápido." : " Compre um veículo na Concessionária para dirigir!"}</p>
      {toast && <div className="toast">{toast}</div>}
      {modal && <EcoModal name={modal.name} onClose={() => setModal(null)} />}
    </div>
  );
}
