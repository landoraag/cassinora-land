import { memo } from "react";
import { BUILDINGS, DECOR, ISLAND, LAKES, MAP_H, MAP_W, MINE, PLOTS, ROADS, TREES, plotBody } from "../lib/city";
import { OUTFIT_COLORS, dollOf, shade } from "../lib/doll";
import { ITEMS } from "../lib/rpg";

// A cidade vista de cima (3/4): cada coisa tem uma base no chão (x, y, w, h) e uma altura z; o topo aparece
// deslocado para cima e a parede da frente fica visível. Tudo é ordenado pelo "pé" (y + h) — o boneco entra no meio da fila.
const EDGE = "rgba(20,20,40,.28)";
const f = (n) => Math.round(n * 10) / 10;
const WALL = (c) => shade(c, -0.18);
const TOP = (c) => shade(c, 0.16);

function Block({ x, y, w, h, z, c, top, wall, shadow = true, children, windows, rows, lit, cols }) {
  const t = top || TOP(c);
  const wl = wall || WALL(c);
  const wy = y + h - z;
  return (
    <g>
      {shadow && <polygon points={`${x + w},${y + h} ${x + w + z * 0.45},${y + h - z * 0.1} ${x + w + z * 0.45},${y - z + h * 0.4} ${x + w},${y - z}`} fill="rgba(15,30,15,.22)" />}
      {shadow && <polygon points={`${x},${y + h} ${x + w},${y + h} ${x + w + z * 0.45},${y + h + z * 0.18} ${x + z * 0.45},${y + h + z * 0.18}`} fill="rgba(15,30,15,.2)" />}
      <rect x={x} y={wy} width={w} height={z} fill={wl} stroke={EDGE} />
      {windows && <WinGrid x={x + 3} y={wy + 4} w={w - 6} h={z - 12} cols={cols || Math.max(2, Math.floor(w / 14))} rows={rows || Math.max(1, Math.floor(z / 18))} />}
      <rect x={x} y={y - z} width={w} height={h} fill={t} stroke={EDGE} strokeLinejoin="round" />
      {children}
    </g>
  );
}
function WinGrid({ x, y, w, h, cols, rows }) {
  const gap = 3;
  const cw = (w - gap * (cols + 1)) / cols;
  const rh = (h - gap * (rows + 1)) / rows;
  const out = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) out.push(<rect key={r + "_" + c} className="cm-win" x={f(x + gap + c * (cw + gap))} y={f(y + gap + r * (rh + gap))} width={f(cw)} height={f(rh)} />);
  return <g>{out}</g>;
}
const Door = ({ x, y, w, h, c = "#6b4423" }) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx="2" fill={c} stroke={EDGE} />
    <circle cx={x + w * 0.8} cy={y + h * 0.55} r="1.6" fill="#ffd34d" />
  </g>
);
function Awning({ x, y, w, h = 13, c1 = "#fff", c2 = "#d94f3a", n = 8 }) {
  return (
    <g>
      {Array.from({ length: n }, (_, i) => (
        <path key={i} d={`M${f(x + (i * w) / n)} ${y} h${f(w / n)} l2 ${h} h${f(-w / n - 4)}Z`} fill={i % 2 ? c1 : c2} stroke="rgba(0,0,0,.15)" strokeWidth=".6" />
      ))}
    </g>
  );
}
const Sign = ({ x, y, w, h = 15, bg, fg, text, size }) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx="3" fill={bg} stroke={EDGE} />
    <text x={x + w / 2} y={y + h * 0.72} fontSize={size || Math.min(h * 0.7, (w / Math.max(4, text.length)) * 1.5)} fontWeight="900" textAnchor="middle" fill={fg}>{text}</text>
  </g>
);

/* ---------- árvores, postes etc. ---------- */
function Tree({ x, y, s, c }) {
  return (
    <g>
      <ellipse cx={x + 5 * s} cy={y + 2} rx={13 * s} ry={5 * s} fill="rgba(20,30,20,.25)" />
      <rect x={x - 2.2 * s} y={y - 14 * s} width={4.4 * s} height={14 * s} fill="#7a5a3a" />
      <circle cx={x} cy={y - 26 * s} r={15 * s} fill={shade(c, -0.12)} />
      <circle cx={x - 5 * s} cy={y - 30 * s} r={11 * s} fill={c} />
      <circle cx={x + 6 * s} cy={y - 24 * s} r={9 * s} fill={shade(c, 0.1)} />
      <circle cx={x - 6 * s} cy={y - 34 * s} r={4 * s} fill={shade(c, 0.22)} opacity=".7" />
    </g>
  );
}
function Lamp({ x, y }) {
  return (
    <g>
      <ellipse cx={x + 2} cy={y + 1} rx="5" ry="2" fill="rgba(0,0,0,.2)" />
      <rect x={x - 1.2} y={y - 30} width="2.4" height="30" fill="#3d424e" />
      <circle cx={x} cy={y - 31} r="3.6" fill="#fff3b0" stroke={EDGE} className="cm-lamp" />
    </g>
  );
}

/* ---------- casinhas, prédios, fábricas (enfeite) ---------- */
function Decor({ d }) {
  if (d.kind === "house")
    return (
      <Block x={d.x} y={d.y} w={d.w} h={d.h} z={d.z} c={d.c} top={d.roof}>
        <path d={`M${d.x} ${f(d.y - d.z + d.h * 0.5)} H${d.x + d.w}`} stroke="rgba(0,0,0,.25)" />
        <rect className="cm-win" x={d.x + 3} y={d.y + d.h - d.z + 2} width="4" height="5" />
        <rect x={d.x + d.w - 7} y={d.y + d.h - 8} width="4.5" height="8" fill="#6b4423" />
      </Block>
    );
  if (d.kind === "block" || d.kind === "tower")
    return (
      <Block x={d.x} y={d.y} w={d.w} h={d.h} z={d.z} c={d.c} windows>
        {d.kind === "tower" && <rect x={d.x + d.w * 0.3} y={d.y - d.z + d.h * 0.3} width={d.w * 0.4} height={d.h * 0.4} fill={shade(d.c, -0.1)} />}
        {d.z > 150 && <path d={`M${f(d.x + d.w / 2)} ${f(d.y - d.z)} v-14`} stroke="#555" strokeWidth="1.5" />}
      </Block>
    );
  // fábrica
  return (
    <g>
      <Block x={d.x} y={d.y} w={d.w} h={d.h} z={d.z} c={d.c} windows rows={1}>
        {Array.from({ length: 4 }, (_, i) => <path key={i} d={`M${f(d.x + 4 + i * (d.w / 4))} ${f(d.y - d.z + d.h - 4)} l${f(d.w / 8)} -${f(d.h * 0.5)} l${f(d.w / 8)} ${f(d.h * 0.5)}Z`} fill={shade(d.c, -0.12)} />)}
      </Block>
      {d.chim && (
        <g>
          <rect x={d.x + d.w - 22} y={d.y - d.z - 60} width="14" height={60 + d.h * 0.7} fill="#8c4a3a" stroke={EDGE} />
          <rect x={d.x + d.w - 22} y={d.y - d.z - 60} width="14" height="6" fill="#d94f3a" />
          {[0, 1, 2].map((k) => <circle key={k} className="cy-smoke" style={{ animationDelay: -k * 1.3 + "s" }} cx={d.x + d.w - 15} cy={d.y - d.z - 64} r={6 + k * 2} fill="#e5e7eb" opacity=".75" />)}
        </g>
      )}
    </g>
  );
}

/* ---------- prédios que dá para entrar ---------- */
const SIGN = { bank: ["BANCO", "#1f4f8a", "#ffd45a"], market: ["MERCADO", "#fff4dc", "#b45a10"], hospital: ["HOSPITAL", "#2aa0a8", "#fff"], school: ["ESCOLA", "#fff4dc", "#8a4a12"], tower: ["EMPREGOS", "#0f3d44", "#7ff0ff"], cine: ["CINE ★", "#1f1233", "#fde047"], estate: ["IMOBILIÁRIA", "#fff", "#0f766e"], autos: ["AUTO CENTER", "#2b1a08", "#ffd07a"], casino: ["CASSINORA", "#1b0b0b", "#ffd34d"], college: ["FACULDADE", "#4a3a1a", "#ffe9a8"] };
function Building({ b, onPick }) {
  const { x, y, w, h, z, color: c, kind } = b;
  const wy = y + h - z;
  const [txt, sbg, sfg] = SIGN[kind] || [b.name.toUpperCase().slice(0, 10), "#fff", "#333"];
  const ty = y - z;
  const doorH = Math.min(30, z * 0.7);
  let roof = null;
  let wall = null;
  let top = null;
  if (kind === "bank") {
    top = "#3a9c6e";
    roof = <g stroke="rgba(0,0,0,.22)">{Array.from({ length: 6 }, (_, i) => <path key={i} d={`M${x + 3} ${ty + 6 + i * (h / 6.5)} H${x + w - 3}`} />)}<path d={`M${x + w / 2} ${ty + 3} V${ty + h - 3}`} /></g>;
    wall = (
      <g>
        {[5, w * 0.3, w * 0.62, w - 14].map((cx, i) => <rect key={i} x={x + cx} y={wy + 14} width="9" height={z - 16} fill="#fbf6ea" stroke={EDGE} />)}
        <rect x={x} y={wy + z - 5} width={w} height="5" fill="#d8ceb4" />
      </g>
    );
  } else if (kind === "market") {
    roof = [0, 1, 2].map((i) => <rect key={i} x={x + 6 + i * (w / 3.2)} y={ty + 8} width="11" height="9" fill="#cbd5e1" stroke={EDGE} />);
    wall = <Awning x={x + 2} y={wy + 14} w={w - 4} c2="#2f9e5b" n={8} h={10} />;
  } else if (kind === "hospital") {
    top = "#f1f5f7";
    roof = (
      <g>
        <circle cx={x + w / 2} cy={ty + h / 2} r={Math.min(w, h) * 0.32} fill="#3b4a6b" stroke="#ffd45a" strokeWidth="2" />
        <text x={x + w / 2} y={ty + h / 2 + 8} fontSize="22" fontWeight="900" textAnchor="middle" fill="#fff">H</text>
      </g>
    );
    wall = <g><rect x={x + w / 2 - 3} y={wy + 12} width="6" height="16" fill="#ef4444" /><rect x={x + w / 2 - 8} y={wy + 17} width="16" height="6" fill="#ef4444" /></g>;
  } else if (kind === "school") {
    top = "#3a6bb8";
    roof = (
      <g>
        {Array.from({ length: 7 }, (_, i) => <path key={i} d={`M${x + 3} ${ty + 6 + i * 9} H${x + w - 3}`} stroke="rgba(255,255,255,.25)" />)}
        <rect x={x + w / 2 - 9} y={ty + 6} width="18" height="18" fill="#e8a35a" stroke={EDGE} />
        <circle cx={x + w / 2} cy={ty + 15} r="5" fill="#fff" stroke="#4a2f1a" />
      </g>
    );
  } else if (kind === "tower") {
    top = "#34a3b0";
    roof = (
      <g>
        <rect x={x + 8} y={ty + 8} width={w - 16} height={h - 16} fill="#2b8f9a" stroke={EDGE} />
        <path d={`M${x + w / 2} ${ty + h / 2} v-24`} stroke="#64748b" strokeWidth="2" />
        <circle cx={x + w / 2} cy={ty + h / 2 - 24} r="3" fill="#ef4444" className="cy-blink" />
      </g>
    );
    wall = [0, 1].map((i) => <rect key={i} x={x} y={wy + 20 + i * (z * 0.42)} width={w} height="3" fill="#ff9a3c" />);
  } else if (kind === "cine") {
    top = "#3a1030";
    roof = <text x={x + w / 2} y={ty + h / 2 + 8} fontSize="26" textAnchor="middle" fill="#fde047" className="cy-blink">★</text>;
    wall = [0, 1, 2].map((i) => <rect key={i} x={x + 3 + i * ((w - 6) / 3)} y={wy + 20} width={(w - 6) / 3 - 3} height={z - 26} fill={["#22d3ee", "#f97316", "#a3e635"][i]} stroke="#fde047" strokeWidth=".8" />);
  } else if (kind === "estate") {
    top = "#c0562e";
    roof = <g stroke="rgba(0,0,0,.25)">{Array.from({ length: 7 }, (_, i) => <path key={i} d={`M${x + 3} ${ty + 6 + i * 9} H${x + w - 3}`} />)}<path d={`M${x + w / 2} ${ty} V${ty + h}`} stroke="#8a3a1a" strokeWidth="3" /></g>;
    wall = [6, w - 26].map((cx) => <rect key={cx} x={x + cx} y={wy + 18} width="20" height={z - 24} className="cm-win" />);
  } else if (kind === "autos") {
    roof = <g>{Array.from({ length: 9 }, (_, i) => <path key={i} d={`M${x + 2 + i * (w / 9)} ${ty + h - 6} l5 0 l-2.5 9Z`} fill={["#ffd45a", "#43a874", "#3b82c4", "#d94f3a"][i % 4]} />)}</g>;
    wall = (
      <g>
        <rect x={x + 3} y={wy + 14} width={w - 6} height={z - 14} fill="#bfe8f5" className="cm-win" />
        <rect x={x + 6} y={wy + z - 15} width={w * 0.38} height="11" rx="4" fill="#d94f3a" />
        <rect x={x + w * 0.52} y={wy + z - 15} width={w * 0.38} height="11" rx="4" fill="#3b82c4" />
      </g>
    );
  } else if (kind === "casino") {
    top = "#7a1f1f";
    roof = (
      <g>
        <ellipse cx={x + w / 2} cy={ty + h / 2 + 6} rx={w * 0.36} ry={h * 0.3} fill="#d4a017" stroke="#8a6a00" />
        <ellipse cx={x + w / 2} cy={ty + h / 2 - 4} rx={w * 0.28} ry={h * 0.22} fill="#ffd34d" stroke="#8a6a00" />
        <path d={`M${x + w / 2} ${ty + h / 2 - 22} l4 -11 l4 11 l11 4 l-11 4 l-4 11 l-4 -11 l-11 -4Z`} fill="#fff" className="cy-blink" />
      </g>
    );
    wall = (
      <g>
        <rect x={x} y={wy + z - 6} width={w} height="6" fill="#dc2626" />
        {Array.from({ length: 12 }, (_, i) => <circle key={i} cx={x + 6 + i * ((w - 12) / 11)} cy={wy + 22} r="2.2" fill="#ffd34d" className={i % 2 ? "cy-blink" : "cy-blink b"} />)}
      </g>
    );
  } else if (kind === "college") {
    top = "#cdb98f";
    roof = (
      <g>
        <rect x={x + w / 2 - 10} y={ty + 4} width="20" height={h - 8} fill="#e8d8b0" stroke={EDGE} />
        <circle cx={x + w / 2} cy={ty + h / 2} r="7" fill="#fff" stroke="#4a3a1a" strokeWidth="1.5" />
        <path d={`M${x + w / 2} ${ty + h / 2} v-4 M${x + w / 2} ${ty + h / 2} h3`} stroke="#4a3a1a" />
      </g>
    );
    wall = [4, 14, w - 24, w - 14].map((cx) => <rect key={cx} x={x + cx} y={wy + 12} width="7" height={z - 14} fill="#fbf6ea" stroke={EDGE} />);
  } else {
    // quiosque
    top = null;
    roof = <Awning x={x} y={ty + 2} w={w} h={h - 4} c2={c} n={6} />;
  }
  const isK = kind === "kiosk";
  const mk = ty - 20;
  return (
    <g className="city-hit" onClick={() => onPick(b)}>
      <Block x={x} y={y} w={w} h={h} z={z} c={c} top={top || undefined} windows={!wall && !isK && kind !== "tower"} rows={Math.max(1, Math.floor((z - 22) / 16))}>
        {roof}
      </Block>
      {kind === "tower" && <WinGrid x={x + 3} y={wy + 4} w={w - 6} h={z - 8} cols={5} rows={Math.floor(z / 11)} />}
      {wall}
      {!isK && <Sign x={x + 3} y={wy + 2} w={w - 6} h={13} bg={sbg} fg={sfg} text={txt} />}
      {isK ? <rect x={x + 3} y={wy + 5} width={w - 6} height={z - 6} fill="rgba(255,255,255,.25)" /> : null}
      <Door x={b.door[0] - 7} y={y + h - doorH} w="14" h={doorH} c={isK ? "#5b3a1e" : "#4a2f1a"} />
      <g className="cm-marker" transform={`translate(${x + w / 2} ${mk})`}>
        <circle r="13" fill="#fff" stroke="#3b82f6" strokeWidth="2.4" />
        <text y="6" fontSize="16" textAnchor="middle">{b.icon}</text>
        <path d="M-5 11 L0 18 L5 11Z" fill="#3b82f6" />
      </g>
      <text x={x + w / 2} y={y + h + 14} fontSize="11.5" textAnchor="middle" fill="#fff" stroke="rgba(15,20,45,.85)" strokeWidth="3.2" paintOrder="stroke" fontWeight="800">{b.name}</text>
    </g>
  );
}

/* ---------- terrenos e casas dos jogadores ---------- */
function PlotHouse({ p, tier, wall, roof }) {
  const b = plotBody(p);
  const grow = [0.78, 0.9, 1, 1][tier - 1] || 1;
  const w = b.w * grow;
  const h = b.h * grow;
  const x = b.x + (b.w - w) / 2;
  const y = b.y + (b.h - h);
  const z = [22, 28, 46, 40][tier - 1] || 26;
  return (
    <g>
      <Block x={x} y={y} w={w} h={h} z={z} c={wall} top={roof} windows rows={Math.max(1, Math.floor((z - 14) / 16))} cols={Math.max(2, Math.floor(w / 18))}>
        <path d={`M${x} ${f(y - z + h / 2)} H${x + w}`} stroke="rgba(0,0,0,.28)" strokeWidth="1.5" />
        {tier >= 3 && <rect x={x + w * 0.35} y={y - z + 4} width={w * 0.3} height={h * 0.35} fill={shade(roof, -0.2)} />}
        {tier >= 4 && <path d={`M${x + w - 8} ${y - z} v-26`} stroke="#555" strokeWidth="1.6" />}
      </Block>
      {tier >= 4 && <path d={`M${x + w - 8} ${y - z - 26} l14 4 l-14 4Z`} fill="#ffd45a" stroke="#ca8a04" className="cy-flag" />}
      <Door x={x + w / 2 - 6} y={y + h - 18} w="12" h="18" c="#6b4423" />
      {tier >= 3 && <rect x={p.x + 6} y={p.y + p.h - 18} width={p.w * 0.32} height="14" rx="3" fill="#3bb7e0" stroke="#eef3f6" strokeWidth="2" />}
    </g>
  );
}
function Plot({ i, owner, onPick }) {
  const p = PLOTS[i];
  const houseItem = owner && ITEMS[owner.assets?.house];
  const accent = owner ? OUTFIT_COLORS[dollOf(owner).outfitColor] : "#9aa3b2";
  const veh = owner && ITEMS[owner.assets?.vehicle];
  const cx = p.x + p.w / 2;
  return (
    <g className="city-hit" onClick={() => onPick(i)}>
      <rect x={p.x} y={p.y} width={p.w} height={p.h + 4} rx="5" fill="#7fcf6a" stroke="#4c9a46" strokeWidth="2" />
      <rect x={cx - 8} y={p.y + p.h - 12} width="16" height="16" fill="#ddd2b6" />
      {houseItem ? (
        <PlotHouse p={p} tier={houseItem.tier} wall={shade(accent, 0.55)} roof={shade(accent, -0.1)} />
      ) : (
        <g>
          <rect x={cx - 1.5} y={p.y + p.h - 30} width="3" height="28" fill="#6b4a2a" />
          <rect x={cx - 26} y={p.y + p.h - 52} width="52" height="24" rx="3" fill="#fff" stroke="#d94f3a" strokeWidth="2" />
          <text x={cx} y={p.y + p.h - 36} fontSize="11" textAnchor="middle" fill="#d94f3a" fontWeight="900">À VENDA</text>
        </g>
      )}
      {veh && <text x={p.x + p.w - 14} y={p.y + p.h + 2} fontSize="20" textAnchor="middle">{veh.icon}</text>}
      {owner && (
        <g>
          <rect x={cx - 48} y={p.y + p.h + 8} width="96" height="15" rx="7" fill="rgba(15,20,45,.75)" />
          <text x={cx} y={p.y + p.h + 19} fontSize="10.5" textAnchor="middle" fill="#fff" fontWeight="700">{(owner.persona?.name || owner.nickname || "").slice(0, 16)}</text>
        </g>
      )}
    </g>
  );
}

/* ---------- chão ---------- */
const rr = (o, m = 0) => <rect x={o.x - m} y={o.y - m} width={o.w + 2 * m} height={o.h + 2 * m} />;
function Ground() {
  const I = ISLAND;
  const sandM = 34;
  return (
    <g pointerEvents="none">
      <rect x="-400" y="-300" width={MAP_W + 800} height={MAP_H + 600} fill="url(#cm-sea)" />
      {Array.from({ length: 60 }, (_, i) => {
        const x = ((i * 389) % (MAP_W + 600)) - 300;
        const y = ((i * 613) % (MAP_H + 400)) - 200;
        return <path key={i} className="cy-wave" style={{ animationDelay: -(i % 6) * 0.7 + "s" }} d={`M${x} ${y} q8 -6 16 0 t16 0 t16 0`} fill="none" stroke="#fff" strokeWidth="2" opacity=".4" />;
      })}
      <rect x={I.x - sandM} y={I.y - sandM} width={I.w + 2 * sandM} height={I.h + 2 * sandM} rx={I.r + sandM} fill="#f0dc9c" stroke="#fff" strokeWidth="5" strokeDasharray="3 14" strokeLinecap="round" />
      <rect x={I.x} y={I.y} width={I.w} height={I.h} rx={I.r} fill="#6cbf5a" />
      {Array.from({ length: 30 }, (_, i) => <rect key={i} x={I.x} y={I.y + i * 48} width={I.w} height="24" fill="rgba(255,255,255,.04)" />)}
      {/* calçadas, asfalto e faixas */}
      <g fill="#e3d8bf">{ROADS.map((r, i) => <g key={i}>{rr(r, 5)}</g>)}</g>
      <g fill="#555a66">{ROADS.map((r, i) => <g key={i}>{rr(r)}</g>)}</g>
      {ROADS.map((r, i) => (r.v ? <path key={i} d={`M${r.x + r.w / 2} ${r.y + 6} V${r.y + r.h - 6}`} stroke="#f5d547" strokeWidth="2.4" strokeDasharray="14 10" fill="none" /> : <path key={i} d={`M${r.x + 6} ${r.y + r.h / 2} H${r.x + r.w - 6}`} stroke="#f5d547" strokeWidth="2.4" strokeDasharray="14 10" fill="none" />))}
      {/* lagos */}
      {LAKES.map((l, i) => (
        <g key={i}>
          <ellipse cx={l.x} cy={l.y} rx={l.rx + 6} ry={l.ry + 5} fill="#e8d9a6" />
          <ellipse cx={l.x} cy={l.y} rx={l.rx} ry={l.ry} fill="#4fb8e3" stroke="#2c8fc0" strokeWidth="2" />
          <path d={`M${l.x - l.rx * 0.5} ${l.y} q8 -5 16 0 t16 0`} stroke="#fff" fill="none" opacity=".7" />
        </g>
      ))}
      {/* mina */}
      {[1, 0.82, 0.64, 0.46, 0.3].map((s, i) => <ellipse key={i} cx={MINE.x} cy={MINE.y + i * 5} rx={MINE.rx * s} ry={MINE.ry * s} fill={["#9a7048", "#8a6340", "#7c583a", "#6a4a30", "#4a3220"][i]} stroke="rgba(0,0,0,.25)" />)}
      <path d={`M${MINE.x - 20} ${MINE.y - 10} L${MINE.x + 120} ${MINE.y - 70}`} stroke="#7a5d00" strokeWidth="9" strokeLinecap="round" />
      <path d={`M${MINE.x - 20} ${MINE.y - 10} L${MINE.x + 120} ${MINE.y - 70}`} stroke="#f4c20d" strokeWidth="6" strokeLinecap="round" />
      <path d={`M${MINE.x - 20} ${MINE.y - 10} L${MINE.x + 120} ${MINE.y - 70}`} stroke="#fff6bf" strokeWidth="1.5" strokeDasharray="4 7" className="cy-belt" />
      {/* ferris wheel */}
      <g transform={`translate(${770 * 2.4} ${100 * 2.4})`}>
        <ellipse cx="0" cy="8" rx="46" ry="10" fill="rgba(0,0,0,.2)" />
        <path d="M-34 6 L0 -88 L34 6" fill="none" stroke="#64748b" strokeWidth="4" />
        <circle cx="0" cy="-88" r="52" fill="none" stroke="#94a3b8" strokeWidth="3" />
        <g className="cy-spin" style={{ transformOrigin: "0px -88px" }}>
          {Array.from({ length: 10 }, (_, i) => {
            const a = (i / 10) * Math.PI * 2;
            const x = Math.cos(a) * 52, y = -88 + Math.sin(a) * 52;
            return <g key={i}><path d={`M0 -88 L${f(x)} ${f(y)}`} stroke="#cbd5e1" strokeWidth="1.4" /><rect x={x - 6} y={y - 4} width="12" height="10" rx="2" fill={["#d94f3a", "#e8b93a", "#3b82c4", "#43a874"][i % 4]} stroke={EDGE} /></g>;
          })}
        </g>
      </g>
    </g>
  );
}
function Docks() {
  const I = ISLAND;
  return (
    <g pointerEvents="none">
      {[[0.12, 1], [0.34, 1], [0.7, 1]].map(([t], i) => (
        <g key={i}>
          <rect x={I.x + I.w * t} y={I.y + I.h + 6} width="22" height="86" fill="#9a6a3a" stroke={EDGE} />
          <g className="cy-bob" transform={`translate(${I.x + I.w * t + 40} ${I.y + I.h + 60})`}>
            <path d="M0 0 h44 l-8 16 h-30Z" fill={["#1f2a44", "#7c4a22", "#b33a3a"][i]} stroke={EDGE} />
            <rect x="8" y="-14" width="14" height="14" fill="#d94f3a" /><rect x="22" y="-14" width="14" height="14" fill="#3b82c4" />
          </g>
        </g>
      ))}
      <g className="cy-bob"><path d={`M${I.x - 120} ${I.y + 160} h60 l-10 18 h-40Z`} fill="#7c4a22" /><path d={`M${I.x - 94} ${I.y + 156} v-44 l26 42Z`} fill="#fff" stroke={EDGE} /></g>
      <g className="cy-bob"><path d={`M${I.x + I.w + 70} ${I.y + 300} h60 l-10 18 h-40Z`} fill="#1f2a44" /><path d={`M${I.x + I.w + 96} ${I.y + 296} v-40 l24 38Z`} fill="#fff" stroke={EDGE} /></g>
      <g className="cy-bob"><path d={`M${I.x - 180} ${I.y + 420} h120 l-16 24 h-90Z`} fill="#1f2a44" stroke={EDGE} /><rect x={I.x - 160} y={I.y + 392} width="26" height="28" fill="#d94f3a" /><rect x={I.x - 132} y={I.y + 392} width="26" height="28" fill="#3b82c4" /><rect x={I.x - 104} y={I.y + 398} width="24" height="22" fill="#e8b93a" /></g>
    </g>
  );
}

/* ---------- carros nas ruas ---------- */
const CAR_COLORS = ["#d94f3a", "#3b82c4", "#e8b93a", "#43a874", "#e8832a", "#8a63c7", "#eef0f4", "#d9548f"];
function MiniCar({ c, dir = 1 }) {
  return (
    <g transform={`scale(${dir} 1)`}>
      <ellipse cx="0" cy="8" rx="19" ry="4" fill="rgba(0,0,0,.25)" />
      <rect x="-18" y="-8" width="36" height="14" rx="4" fill={c} stroke={EDGE} />
      <rect x="-9" y="-16" width="20" height="10" rx="3" fill={shade(c, 0.15)} stroke={EDGE} />
      <rect x="-7" y="-14" width="7" height="6" fill="#bfe8f5" /><rect x="2" y="-14" width="7" height="6" fill="#bfe8f5" />
      <circle cx="-10" cy="6" r="3.4" fill="#222" /><circle cx="10" cy="6" r="3.4" fill="#222" />
    </g>
  );
}
function Traffic() {
  const hz = [[458, 1, 40], [458, -1, 34], [385, 1, 46], [270, -1, 38], [205, 1, 52], [205, -1, 44], [330, 1, 40]];
  const vt = [[511, 1, 36], [511, -1, 42], [725, 1, 34], [725, -1, 40], [283, 1, 30]];
  const cars = [];
  hz.forEach(([y, dir, dur], i) => cars.push(
    <g key={"h" + i} transform={`translate(${dir > 0 ? 280 * 2.4 : 740 * 2.4} ${(y + (dir > 0 ? 3 : -3)) * 2.4})`}>
      <g className="cm-h" style={{ "--d": `${dir * 460 * 2.4}px`, animationDuration: dur + "s", animationDelay: -(i * 7) + "s" }}><MiniCar c={CAR_COLORS[i % 8]} dir={dir} /></g>
    </g>
  ));
  vt.forEach(([x, dir, dur], i) => cars.push(
    <g key={"v" + i} transform={`translate(${(x + (dir > 0 ? -4 : 4)) * 2.4} ${dir > 0 ? 30 * 2.4 : 540 * 2.4})`}>
      <g className="cm-h" style={{ "--dy": `${dir * 500 * 2.4}px`, animationName: "cm-v", animationDuration: dur + "s", animationDelay: -(i * 9) + "s" }}><MiniCar c={CAR_COLORS[(i + 3) % 8]} dir={1} /></g>
    </g>
  ));
  return <g pointerEvents="none">{cars}</g>;
}

/* ---------- fila de profundidade ---------- */
const LIST = [];
BUILDINGS.forEach((b) => LIST.push({ key: "b-" + b.id, depth: b.y + b.h, kind: "b", b }));
PLOTS.forEach((p, i) => LIST.push({ key: "p-" + i, depth: p.y + p.h, kind: "p", i }));
DECOR.forEach((d, i) => LIST.push({ key: "d-" + i, depth: d.y + d.h, kind: "d", d }));
TREES.forEach((t, i) => LIST.push({ key: "t-" + i, depth: t.y, kind: "t", t }));
const LAMP_AT = [];
[[290, 262], [330, 262], [470, 262], [560, 262], [660, 262], [300, 378], [420, 378], [560, 378], [680, 378], [495, 440], [530, 440], [495, 150], [530, 150], [495, 320], [530, 320]].forEach(([x, y]) => LAMP_AT.push([x * 2.4, y * 2.4]));
LAMP_AT.forEach(([x, y], i) => LIST.push({ key: "l-" + i, depth: y, kind: "l", x, y }));
LIST.sort((a, b) => a.depth - b.depth);
export const SORTED = LIST;
export const depthIndex = (y) => {
  let lo = 0;
  let hi = LIST.length;
  while (lo < hi) {
    const m = (lo + hi) >> 1;
    if (LIST[m].depth <= y) lo = m + 1;
    else hi = m;
  }
  return lo;
};

const Item = memo(function Item({ d, owner, onBuilding, onPlot }) {
  switch (d.kind) {
    case "b":
      return <Building b={d.b} onPick={onBuilding} />;
    case "p":
      return <Plot i={d.i} owner={owner} onPick={onPlot} />;
    case "d":
      return <Decor d={d.d} />;
    case "t":
      return <Tree {...d.t} />;
    case "l":
      return <Lamp x={d.x} y={d.y} />;
    default:
      return null;
  }
});

// from..to: pedaço da fila; owners só vale para os terrenos (por isso o Item é memoizado por dono)
export const Layer = memo(function Layer({ from, to, owners, onBuilding, onPlot }) {
  const out = [];
  for (let i = from; i < to; i++) {
    const d = LIST[i];
    out.push(<Item key={d.key} d={d} owner={d.kind === "p" ? owners[d.i] : null} onBuilding={onBuilding} onPlot={onPlot} />);
  }
  return <g>{out}</g>;
});

export const Backdrop = memo(function Backdrop() {
  return (
    <g>
      <defs>
        <linearGradient id="cm-sea" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#3cb8e6" /><stop offset="1" stopColor="#1a78b8" /></linearGradient>
      </defs>
      <Ground />
      <Docks />
      <Traffic />
    </g>
  );
});
export { MAP_H, MAP_W };
