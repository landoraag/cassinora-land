import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { useCollection } from "../lib/useCollection";
import { claimPlot, routeTo, snapToWalkable, PLOTS } from "../lib/city";
import Scene, { VIEW } from "./CityArt";
import { DollShape } from "./Doll";
import { dollOf } from "../lib/doll";
import { ITEMS, hasPersona, liveStats } from "../lib/rpg";
import { useOnline } from "../lib/presence";
import { useWallet } from "./Casino";
import { EcoModal } from "./Economy";
import { Hearts, Meter } from "./RPG";
import { MAX_HEALTH } from "../lib/rpg";

const SCALE = 0.37; // tamanho do boneco no mapa
let lastPos = [600, 340]; // lembra onde você parou ao entrar numa casa e voltar

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
  const [night, setNight] = useState(nightLevel());
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      setNight(nightLevel());
      setNow(Date.now());
    }, 30000);
    return () => clearInterval(id);
  }, []);

  // terreno: quem tem casa e ainda não tem um recebe agora
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

  const speedMul = 1 + (ITEMS[wallet?.assets?.vehicle]?.tier || 0) * 0.25;
  const speedRef = useRef(speedMul);
  speedRef.current = speedMul;

  function draw() {
    const s = st.current;
    const g = playerRef.current;
    if (!g) return;
    g.setAttribute("transform", `translate(${s.pos[0].toFixed(1)} ${s.pos[1].toFixed(1)})`);
    dollRef.current?.setAttribute("transform", `scale(${s.dir * SCALE} ${SCALE}) translate(-60 -166)`);
    dollRef.current?.classList.toggle("doll-walk", s.moving);
  }

  function publish(force = false) {
    const s = st.current;
    const t = Date.now();
    if (!force && t - s.lastPub < 15000) return;
    s.lastPub = t;
    setDoc(doc(db, "presence", user.uid), { x: Math.round(s.pos[0]), y: Math.round(s.pos[1]), path: "/cidade", at: t }, { merge: true }).catch(() => {});
  }

  // laço de movimento
  useEffect(() => {
    let raf;
    let last = performance.now();
    draw();
    const tick = (t) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      const s = st.current;
      const speed = 170 * speedRef.current;
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
          const k = speed * dt / Math.hypot(dx, dy);
          const q = snapToWalkable(s.pos[0] + dx * k, s.pos[1] + dy * k);
          s.pos = q.p;
          if (dx) s.dir = dx > 0 ? 1 : -1;
        }
      }
      if (!dx && !dy && s.path.length) {
        const [tx, ty] = s.path[0];
        const vx = tx - s.pos[0];
        const vy = ty - s.pos[1];
        const d = Math.hypot(vx, vy);
        const step = speed * dt;
        if (vx) s.dir = vx > 0 ? 1 : -1;
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
    };
    const up = (e) => st.current.keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    publish(true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function walk(point, onArrive = null) {
    const s = st.current;
    s.path = routeTo(s.pos, point);
    s.onArrive = onArrive;
  }

  function svgPoint(e) {
    const r = svgRef.current.getBoundingClientRect();
    return [VIEW.x + ((e.clientX - r.left) / r.width) * VIEW.w, VIEW.y + ((e.clientY - r.top) / r.height) * VIEW.h];
  }
  const onBg = (e) => walk(svgPoint(e));

  const onBuilding = (b) => {
    walk(b.door, () => {
      publish(true);
      if (b.action.route) navigate(b.action.route);
      else setModal({ name: b.action.eco, shop: b.action.shop });
    });
  };
  const onPlot = (i) => {
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
  const veh = me && ITEMS[me.assets?.vehicle];
  const others = online.filter((p) => p.id !== user.uid && p.path?.startsWith("/cidade") && Number.isFinite(p.x));
  const clock = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="city">
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
      </div>

      <svg ref={svgRef} className="city-map" viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`} onPointerDown={(e) => !e.defaultPrevented && onBg(e)} role="img" aria-label="Mapa da cidade">
        <Scene owners={owners} night={night} onBuilding={(b) => onBuilding(b)} onPlot={onPlot} />
                {others.map((p) => (
          <g key={p.id} style={{ transform: `translate(${p.x}px, ${p.y}px)`, transition: "transform 2.5s linear" }} pointerEvents="none">
            <g transform={`scale(${SCALE}) translate(-60 -166)`}>
              <DollShape cfg={p.wallet ? dollOf(p.wallet) : undefined} mood={p.wallet ? liveStats(p.wallet).mood : 60} />
            </g>
            <text y="-78" fontSize="11" textAnchor="middle" fill="#fff" stroke="rgba(0,0,0,0.7)" strokeWidth="3" paintOrder="stroke">{p.nickname}</text>
          </g>
        ))}
        <g ref={playerRef} pointerEvents="none">
          <ellipse cx="0" cy="0" rx="14" ry="4" fill="rgba(0,0,0,0.3)" />
          {veh && <text x="-30" y="-2" fontSize="22" textAnchor="middle">{veh.icon}</text>}
          {pet && <text x="30" y="-2" fontSize="16" textAnchor="middle">{pet.icon}</text>}
          <g ref={dollRef}>{doll && <DollShape cfg={doll} mood={stats.mood} energy={stats.energy} health={stats.health} />}</g>
          <text y="-80" fontSize="12" fontWeight="700" textAnchor="middle" fill="#fff" stroke="rgba(0,0,0,0.75)" strokeWidth="3" paintOrder="stroke">
            {me?.persona?.name || "Você"}
          </text>
        </g>
      </svg>
      <p className="game-hint city-help">Toque no mapa para andar (ou use as setas / WASD). Toque num prédio para entrar, ou numa casa para visitar.</p>
      {toast && <div className="toast">{toast}</div>}
      {modal && <EcoModal name={modal.name} initialShop={modal.shop} onClose={() => setModal(null)} />}
    </div>
  );
}
