import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { useCollection } from "../lib/useCollection";
import { BUILDINGS, MAP_H, MAP_W, PLOTS, claimPlot, routeTo, snapToWalkable } from "../lib/city";
import { DollShape } from "./Doll";
import { OUTFIT_COLORS, dollOf, shade } from "../lib/doll";
import { ITEMS, hasPersona, liveStats } from "../lib/rpg";
import { useOnline } from "../lib/presence";
import { useWallet } from "./Casino";
import { EcoModal } from "./Economy";
import { Hearts, Meter } from "./RPG";
import { MAX_HEALTH } from "../lib/rpg";

const SCALE = 0.36; // tamanho do boneco no mapa
let lastPos = [600, 340]; // lembra onde você parou ao entrar numa casa e voltar

const nightLevel = (d = new Date()) => {
  const h = d.getHours() + d.getMinutes() / 60;
  if (h >= 20 || h < 5) return 0.5;
  if (h >= 18) return 0.25 * ((h - 18) / 2) + 0.1;
  if (h < 7) return 0.25 * ((7 - h) / 2) + 0.05;
  return 0;
};

/* ---------------- desenhos fixos ---------------- */
function Building({ b, night, onPick }) {
  const roof = b.roof || shade(b.color, -0.3);
  const lit = night > 0.2;
  const win = (x, y, w = 16, h = 18) => <rect key={x + "-" + y} x={x} y={y} width={w} height={h} rx="3" fill={lit ? "#ffe27a" : "#bfe3ff"} stroke="rgba(0,0,0,0.3)" />;
  if (b.kiosk)
    return (
      <g className="city-hit" onClick={() => onPick(b)}>
        <rect x={b.x} y={b.y + 14} width={b.w} height={b.h - 14} rx="4" fill={b.color} stroke="rgba(0,0,0,0.35)" />
        <path d={`M${b.x - 4} ${b.y + 16} L${b.x + 8} ${b.y} L${b.x + b.w - 8} ${b.y} L${b.x + b.w + 4} ${b.y + 16}Z`} fill={roof} />
        <text x={b.x + b.w / 2} y={b.y + 36} fontSize="20" textAnchor="middle">{b.icon}</text>
        <text x={b.x + b.w / 2} y={b.y + b.h + 12} fontSize="9.5" textAnchor="middle" fill="#fff" stroke="rgba(0,0,0,0.6)" strokeWidth="2.4" paintOrder="stroke">{b.name}</text>
      </g>
    );
  const cx = b.x + b.w / 2;
  return (
    <g className="city-hit" onClick={() => onPick(b)}>
      <rect x={b.x} y={b.y + 14} width={b.w} height={b.h - 14} rx="5" fill={b.color} stroke="rgba(0,0,0,0.35)" strokeWidth="1.5" />
      <rect x={b.x - 4} y={b.y} width={b.w + 8} height="20" rx="5" fill={roof} />
      {b.id === "cassino" && <path d={`M${b.x + 20} ${b.y} L${cx} ${b.y - 22} L${b.x + b.w - 20} ${b.y}Z`} fill={b.roof} />}
      <rect x={cx - 11} y={b.y + b.h - 34} width="22" height="34" rx="4" fill="#4a2f1a" />
      <circle cx={cx + 6} cy={b.y + b.h - 17} r="1.8" fill="#facc15" />
      {b.id !== "cassino" && [win(b.x + 10, b.y + 32), win(b.x + b.w - 26, b.y + 32), win(b.x + 10, b.y + 60), win(b.x + b.w - 26, b.y + 60)]}
      {b.id === "cassino" && [win(b.x + 14, b.y + 30), win(b.x + b.w - 30, b.y + 30)]}
      <text x={cx} y={b.y + 15} fontSize="15" textAnchor="middle">{b.icon}</text>
      <text x={cx} y={b.y + b.h + 14} fontSize="11" textAnchor="middle" fill="#fff" stroke="rgba(0,0,0,0.65)" strokeWidth="2.6" paintOrder="stroke" fontWeight="700">
        {b.name}
      </text>
    </g>
  );
}

function HouseBody({ tier, wall, roof, lit }) {
  const win = (x, y, w = 14, h = 14) => <rect key={x + "_" + y} x={x} y={y} width={w} height={h} rx="2" fill={lit ? "#ffe27a" : "#bfe3ff"} stroke="rgba(0,0,0,0.35)" />;
  if (tier <= 1)
    return (
      <g>
        <rect x="20" y="-46" width="70" height="46" fill={wall} stroke="rgba(0,0,0,0.35)" />
        <rect x="16" y="-52" width="78" height="8" fill={roof} />
        {win(28, -36, 16, 14)}
        <rect x="58" y="-30" width="16" height="30" rx="2" fill="#5b3a1e" />
      </g>
    );
  if (tier === 2)
    return (
      <g>
        <rect x="13" y="-60" width="84" height="60" fill={wall} stroke="rgba(0,0,0,0.35)" />
        <path d="M6 -58 L55 -98 L104 -58Z" fill={roof} stroke="rgba(0,0,0,0.3)" />
        <rect x="78" y="-96" width="9" height="22" fill="#7c4a2b" />
        {win(22, -46)}
        {win(74, -46)}
        <rect x="46" y="-34" width="18" height="34" rx="3" fill="#5b3a1e" />
        <path d="M2 0 L2 -12 M10 0 L10 -12 M100 0 L100 -12 M108 0 L108 -12" stroke="#fff" strokeWidth="2" />
      </g>
    );
  if (tier === 3)
    return (
      <g>
        <rect x="18" y="-112" width="74" height="112" fill={wall} stroke="rgba(0,0,0,0.35)" />
        <rect x="14" y="-118" width="82" height="8" fill={roof} />
        {[0, 1, 2, 3].flatMap((r) => [win(26, -102 + r * 24, 14, 14), win(48, -102 + r * 24, 14, 14), win(70, -102 + r * 24, 14, 14)])}
        <rect x="46" y="-24" width="18" height="24" rx="2" fill="#5b3a1e" />
      </g>
    );
  return (
    <g>
      <rect x="4" y="-62" width="102" height="62" fill={wall} stroke="rgba(0,0,0,0.35)" />
      <rect x="38" y="-96" width="34" height="40" fill={shade(wall, -0.06)} stroke="rgba(0,0,0,0.35)" />
      <path d="M0 -62 L55 -90 L110 -62Z" fill={roof} stroke="rgba(0,0,0,0.3)" />
      <path d="M32 -96 L55 -116 L78 -96Z" fill={roof} stroke="rgba(0,0,0,0.3)" />
      <path d="M55 -116 L55 -132 L71 -127 L55 -122" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />
      {win(12, -50)}
      {win(30, -50)}
      {win(70, -50)}
      {win(86, -50)}
      {win(48, -86, 14, 16)}
      <rect x="46" y="-34" width="18" height="34" rx="3" fill="#3f2a17" stroke="#facc15" />
      <path d="M38 0 L38 -50 M72 0 L72 -50" stroke="#fff" strokeWidth="4" />
    </g>
  );
}

function Plot({ i, owner, night, onPick }) {
  const p = PLOTS[i];
  const south = i >= 8;
  const house = owner && ITEMS[owner.assets?.house];
  const accent = owner ? OUTFIT_COLORS[dollOf(owner).outfitColor] : "#888";
  const veh = owner && ITEMS[owner.assets?.vehicle];
  const labelY = south ? 588 : 266;
  return (
    <g className="city-hit" onClick={() => onPick(i)}>
      <rect x={p.x} y={p.y} width={p.w} height={p.h} fill="rgba(60,140,70,0.35)" />
      {house ? (
        <g transform={south ? `translate(${p.x} ${p.y}) scale(1 -1)` : `translate(${p.x} ${p.y + p.h})`}>
          <HouseBody tier={house.tier} wall={shade(accent, 0.62)} roof={shade(accent, -0.2)} lit={night > 0.2} />
        </g>
      ) : (
        <g>
          <path d={`M${p.x + 55} ${south ? p.y + 20 : p.y + p.h - 12} l0 -34`} stroke="#6b4a2a" strokeWidth="3" />
          <rect x={p.x + 24} y={south ? p.y + 36 : p.y + p.h - 70} width="62" height="22" rx="3" fill="#fff" stroke="#c0392b" strokeWidth="2" />
          <text x={p.x + 55} y={south ? p.y + 52 : p.y + p.h - 54} fontSize="11" textAnchor="middle" fill="#c0392b" fontWeight="800">À VENDA</text>
        </g>
      )}
      {veh && <text x={p.x + (south ? 98 : 98)} y={south ? p.y + 20 : p.y + p.h - 4} fontSize="18" textAnchor="middle">{veh.icon}</text>}
      {owner && (
        <g>
          <rect x={p.x + 5} y={labelY - 11} width="100" height="15" rx="7" fill="rgba(0,0,0,0.55)" />
          <text x={p.x + 55} y={labelY} fontSize="10.5" textAnchor="middle" fill="#fff">
            {(owner.persona?.name || owner.nickname || "").slice(0, 16)}
          </text>
        </g>
      )}
    </g>
  );
}

const Scene = memo(function Scene({ owners, night, onBuilding, onPlot }) {
  return (
    <g>
      <rect width={MAP_W} height={MAP_H} fill="#3d8a4b" />
      {/* calçadas */}
      <rect x="0" y="246" width="1200" height="178" fill="#c9c4b6" />
      <rect x="548" y="0" width="104" height="720" fill="#c9c4b6" />
      <rect x="0" y="566" width="1200" height="40" fill="#c9c4b6" />
      {/* ruas */}
      <rect x="0" y="300" width="1200" height="70" fill="#4b4f58" />
      <rect x="560" y="0" width="80" height="720" fill="#4b4f58" />
      <rect x="560" y="300" width="80" height="70" fill="#4b4f58" />
      <path d="M0 335 H560 M640 335 H1200" stroke="#f5d547" strokeWidth="3" strokeDasharray="22 16" />
      <path d="M600 0 V300 M600 370 V720" stroke="#f5d547" strokeWidth="3" strokeDasharray="22 16" />
      {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={566 + i * 15} y="304" width="8" height="26" fill="#fff" opacity="0.75" />)}
      {/* árvores */}
      {[[534, 150], [666, 150], [535, 650], [665, 650], [14, 96], [1186, 96]].map(([x, y], i) => (
        <g key={i}>
          <rect x={x - 3} y={y} width="6" height="16" fill="#6b4a2a" />
          <circle cx={x} cy={y - 4} r="15" fill="#2e7d3a" />
          <circle cx={x - 6} cy={y + 2} r="10" fill="#37914a" />
        </g>
      ))}
      {PLOTS.map((_, i) => <Plot key={i} i={i} owner={owners[i]} night={night} onPick={onPlot} />)}
      {BUILDINGS.map((b) => <Building key={b.id} b={b} night={night} onPick={onBuilding} />)}
    </g>
  );
});

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
    dollRef.current?.setAttribute("transform", `scale(${s.dir * SCALE} ${SCALE}) translate(-60 -163)`);
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
    return [((e.clientX - r.left) / r.width) * MAP_W, ((e.clientY - r.top) / r.height) * MAP_H];
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

      <svg ref={svgRef} className="city-map" viewBox={`0 0 ${MAP_W} ${MAP_H}`} onPointerDown={(e) => !e.defaultPrevented && onBg(e)} role="img" aria-label="Mapa da cidade">
        <Scene owners={owners} night={night} onBuilding={(b) => onBuilding(b)} onPlot={onPlot} />
        <rect width={MAP_W} height={MAP_H} fill="#0b1030" opacity={night} pointerEvents="none" />
        {others.map((p) => (
          <g key={p.id} style={{ transform: `translate(${p.x}px, ${p.y}px)`, transition: "transform 2.5s linear" }} pointerEvents="none">
            <g transform={`scale(${SCALE}) translate(-60 -163)`}>
              <DollShape cfg={p.wallet ? dollOf(p.wallet) : undefined} mood={p.wallet ? liveStats(p.wallet).mood : 60} />
            </g>
            <text y="-70" fontSize="11" textAnchor="middle" fill="#fff" stroke="rgba(0,0,0,0.7)" strokeWidth="3" paintOrder="stroke">{p.nickname}</text>
          </g>
        ))}
        <g ref={playerRef} pointerEvents="none">
          <ellipse cx="0" cy="0" rx="14" ry="4" fill="rgba(0,0,0,0.3)" />
          {veh && <text x="-30" y="-2" fontSize="22" textAnchor="middle">{veh.icon}</text>}
          {pet && <text x="30" y="-2" fontSize="16" textAnchor="middle">{pet.icon}</text>}
          <g ref={dollRef}>{doll && <DollShape cfg={doll} mood={stats.mood} energy={stats.energy} health={stats.health} />}</g>
          <text y="-72" fontSize="12" fontWeight="700" textAnchor="middle" fill="#fff" stroke="rgba(0,0,0,0.75)" strokeWidth="3" paintOrder="stroke">
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
