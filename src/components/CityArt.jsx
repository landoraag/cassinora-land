import { createContext, memo, useContext } from "react";
import { BUILDINGS, MAP_H, MAP_W, PLOTS } from "../lib/city";
import { OUTFIT_COLORS, dollOf, shade } from "../lib/doll";
import { ITEMS } from "../lib/rpg";

// Arte 2D da cidade (visão "quase isométrica": fachada + lateral + telhado, sombras para a direita),
// inspirada em cidades de city-builder: mar e praia em volta, arranha-céus de vidro, fábrica com silos,
// mina com esteira amarela, parque, ruas com faixas de pedestre e carros passando.

export const VIEW = { x: -90, y: -80, w: 1380, h: 880 };
const LINE = "rgba(15,22,45,.5)";

/* ---------- peças básicas ---------- */
const NightCtx = createContext(0);
export const ShadeDefs = () => (
  <>
    <linearGradient id="cy-shade-front" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#fff" stopOpacity=".2" />
      <stop offset=".35" stopColor="#fff" stopOpacity="0" />
      <stop offset="1" stopColor="#000" stopOpacity=".26" />
    </linearGradient>
    <linearGradient id="cy-shade-side" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#000" stopOpacity=".06" />
      <stop offset="1" stopColor="#000" stopOpacity=".3" />
    </linearGradient>
  </>
);
export function Box({ x, y, w, h, d = 14, c, side, top, shadow = true }) {
  const night = useContext(NightCtx);
  const lit = night > 0.2;
  const sc = side || shade(c, -0.26);
  const tc = top || shade(c, 0.26);
  const floors = Math.max(1, Math.floor(h / 26));
  const fh = (h - 12) / floors;
  const big = d >= 10 && h >= 60;
  return (
    <g>
      {shadow && <polygon points={`${x + w},${y + h} ${x + w + d},${y + h - d} ${x + w + d + 22},${y + h - d + 10} ${x + w + 22},${y + h + 10}`} fill="rgba(0,0,0,.24)" />}
      <polygon points={`${x + w},${y} ${x + w + d},${y - d} ${x + w + d},${y + h - d} ${x + w},${y + h}`} fill={sc} stroke={LINE} strokeWidth="1" strokeLinejoin="round" />
      <polygon points={`${x + w},${y} ${x + w + d},${y - d} ${x + w + d},${y + h - d} ${x + w},${y + h}`} fill="url(#cy-shade-side)" />
      {big && (
        <g transform={`matrix(1 -1 0 1 ${x + w} ${y})`}>
          {Array.from({ length: floors }, (_, r) => (
            <rect key={r} x={d * 0.22} y={8 + r * fh} width={d * 0.56} height={fh - 8} rx="1.2" fill={lit ? "url(#cy-gl-lit)" : "#6a98cc"} stroke="rgba(10,20,45,.5)" strokeWidth=".8" />
          ))}
        </g>
      )}
      <rect x={x} y={y} width={w} height={h} fill={c} stroke={LINE} strokeWidth="1" />
      <rect x={x} y={y} width={w} height={h} fill="url(#cy-shade-front)" />
      <path d={`M${x + 1.2} ${y + h} V${y + 1.2} H${x + w}`} stroke="rgba(255,255,255,.4)" strokeWidth="1.6" fill="none" />
      <polygon points={`${x},${y} ${x + d},${y - d} ${x + w + d},${y - d} ${x + w},${y}`} fill={tc} stroke={LINE} strokeWidth="1" strokeLinejoin="round" />
      <polygon points={`${x + 4},${y - 2} ${x + d - 1},${y - d + 3} ${x + w + d - 4},${y - d + 3} ${x + w - 4},${y - 2}`} fill={shade(tc, -0.1)} stroke="rgba(0,0,0,.15)" strokeWidth=".8" />
      {big && w >= 80 && (
        <g>
          <rect x={x + w * 0.2 + d * 0.5} y={y - d * 0.8} width="13" height="6" rx="1.5" fill="#e4e8ee" stroke={LINE} strokeWidth=".8" />
          <circle cx={x + w * 0.2 + d * 0.5 + 6.5} cy={y - d * 0.8 + 3} r="2" fill="#94a3b8" />
          <rect x={x + w * 0.62 + d * 0.5} y={y - d * 0.75} width="10" height="5" rx="1.5" fill="#e4e8ee" stroke={LINE} strokeWidth=".8" />
        </g>
      )}
    </g>
  );
}

function GableRoof({ x, y, w, rh, d = 12, c, wall }) {
  return (
    <g>
      <polygon points={`${x - 5},${y} ${x + w / 2},${y - rh} ${x + w / 2 + d},${y - rh - d} ${x - 5 + d},${y - d}`} fill={shade(c, 0.18)} stroke={LINE} strokeLinejoin="round" />
      <polygon points={`${x + w / 2},${y - rh} ${x + w + 5},${y} ${x + w + 5 + d},${y - d} ${x + w / 2 + d},${y - rh - d}`} fill={shade(c, -0.22)} stroke={LINE} strokeLinejoin="round" />
      <polygon points={`${x + w / 2},${y - rh} ${x + w + 5},${y} ${x + w + 5 + d},${y - d} ${x + w / 2 + d},${y - rh - d}`} fill="url(#cy-shade-side)" />
      <polygon points={`${x - 5},${y} ${x + w / 2},${y - rh} ${x + w + 5},${y}`} fill={wall} stroke={c} strokeWidth="3.4" strokeLinejoin="round" />
      <path d={`M${x + 6} ${y - 2} L${x + w / 2} ${y - rh + 8} L${x + w - 6} ${y - 2}`} fill="none" stroke="rgba(0,0,0,.12)" />
    </g>
  );
}

const Glass = ({ x, y, w, h, lit, r = 2 }) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx={r} fill={lit ? "url(#cy-gl-lit)" : "url(#cy-gl)"} stroke="rgba(15,25,55,.65)" strokeWidth="1" />
    <path d={`M${x + w * 0.18} ${y + h - 2} L${x + w * 0.58} ${y + 2}`} stroke="#fff" strokeWidth="1.5" opacity=".45" />
  </g>
);

const Door = ({ x, y, w = 18, h = 30, c = "#5b3a1e", lit }) => (
  <g>
    <rect x={x - 2} y={y - 2} width={w + 4} height={h + 2} rx="3" fill="rgba(0,0,0,.25)" />
    <rect x={x} y={y} width={w} height={h} rx="2.5" fill={c} stroke={LINE} />
    <rect x={x + 2.5} y={y + 3} width={w - 5} height={h * 0.38} rx="1.5" fill={lit ? "#ffe27a" : "rgba(255,255,255,.22)"} />
    <circle cx={x + w - 4} cy={y + h * 0.62} r="1.4" fill="#facc15" />
  </g>
);

function Awning({ x, y, w, c1 = "#fff", c2 = "#e53e3e", n = 8, h = 14 }) {
  const sw = w / n;
  return (
    <g>
      {Array.from({ length: n }, (_, i) => (
        <g key={i}>
          <path d={`M${x + i * sw} ${y} L${x + (i + 1) * sw} ${y} L${x + (i + 1) * sw + 1} ${y + h - 5} L${x + i * sw - 1} ${y + h - 5}Z`} fill={i % 2 ? c1 : c2} />
          <path d={`M${x + i * sw - 1} ${y + h - 5} a${sw / 2 + 0.5} 5 0 0 0 ${sw + 2} 0Z`} fill={i % 2 ? c1 : c2} stroke="rgba(0,0,0,.25)" strokeWidth=".6" />
        </g>
      ))}
    </g>
  );
}

/* ---------- carros ---------- */
export function CarSide({ color = "#ef4444" }) {
  return (
    <g>
      <ellipse cx="0" cy="2" rx="19" ry="3" fill="rgba(0,0,0,.3)" />
      <path d="M-18 0 L-18 -6 Q-17 -8.5 -12 -9 L-8 -9.5 L-4 -15 Q-3 -16 0 -16 L7 -16 Q9 -16 10 -14.5 L13 -9.5 L16 -9 Q18 -8.5 18 -5 L18 0Z" fill={color} stroke={shade(color, -0.5)} strokeWidth="1" strokeLinejoin="round" />
      <path d="M-3 -10 L-1 -14 L6 -14 L9.5 -10Z" fill="#cfeaff" stroke={shade(color, -0.5)} strokeWidth=".7" />
      <path d="M3 -14 V-10" stroke={shade(color, -0.4)} strokeWidth=".8" />
      <rect x="15" y="-7" width="3" height="2.4" fill="#ffe27a" />
      <rect x="-18" y="-7" width="2.4" height="2.4" fill="#ef4444" />
      {[-10, 10].map((x) => (
        <g key={x}>
          <circle cx={x} cy="0" r="3.6" fill="#1c1c22" />
          <circle cx={x} cy="0" r="1.5" fill="#b8bcc6" />
        </g>
      ))}
    </g>
  );
}
export function CarTop({ color = "#3b82f6" }) {
  return (
    <g>
      <rect x="-8" y="-17" width="16" height="34" rx="6" fill={color} stroke={shade(color, -0.5)} strokeWidth="1" />
      <rect x="-6" y="-9" width="12" height="8" rx="2" fill="#cfeaff" stroke={shade(color, -0.5)} strokeWidth=".6" />
      <rect x="-6" y="5" width="12" height="5" rx="2" fill="#a9d4f5" />
      <rect x="-6" y="-16" width="3" height="2.4" fill="#ffe27a" />
      <rect x="3" y="-16" width="3" height="2.4" fill="#ffe27a" />
      <rect x="-9.5" y="-10" width="2" height="5" fill="#1c1c22" />
      <rect x="7.5" y="-10" width="2" height="5" fill="#1c1c22" />
      <rect x="-9.5" y="6" width="2" height="5" fill="#1c1c22" />
      <rect x="7.5" y="6" width="2" height="5" fill="#1c1c22" />
    </g>
  );
}
const CAR_COLORS = ["#ef4444", "#3b82f6", "#facc15", "#10b981", "#f97316", "#a855f7", "#e5e7eb", "#ec4899"];
function Traffic() {
  const h = [
    // [y, esquerda?, duração, atraso, cor]
    [316, true, 24, 0, 0], [316, true, 24, -12, 3], [353, false, 20, -4, 1], [353, false, 20, -14, 4],
    [324, true, 30, -20, 6],
  ];
  const v = [
    [582, 0, 14, 0, 2], [582, 0, 14, -7, 5], [620, 1, 17, -3, 7], [620, 1, 17, -11, 3],
  ];
  return (
    <g pointerEvents="none">
      {h.map(([y, left, dur, delay, ci], i) => (
        <g key={"h" + i} transform={left ? `translate(1200 ${y}) scale(-1 1)` : `translate(0 ${y + 4})`}>
          <g className="cy-h" style={{ animationDuration: dur + "s", animationDelay: delay + "s" }}>
            <CarSide color={CAR_COLORS[ci]} />
          </g>
        </g>
      ))}
      {v.map(([x, up, dur, delay, ci], i) => (
        <g key={"v" + i} transform={up ? `translate(${x} 720) scale(1 -1)` : `translate(${x} 0)`}>
          <g className="cy-v" style={{ animationDuration: dur + "s", animationDelay: delay + "s" }}>
            <CarTop color={CAR_COLORS[ci]} />
          </g>
        </g>
      ))}
    </g>
  );
}

/* ---------- natureza ---------- */
function Tree({ x, y, s = 1, c = "#2e8b46" }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="4" cy="1" rx="14" ry="4" fill="rgba(0,0,0,.22)" />
      <rect x="-3" y="-12" width="6" height="14" rx="2" fill="#6b4a2a" />
      <circle cx="0" cy="-26" r="16" fill={shade(c, -0.15)} stroke="rgba(0,0,0,.25)" />
      <circle cx="-7" cy="-21" r="10" fill={c} />
      <circle cx="6" cy="-31" r="9" fill={shade(c, 0.18)} />
    </g>
  );
}
function Palm({ x, y, s = 1, flip = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s * flip} ${s})`}>
      <ellipse cx="4" cy="1" rx="12" ry="3.5" fill="rgba(0,0,0,.22)" />
      <path d="M0 0 Q6 -22 2 -42" fill="none" stroke="#8a5a2b" strokeWidth="5" strokeLinecap="round" />
      {[-70, -35, 0, 35, 70, 110].map((a) => (
        <path key={a} transform={`translate(2 -42) rotate(${a - 90})`} d="M0 0 Q14 -10 30 2 Q14 -2 0 0Z" fill="#2fa04a" stroke="#1d6b30" strokeWidth=".8" />
      ))}
      <circle cx="0" cy="-40" r="2.6" fill="#7a4b1a" />
      <circle cx="5" cy="-39" r="2.6" fill="#7a4b1a" />
    </g>
  );
}
const Bush = ({ x, y, s = 1, c = "#3aa352" }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx="2" cy="1" rx="11" ry="3" fill="rgba(0,0,0,.2)" />
    <circle cx="-5" cy="-5" r="7" fill={shade(c, -0.1)} />
    <circle cx="5" cy="-5" r="7" fill={c} />
    <circle cx="0" cy="-9" r="6.5" fill={shade(c, 0.15)} />
  </g>
);
const Lamp = ({ x, y, night }) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x="-1.5" y="-30" width="3" height="30" fill="#3a3f4a" />
    <path d="M0 -30 L8 -30" stroke="#3a3f4a" strokeWidth="3" />
    <circle cx="8" cy="-28" r="3.4" fill={night > 0.2 ? "#fff3b0" : "#d8dde8"} />
    {night > 0.2 && <circle cx="8" cy="-24" r="26" fill="url(#cy-glow)" />}
  </g>
);
const Bench = ({ x, y }) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x="-12" y="-9" width="24" height="4" rx="1.5" fill="#a3652f" stroke="rgba(0,0,0,.35)" />
    <rect x="-12" y="-14" width="24" height="3" rx="1.5" fill="#b77539" stroke="rgba(0,0,0,.3)" />
    <path d="M-10 -5 V0 M10 -5 V0" stroke="#3a3f4a" strokeWidth="2" />
  </g>
);
const Umbrella = ({ x, y, c = "#ef4444" }) => (
  <g transform={`translate(${x} ${y})`}>
    <ellipse cx="3" cy="2" rx="12" ry="3" fill="rgba(0,0,0,.18)" />
    <rect x="-9" y="-1" width="16" height="5" rx="2" fill="#7dd3fc" opacity=".9" />
    <path d="M0 0 L0 -22" stroke="#6b4a2a" strokeWidth="2" />
    <path d="M-14 -20 Q0 -34 14 -20Z" fill={c} stroke="rgba(0,0,0,.3)" />
    <path d="M-5 -20 Q-4 -30 0 -30.5 Q4 -30 5 -20Z" fill="#fff" opacity=".85" />
  </g>
);

/* ---------- mar ---------- */
function Sailboat({ x, y, s = 1, c = "#fff" }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} className="cy-bob">
      <path d="M-16 0 L16 0 L11 8 L-11 8Z" fill="#7c4a22" stroke="rgba(0,0,0,.35)" />
      <path d="M0 -3 V-34 L14 -6Z" fill={c} stroke="rgba(0,0,0,.25)" />
      <path d="M-2 -6 L-2 -26 L-13 -6Z" fill="#fde68a" stroke="rgba(0,0,0,.25)" />
      <path d="M0 -34 l7 3 l-7 3Z" fill="#ef4444" />
    </g>
  );
}
function CargoShip({ x, y }) {
  const cols = ["#ef4444", "#3b82f6", "#f59e0b", "#10b981", "#8b5cf6"];
  return (
    <g transform={`translate(${x} ${y})`} className="cy-bob">
      <path d="M-70 0 L70 0 L56 16 L-60 16Z" fill="#1f2a44" stroke="rgba(0,0,0,.4)" />
      <path d="M-70 0 L70 0 L68 4 L-69 4Z" fill="#b91c1c" />
      {[-52, -36, -20, -4].flatMap((cx, r) => [0, 1].map((k) => <rect key={r + "_" + k} x={cx} y={-12 - k * 11} width="15" height="10.5" fill={cols[(r + k * 2) % 5]} stroke="rgba(0,0,0,.35)" />))}
      <rect x="22" y="-26" width="26" height="26" fill="#f1f5f9" stroke="rgba(0,0,0,.4)" />
      <rect x="26" y="-22" width="18" height="6" fill="#60a5fa" />
      <rect x="32" y="-34" width="6" height="8" fill="#ef4444" />
    </g>
  );
}

/* ---------- prédios públicos (fachada em coordenadas locais 0..w × 0..h) ---------- */
function Facade({ b, lit }) {
  const w = b.w;
  const cx = w / 2;
  switch (b.id) {
    case "banco":
      return (
        <g>
          <Box x={0} y={0} w={w} h={b.h} d={14} c="#efe6d0" side="#cdc09f" top="#f8f2e2" />
          <polygon points={`-6,0 ${cx},-22 ${w + 6},0`} fill="#f4ecd8" stroke={LINE} />
          <circle cx={cx} cy="-9" r="5" fill="#facc15" stroke="#a16207" />
          <rect x="-4" y="0" width={w + 8} height="8" fill="#d6c9a8" stroke={LINE} />
          <rect x="22" y="12" width="66" height="14" rx="3" fill="#1d3f7a" stroke="#facc15" />
          <text x={cx} y="23" fontSize="10" fontWeight="800" textAnchor="middle" fill="#facc15">BANCO</text>
          <Glass x={16} y={34} w={18} h={44} lit={lit} />
          <Glass x={76} y={34} w={18} h={44} lit={lit} />
          <Door x={46} y={64} w={18} h={44} c="#a16207" lit={lit} />
          {[8, 36, 66, 94].map((x) => (
            <g key={x}>
              <rect x={x} y="28" width="9" height="82" fill="#fbf7ec" stroke={LINE} />
              <rect x={x + 5.5} y="28" width="3.5" height="82" fill="rgba(0,0,0,.1)" />
            </g>
          ))}
          <rect x="-2" y="108" width={w + 4} height="6" fill="#d9d2c0" stroke={LINE} />
          <rect x="4" y="113" width={w - 8} height="7" fill="#cfc7b2" stroke={LINE} />
        </g>
      );
    case "mercado":
      return (
        <g>
          <Box x={0} y={0} w={w} h={b.h} c="#3fae6a" />
          <rect x="10" y="8" width="90" height="20" rx="4" fill="#fff" stroke="#1f7a45" strokeWidth="1.5" />
          <text x={cx} y="22" fontSize="11" fontWeight="800" textAnchor="middle" fill="#1f7a45">MERCADO</text>
          <Awning x={4} y={30} w={102} c1="#fff" c2="#16a34a" n={9} h={16} />
          <Glass x={10} y={52} w={32} h={38} lit={lit} />
          <Glass x={68} y={52} w={32} h={38} lit={lit} />
          <Door x={45} y={54} w={20} h={56} c="#14532d" lit={lit} />
          {[[12, "#ef4444"], [24, "#f59e0b"], [72, "#84cc16"], [86, "#ef4444"]].map(([x, c]) => (
            <g key={x}>
              <rect x={x - 6} y="100" width="14" height="14" rx="2" fill="#a3652f" stroke={LINE} />
              <circle cx={x - 2} cy="99" r="4" fill={c} />
              <circle cx={x + 4} cy="99" r="4" fill={shade(c, 0.2)} />
            </g>
          ))}
          <rect x="0" y="114" width={w} height="6" fill="rgba(0,0,0,.25)" />
        </g>
      );
    case "hospital":
      return (
        <g>
          <Box x={0} y={0} w={w} h={b.h} c="#f3f7ff" side="#cdd7ee" top="#ffffff" />
          <ellipse cx={cx + 7} cy="-7" rx="22" ry="6.5" fill="#3b4a6b" stroke="#facc15" strokeWidth="1.4" />
          <text x={cx + 7} y="-4" fontSize="9" fontWeight="900" textAnchor="middle" fill="#fff">H</text>
          <rect x="0" y="42" width={w} height="8" fill="#ef4444" />
          <circle cx={cx} cy="24" r="17" fill="#fff" stroke="#ef4444" strokeWidth="2" />
          <rect x={cx - 3.5} y="12" width="7" height="24" rx="1.5" fill="#ef4444" />
          <rect x={cx - 12} y="20.5" width="24" height="7" rx="1.5" fill="#ef4444" />
          {[10, 82].flatMap((x) => [58, 84].map((y) => <Glass key={x + "_" + y} x={x} y={y} w={18} h={16} lit={lit} />))}
          <rect x="34" y="78" width="42" height="7" rx="2" fill="#ef4444" stroke={LINE} />
          <Glass x={38} y={86} w={15} h={34} lit={lit} />
          <Glass x={57} y={86} w={15} h={34} lit={lit} />
          <rect x="0" y="116" width={w} height="4" fill="rgba(0,0,0,.18)" />
        </g>
      );
    case "escola":
      return (
        <g>
          <Box x={0} y={0} w={w} h={b.h} c="#d98c4a" side="#a96430" top="#efb06c" />
          <Box x={38} y={-40} w={34} h={40} d={10} c="#e7a15a" side="#b97238" top="#f6c58a" shadow={false} />
          <polygon points={`34,-40 ${cx},-62 76,-40`} fill="#8b2f2f" stroke={LINE} />
          <circle cx={cx} cy="-24" r="10" fill="#fff" stroke="#4a2f1a" strokeWidth="1.6" />
          <path d={`M${cx} -24 V-30 M${cx} -24 L${cx + 5} -22`} stroke="#222" strokeWidth="1.5" strokeLinecap="round" />
          <path d={`M${cx} -62 V-76`} stroke="#555" strokeWidth="1.6" />
          <path d={`M${cx} -76 l14 4 l-14 4Z`} fill="#ef4444" className="cy-flag" />
          <rect x="-2" y="0" width={w + 4} height="7" fill="#a96430" stroke={LINE} />
          {[8, 46, 84].flatMap((x) => [18, 52].map((y) => (
            <g key={x + "_" + y}>
              <path d={`M${x} ${y + 24} V${y + 8} Q${x + 9} ${y - 4} ${x + 18} ${y + 8} V${y + 24}Z`} fill={lit ? "url(#cy-gl-lit)" : "url(#cy-gl)"} stroke="rgba(15,25,55,.65)" />
              <path d={`M${x + 9} ${y + 2} V${y + 24}`} stroke="rgba(15,25,55,.5)" />
            </g>
          )))}
          <Door x={44} y={82} w={22} h={38} c="#5b2f14" lit={lit} />
          <rect x="38" y="116" width="34" height="4" fill="#d9d2c0" stroke={LINE} />
        </g>
      );
    case "empregos":
      return (
        <g>
          <Box x={0} y={-46} w={w} h={b.h + 46} c="#5b4bd6" side="#3a2e9a" top="#8b7cf0" />
          <rect x="0" y="-46" width={w} height="b.h" fill="none" />
          <rect x="6" y="-40" width={w - 12} height={b.h + 12} fill="url(#cy-tower)" stroke={LINE} />
          <rect x="0" y="22" width={w} height="6" fill="#fb923c" />
          <rect x="0" y="-8" width={w} height="4" fill="#fb923c" opacity=".9" />
          <path d="M18 -40 V-52 M30 -40 V-60" stroke="#475569" strokeWidth="2" />
          <circle cx="30" cy="-61" r="2" fill="#ef4444" className="cy-blink" />
          <ellipse cx={cx + 18} cy="-53" rx="16" ry="5" fill="#3b4a6b" stroke="#facc15" />
          <text x={cx + 18} y="-50.5" fontSize="8" fontWeight="900" textAnchor="middle" fill="#fff">H</text>
          <rect x="22" y="30" width="66" height="14" rx="3" fill="#1e1b4b" stroke="#fb923c" />
          <text x={cx} y="41" fontSize="9" fontWeight="800" textAnchor="middle" fill="#fdba74">EMPREGOS</text>
          <Door x={42} y={84} w={26} h={36} c="#1e1b4b" lit={lit} />
        </g>
      );
    case "lazer":
      return (
        <g>
          <Box x={0} y={0} w={w} h={b.h} c="#db2777" />
          <rect x="6" y="6" width="98" height="30" rx="5" fill="#1f1233" stroke="#facc15" strokeWidth="1.6" />
          <text x={cx} y="26" fontSize="14" fontWeight="900" textAnchor="middle" fill="#fde047">CINE</text>
          {Array.from({ length: 12 }, (_, i) => (
            <g key={i}>
              <circle cx={10 + i * 8.2} cy="9" r="1.7" fill="#fde047" className={i % 2 ? "cy-blink" : "cy-blink b"} />
              <circle cx={10 + i * 8.2} cy="33" r="1.7" fill="#fde047" className={i % 2 ? "cy-blink b" : "cy-blink"} />
            </g>
          ))}
          {[[10, "#22d3ee", "#6366f1"], [42, "#f97316", "#facc15"], [74, "#a3e635", "#16a34a"]].map(([x, a, c]) => (
            <g key={x}>
              <rect x={x} y="46" width="26" height="36" rx="2" fill="#111827" stroke="#facc15" />
              <rect x={x + 3} y="49" width="20" height="30" fill={a} />
              <circle cx={x + 13} cy="62" r="7" fill={c} />
            </g>
          ))}
          <Door x={42} y={88} w={26} h={32} c="#1f1233" lit={lit} />
          <path d="M50 -3 l3 -7 l3 7 l-6 -4.5 h6Z" fill="#fde047" />
        </g>
      );
    case "imobiliaria":
      return (
        <g>
          <Box x={0} y={0} w={w} h={b.h} c="#0d9488" />
          <polygon points={`${cx - 18},-4 ${cx},-26 ${cx + 18},-4`} fill="#fff" stroke={LINE} />
          <rect x={cx - 11} y="-6" width="22" height="3" fill="#0f766e" />
          <rect x="8" y="10" width="94" height="22" rx="4" fill="#fff" stroke="#0f766e" strokeWidth="1.4" />
          <text x={cx} y="25" fontSize="10.5" fontWeight="800" textAnchor="middle" fill="#0f766e">IMOBILIÁRIA</text>
          {[10, 62].map((x) => (
            <g key={x}>
              <Glass x={x} y={42} w={38} h={42} lit={lit} />
              {[0, 1].map((k) => <rect key={k} x={x + 4 + k * 17} y="48" width="13" height="16" fill="#fff" stroke="#999" />)}
              {[0, 1].map((k) => <rect key={"p" + k} x={x + 6 + k * 17} y="68" width="9" height="4" fill="#ef4444" />)}
            </g>
          ))}
          <Door x={46} y={80} w={18} h={40} c="#134e4a" lit={lit} />
          <rect x="0" y="116" width={w} height="4" fill="rgba(0,0,0,.2)" />
        </g>
      );
    case "concessionaria":
      return (
        <g>
          <Box x={0} y={0} w={w} h={b.h} c="#ea580c" />
          <path d={`M0 -2 Q${cx} -16 ${w} -2`} fill="none" stroke="#475569" />
          {Array.from({ length: 9 }, (_, i) => <path key={i} d={`M${6 + i * 12.5} ${-6 + Math.abs(i - 4) * -0.2} l5 0 l-2.5 7Z`} fill={["#facc15", "#22c55e", "#3b82f6", "#ef4444"][i % 4]} />)}
          <rect x="8" y="10" width="94" height="18" rx="4" fill="#111827" stroke="#fb923c" />
          <text x={cx} y="23" fontSize="9.5" fontWeight="800" textAnchor="middle" fill="#fdba74">AUTO CENTER</text>
          <rect x="8" y="36" width="94" height="62" rx="3" fill={lit ? "url(#cy-gl-lit)" : "url(#cy-gl)"} stroke="rgba(15,25,55,.65)" />
          <rect x="8" y="88" width="94" height="10" fill="#cbd5e1" />
          <g transform="translate(34 94) scale(.9)"><CarSide color="#ef4444" /></g>
          <g transform="translate(78 94) scale(.9)"><CarSide color="#3b82f6" /></g>
          <Door x={46} y={98} w={18} h={22} c="#7c2d12" lit={lit} />
        </g>
      );
    case "cassino":
      return (
        <g>
          <Box x={0} y={0} w={w} h={b.h} d={16} c="#8f1d1d" side="#5e1111" top="#d4a017" />
          <path d={`M${cx - 44} -2 Q${cx} -52 ${cx + 44} -2Z`} fill="#facc15" stroke="#a16207" strokeWidth="1.6" />
          <path d={`M${cx - 30} -4 Q${cx} -38 ${cx + 30} -4`} fill="none" stroke="#fff6bf" strokeWidth="2" opacity=".6" />
          <path d={`M${cx} -48 l3 -9 l3 9 l9 3 l-9 3 l-3 9 l-3 -9 l-9 -3Z`} fill="#fff" stroke="#a16207" className="cy-blink" />
          <rect x="16" y="10" width={w - 32} height="26" rx="5" fill="#1b0b0b" stroke="#facc15" strokeWidth="2" />
          <text x={cx} y="30" fontSize="17" fontWeight="900" textAnchor="middle" fill="#ffd34d" letterSpacing="1.5">CASSINORA</text>
          {Array.from({ length: 17 }, (_, i) => (
            <g key={i}>
              <circle cx={20 + i * 7.5} cy="13" r="1.7" fill="#fff6bf" className={i % 2 ? "cy-blink" : "cy-blink b"} />
              <circle cx={20 + i * 7.5} cy="33" r="1.7" fill="#fff6bf" className={i % 2 ? "cy-blink b" : "cy-blink"} />
            </g>
          ))}
          {[14, 112].map((x) => <Glass key={x} x={x} y={44} w={34} h={30} lit={lit} />)}
          <Door x={cx - 14} y={48} w={28} h={52} c="#3b0a0a" lit={lit} />
          <polygon points={`${cx - 16},100 ${cx + 16},100 ${cx + 24},${b.h} ${cx - 24},${b.h}`} fill="#dc2626" stroke="#7f1d1d" />
          <text x="30" y="70" fontSize="22" textAnchor="middle">🎰</text>
          <text x={w - 30} y="70" fontSize="22" textAnchor="middle">🎲</text>
        </g>
      );
    default:
      return <Box x={0} y={0} w={w} h={b.h} c={b.color} />;
  }
}

function Kiosk({ b, lit }) {
  const w = b.w;
  return (
    <g>
      <Box x={0} y={14} w={w} h={b.h - 14} d={8} c={b.color} />
      <Awning x={-3} y={14} w={w + 6} c1="#fff" c2={shade(b.color, -0.1)} n={6} h={12} />
      <rect x="6" y="1" width={w - 12} height="12" rx="3" fill="#fff" stroke={LINE} />
      <text x={w / 2} y="12" fontSize="10" textAnchor="middle">{b.icon}</text>
      <Glass x={8} y={30} w={w - 16} h={12} lit={lit} />
      <rect x="5" y="40" width={w - 10} height="5" rx="1" fill="#b77539" stroke={LINE} />
    </g>
  );
}

function Building({ b, night, onPick }) {
  const lit = night > 0.2;
  return (
    <g className="city-hit" onClick={() => onPick(b)}>
      <g transform={`translate(${b.x} ${b.y})`}>{b.kiosk ? <Kiosk b={b} lit={lit} /> : <Facade b={b} lit={lit} />}</g>
      <text x={b.x + b.w / 2} y={b.y + b.h + (b.kiosk ? 12 : 15)} fontSize={b.kiosk ? 9.5 : 11.5} textAnchor="middle" fill="#fff" stroke="rgba(10,15,40,.8)" strokeWidth="3" paintOrder="stroke" fontWeight="800">
        {b.name}
      </text>
    </g>
  );
}

/* ---------- casas dos jogadores ---------- */
function HouseBody({ tier, wall, roof, lit }) {
  const trim = shade(wall, -0.25);
  if (tier <= 1)
    return (
      <g>
        <Box x={22} y={-44} w={62} h={44} d={10} c={wall} />
        <polygon points="16,-44 28,-60 80,-60 92,-44" fill={roof} stroke={LINE} />
        <rect x="64" y="-72" width="9" height="16" fill="#8b5a3c" stroke={LINE} />
        <Glass x={28} y={-34} w={16} h={14} lit={lit} />
        <Door x={55} y={-28} w={15} h={28} lit={lit} />
        <Bush x={22} y={0} s={0.8} />
        <Bush x={86} y={0} s={0.7} />
      </g>
    );
  if (tier === 2)
    return (
      <g>
        <Box x={12} y={-58} w={80} h={58} d={12} c={wall} />
        <rect x="78" y="-98" width="10" height="26" fill="#8b5a3c" stroke={LINE} />
        <GableRoof x={12} y={-58} w={80} rh={38} d={12} c={roof} wall={shade(wall, 0.08)} />
        <circle cx="52" cy="-72" r="6" fill={lit ? "url(#cy-gl-lit)" : "url(#cy-gl)"} stroke={LINE} />
        <Glass x={20} y={-46} w={17} h={16} lit={lit} />
        <Glass x={68} y={-46} w={17} h={16} lit={lit} />
        <Door x={44} y={-32} w={17} h={32} lit={lit} />
        <rect x="38" y="-4" width="29" height="4" fill="#d9d2c0" stroke={LINE} />
        {[0, 1, 2, 3, 4, 5].map((i) => <path key={i} d={`M${2 + i * 6} 0 V-12`} stroke="#fff" strokeWidth="2.4" />)}
        {[0, 1, 2, 3, 4, 5].map((i) => <path key={"r" + i} d={`M${72 + i * 6} 0 V-12`} stroke="#fff" strokeWidth="2.4" />)}
        <Bush x={20} y={-1} s={0.7} c="#e879f9" />
      </g>
    );
  if (tier === 3)
    return (
      <g>
        <Box x={22} y={-116} w={68} h={116} d={14} c={wall} />
        <rect x="22" y="-124" width="68" height="8" fill={roof} stroke={LINE} />
        <Bush x={34} y={-126} s={0.6} />
        <Bush x={78} y={-126} s={0.6} />
        {[0, 1, 2, 3].map((r) => (
          <g key={r}>
            <Glass x={28} y={-106 + r * 24} w={14} h={14} lit={lit} />
            <Glass x={49} y={-106 + r * 24} w={14} h={14} lit={lit} />
            <Glass x={70} y={-106 + r * 24} w={14} h={14} lit={lit} />
            <rect x="26" y={-90 + r * 24} width="62" height="3" fill={trim} />
          </g>
        ))}
        <Door x={47} y={-24} w={18} h={24} lit={lit} c="#27272a" />
        <rect x="0" y="-12" width="28" height="12" rx="4" fill="#38bdf8" stroke="#fff" strokeWidth="1.6" />
        <path d="M5 -8 q4 -3 8 0 t8 0" stroke="#fff" fill="none" strokeWidth="1" opacity=".8" />
      </g>
    );
  return (
    <g>
      <Box x={6} y={-60} w={98} h={60} d={12} c={wall} />
      <Box x={36} y={-96} w={40} h={38} d={10} c={shade(wall, 0.04)} shadow={false} />
      <GableRoof x={6} y={-60} w={98} rh={22} d={12} c={roof} wall={shade(wall, 0.08)} />
      <GableRoof x={36} y={-96} w={40} rh={20} d={10} c={roof} wall={shade(wall, 0.08)} />
      <path d="M56 -118 V-134" stroke="#555" strokeWidth="1.6" />
      <path d="M56 -134 l15 5 l-15 5Z" fill="#facc15" stroke="#ca8a04" className="cy-flag" />
      <Glass x={12} y={-50} w={14} h={18} lit={lit} />
      <Glass x={30} y={-50} w={12} h={18} lit={lit} />
      <Glass x={70} y={-50} w={12} h={18} lit={lit} />
      <Glass x={86} y={-50} w={14} h={18} lit={lit} />
      <Glass x={49} y={-88} w={14} h={18} lit={lit} />
      <Door x={47} y={-34} w={17} h={34} c="#3f2a17" lit={lit} />
      {[38, 72].map((x) => <rect key={x} x={x} y="-52" width="5" height="52" fill="#fff" stroke={LINE} />)}
      <rect x="-2" y="-10" width="30" height="10" rx="4" fill="#38bdf8" stroke="#fff" strokeWidth="1.6" />
      <path d="M3 -6 q4 -3 8 0 t8 0" stroke="#fff" fill="none" strokeWidth="1" opacity=".8" />
      <Palm x={106} y={-2} s={0.5} />
    </g>
  );
}

function Plot({ i, owner, night, onPick }) {
  const p = PLOTS[i];
  const south = i >= 8;
  const house = owner && ITEMS[owner.assets?.house];
  const accent = owner ? OUTFIT_COLORS[dollOf(owner).outfitColor] : "#9aa3b2";
  const veh = owner && ITEMS[owner.assets?.vehicle];
  const labelY = south ? 592 : 266;
  const lit = night > 0.2;
  const s = south ? 0.74 : 1;
  const baseY = p.y + p.h - (south ? 8 : 4);
  const hx = p.x + (p.w - p.w * s) / 2;
  return (
    <g className="city-hit" onClick={() => onPick(i)}>
      <rect x={p.x} y={p.y} width={p.w} height={p.h} rx="6" fill="#66bb6a" />
      {Array.from({ length: 6 }, (_, k) => <rect key={k} x={p.x} y={p.y + k * (p.h / 6)} width={p.w} height={p.h / 12} fill="rgba(255,255,255,.06)" />)}
      <rect x={p.x} y={p.y} width={p.w} height={p.h} rx="6" fill="none" stroke="#3f8f4a" strokeWidth="2" />
      {!south && <path d={`M${p.x + 55} ${p.y + p.h - 4} V${p.y + p.h + 4}`} stroke="#d9d2c0" strokeWidth="14" />}
      {house ? (
        <g transform={`translate(${hx} ${baseY}) scale(${s})`}>
          <HouseBody tier={house.tier} wall={shade(accent, 0.6)} roof={shade(accent, -0.15)} lit={lit} />
        </g>
      ) : (
        <g>
          <Bush x={p.x + 18} y={p.y + p.h - 18} />
          <Bush x={p.x + p.w - 20} y={p.y + p.h - 26} s={0.9} />
          <path d={`M${p.x + 55} ${p.y + p.h - 12} v-34`} stroke="#6b4a2a" strokeWidth="3" />
          <rect x={p.x + 22} y={p.y + p.h - 70} width="66" height="26" rx="4" fill="#fff" stroke="#dc2626" strokeWidth="2" />
          <text x={p.x + 55} y={p.y + p.h - 52} fontSize="11" textAnchor="middle" fill="#dc2626" fontWeight="900">À VENDA</text>
        </g>
      )}
      {veh && (
        <g transform={`translate(${p.x + 92} ${p.y + p.h - 10})`}>
          <text fontSize="19" textAnchor="middle">{veh.icon}</text>
        </g>
      )}
      {owner && (
        <g>
          <rect x={p.x + 4} y={labelY - 11} width="102" height="15" rx="7" fill="rgba(10,15,40,.7)" />
          <text x={p.x + 55} y={labelY} fontSize="10.5" textAnchor="middle" fill="#fff" fontWeight="700">
            {(owner.persona?.name || owner.nickname || "").slice(0, 16)}
          </text>
        </g>
      )}
    </g>
  );
}

/* ---------- cenário de fundo: mina, fábrica, arranha-céus, parque ---------- */
function Tower({ x, w, h, base = 108, kind = "blue", heli = false }) {
  const top = base - h;
  const c = kind === "orange" ? "#e8e1d6" : kind === "glass" ? "#3b82c4" : "#2f6fb5";
  return (
    <g>
      <Box x={x} y={top} w={w} h={h} d={11} c={c} side={shade(c, -0.28)} top={shade(c, 0.3)} />
      <rect x={x + 2} y={top + 3} width={w - 4} height={h - 6} fill={kind === "orange" ? "url(#cy-win-o)" : "url(#cy-win)"} />
      {kind === "orange" && <rect x={x} y={top + h * 0.35} width={w} height="5" fill="#f97316" />}
      {kind === "blue" && <rect x={x} y={top + h * 0.22} width={w} height="4" fill="#fb923c" />}
      {heli ? (
        <g>
          <ellipse cx={x + w / 2 + 5} cy={top - 6} rx={w * 0.34} ry="5" fill="#3b4a6b" stroke="#facc15" />
          <text x={x + w / 2 + 5} y={top - 3.5} fontSize="7" fontWeight="900" textAnchor="middle" fill="#fff">H</text>
        </g>
      ) : (
        <path d={`M${x + w * 0.5} ${top - 11} V${top - 24}`} stroke="#64748b" strokeWidth="1.6" />
      )}
    </g>
  );
}

function Backdrop({ night }) {
  const lit = night > 0.2;
  return (
    <g pointerEvents="none">
      {/* faixa de terra/estrada industrial */}
      <rect x="0" y="0" width="540" height="110" fill="#8f8b6b" opacity=".35" />
      {/* MINA */}
      <g>
        <ellipse cx="128" cy="72" rx="118" ry="34" fill="#6a4a2e" stroke="rgba(0,0,0,.35)" />
        {[[104, 28, "#7d5636"], [86, 22, "#8c6340"], [68, 16, "#6c4a2d"], [48, 11, "#543820"], [28, 6.5, "#3a2616"]].map(([rx, ry, c], i) => (
          <ellipse key={i} cx={128 - i * 2} cy={72 + i * 1.5} rx={rx} ry={ry} fill={c} stroke="rgba(0,0,0,.3)" />
        ))}
        <path d="M36 70 Q60 100 128 98 Q196 96 216 70" fill="none" stroke="#d2ad72" strokeWidth="4" strokeDasharray="10 6" opacity=".9" />
        <g transform="translate(102 84)">
          <rect x="-10" y="-8" width="22" height="9" rx="2" fill="#facc15" stroke={LINE} />
          <rect x="-12" y="-14" width="11" height="7" fill="#f59e0b" stroke={LINE} />
          <circle cx="-6" cy="2" r="3.2" fill="#222" />
          <circle cx="7" cy="2" r="3.2" fill="#222" />
        </g>
        {/* esteira amarela */}
        <path d="M130 64 L290 22" stroke="#7a5d00" strokeWidth="9" strokeLinecap="round" />
        <path d="M130 64 L290 22" stroke="#facc15" strokeWidth="6" strokeLinecap="round" />
        <path d="M130 64 L290 22" stroke="#fff6bf" strokeWidth="1.5" strokeDasharray="4 7" className="cy-belt" />
        {[160, 200, 240, 276].map((x, i) => <path key={x} d={`M${x} ${60 - i * 10.5 - (i ? 0 : 0)} L${x - 6} ${72 - i * 10.5 + 18}`} stroke="#6b7280" strokeWidth="2.4" opacity="0" />)}
        {[170, 214, 258].map((x, i) => <path key={x} d={`M${x} ${52 - i * 11} v${44 + i * 11} `} stroke="#475569" strokeWidth="3" opacity=".7" />)}
        <path d="M284 30 l10 -12 l10 12Z" fill="#6b7280" stroke={LINE} />
        <path d="M296 30 l8 -8 l8 8Z" fill="#9ca3af" stroke={LINE} />
      </g>
      {/* FÁBRICA */}
      <g>
        <Box x={316} y={58} w={84} h={46} d={10} c="#b8c0cc" side="#8a93a3" top="#d8dde6" />
        {[0, 1, 2, 3].map((i) => <polygon key={i} points={`${318 + i * 20},58 ${318 + i * 20},46 ${336 + i * 20},58`} fill="#9aa3b2" stroke={LINE} />)}
        <rect x="328" y="76" width="20" height="28" fill="#6b7280" />
        <rect x="360" y="70" width="30" height="14" fill={lit ? "url(#cy-gl-lit)" : "url(#cy-gl)"} stroke={LINE} />
        {[330, 358].map((x, i) => (
          <g key={x}>
            <rect x={x} y={14} width="12" height="46" fill="#cbd5e1" stroke={LINE} />
            <rect x={x} y={18} width="12" height="7" fill="#ef4444" />
            <rect x={x} y={32} width="12" height="7" fill="#ef4444" />
            {[0, 1, 2].map((k) => <circle key={k} cx={x + 6} cy={10} r={6 + k} fill="#e5e7eb" opacity=".7" className="cy-smoke" style={{ animationDelay: -(i + k) * 1.1 + "s" }} />)}
          </g>
        ))}
        {/* silos */}
        {[418, 448, 478].map((x, i) => (
          <g key={x}>
            <rect x={x} y={30 + i * 3} width="24" height={74 - i * 3} fill="url(#cy-silo)" stroke={LINE} />
            <ellipse cx={x + 12} cy={30 + i * 3} rx="12" ry="5" fill="#eef2f7" stroke={LINE} />
            <path d={`M${x} ${52 + i * 3} H${x + 24} M${x} ${72 + i * 3} H${x + 24}`} stroke="rgba(0,0,0,.18)" />
            <rect x={x + 9} y={20 + i * 3} width="6" height="8" fill="#64748b" />
          </g>
        ))}
        <path d="M400 80 H418 M442 84 H448 M472 86 H478" stroke="#64748b" strokeWidth="4" />
        <path d="M404 76 Q412 60 418 54" stroke="#475569" strokeWidth="3" fill="none" />
        {/* tanque + contêineres */}
        <rect x="508" y="62" width="26" height="42" rx="6" fill="#93c5fd" stroke={LINE} />
        <rect x="510" y="82" width="22" height="4" fill="#fff" opacity=".4" />
        {[["#ef4444", 0], ["#3b82f6", 1], ["#f59e0b", 2]].map(([c, k]) => (
          <rect key={k} x={414 + k * 26} y="96" width="24" height="9" fill={c} stroke={LINE} opacity="0" />
        ))}
      </g>
      {/* ARRANHA-CÉUS */}
      <Tower x={672} w={42} h={88} />
      <Tower x={728} w={34} h={100} kind="glass" />
      <Tower x={776} w={50} h={72} kind="orange" heli />
      <Tower x={842} w={38} h={96} />
      <Tower x={894} w={56} h={60} kind="orange" />
      {/* PARQUE */}
      <rect x="960" y="62" width="136" height="46" rx="14" fill="#5cb85c" opacity=".9" />
      <ellipse cx="1030" cy="90" rx="34" ry="10" fill="#4fc3f7" stroke="#fff" strokeWidth="2" />
      <path d="M1008 90 q6 -3 12 0 t12 0 t12 0" fill="none" stroke="#fff" opacity=".7" />
      <Tree x={976} y={100} s={0.8} />
      <Tree x={1090} y={100} s={0.8} c="#3fa34a" />
      <Tree x={1066} y={70} s={0.6} c="#52b04e" />
      <Bench x={1005} y={106} />
      {/* RODA-GIGANTE */}
      <g transform="translate(1150 56)">
        <path d="M-22 52 L0 0 L22 52" fill="none" stroke="#64748b" strokeWidth="3" />
        <circle r="36" fill="none" stroke="#94a3b8" strokeWidth="2.4" />
        <circle r="22" fill="none" stroke="#cbd5e1" strokeWidth="1.2" />
        <g className="cy-spin">
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i / 8) * Math.PI * 2;
            return (
              <g key={i}>
                <path d={`M0 0 L${Math.cos(a) * 36} ${Math.sin(a) * 36}`} stroke="#cbd5e1" strokeWidth="1.2" />
                <rect x={Math.cos(a) * 36 - 4.5} y={Math.sin(a) * 36 - 3} width="9" height="8" rx="2" fill={["#ef4444", "#facc15", "#3b82f6", "#10b981"][i % 4]} stroke={LINE} />
              </g>
            );
          })}
        </g>
        <circle r="4" fill="#475569" />
      </g>
    </g>
  );
}

/* ---------- a cena toda ---------- */
function Sea({ night }) {
  const x0 = VIEW.x;
  const y0 = VIEW.y;
  const x1 = VIEW.x + VIEW.w;
  const y1 = VIEW.y + VIEW.h;
  return (
    <g pointerEvents="none">
      <rect x={x0} y={y0} width={VIEW.w} height={VIEW.h} fill="url(#cy-sea)" />
      {Array.from({ length: 26 }, (_, i) => {
        const side = i % 4;
        const t = (i * 137) % 100;
        const x = side === 0 ? x0 + 8 + (t % 40) : side === 1 ? x1 - 52 + (t % 40) : x0 + 20 + (t / 100) * (VIEW.w - 80);
        const y = side === 2 ? y0 + 6 + (t % 36) : side === 3 ? y1 - 40 + (t % 30) : y0 + 30 + ((t * 7) % (VIEW.h - 80));
        return <path key={i} className="cy-wave" style={{ animationDelay: -(i % 6) * 0.7 + "s" }} d={`M${x} ${y} q6 -5 12 0 t12 0 t12 0`} fill="none" stroke="#fff" strokeWidth="1.6" opacity=".55" />;
      })}
      <Sailboat x={-58} y={190} s={1} />
      <Sailboat x={1262} y={470} s={0.9} c="#fde68a" />
      <Sailboat x={300} y={-52} s={0.8} />
      <CargoShip x={880} y={776} />
      <Sailboat x={80} y={770} s={0.9} c="#fecaca" />
      <Sailboat x={1240} y={90} s={0.7} />
    </g>
  );
}

const Scene = memo(function Scene({ owners, night, onBuilding, onPlot }) {
  return (
    <NightCtx.Provider value={night}>
    <g>
      <defs>
        <linearGradient id="cy-sea" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#35b6e8" />
          <stop offset="1" stopColor="#1676b8" />
        </linearGradient>
        <linearGradient id="cy-gl" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c8ecff" />
          <stop offset="1" stopColor="#4b94d8" />
        </linearGradient>
        <linearGradient id="cy-gl-lit" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff2b0" />
          <stop offset="1" stopColor="#f5b83a" />
        </linearGradient>
        <linearGradient id="cy-silo" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#d6dde8" />
          <stop offset=".5" stopColor="#f4f7fb" />
          <stop offset="1" stopColor="#9aa6b8" />
        </linearGradient>
        <linearGradient id="cy-tower" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8fb8ff" />
          <stop offset="1" stopColor="#3b4fb8" />
        </linearGradient>
        <ShadeDefs />
        <radialGradient id="cy-glow">
          <stop offset="0" stopColor="#fff3b0" stopOpacity=".55" />
          <stop offset="1" stopColor="#fff3b0" stopOpacity="0" />
        </radialGradient>
        <pattern id="cy-win" width="9" height="11" patternUnits="userSpaceOnUse">
          <rect width="9" height="11" fill="#2b5f9e" />
          <rect x="1.6" y="1.6" width="5.8" height="7.8" fill={night > 0.2 ? "#ffd86b" : "#a9dcff"} />
        </pattern>
        <pattern id="cy-win-o" width="9" height="11" patternUnits="userSpaceOnUse">
          <rect width="9" height="11" fill="#d8cfc0" />
          <rect x="1.6" y="1.6" width="5.8" height="7.8" fill={night > 0.2 ? "#ffd86b" : "#7fb8e8"} />
        </pattern>
      </defs>
      <Sea night={night} />
      {/* ilha: areia e grama */}
      <rect x="-40" y="-40" width="1280" height="800" rx="56" fill="#f2dfa0" stroke="#fff" strokeWidth="5" strokeDasharray="2 10" strokeLinecap="round" />
      <rect x="-30" y="-30" width="1260" height="780" rx="50" fill="none" stroke="#e5c97a" strokeWidth="3" />
      <rect x="0" y="0" width={MAP_W} height={MAP_H} rx="14" fill="#5fb25f" />
      {Array.from({ length: 12 }, (_, i) => <rect key={i} x="0" y={i * 60} width={MAP_W} height="30" fill="rgba(255,255,255,.04)" />)}
      {/* praia: palmeiras, guarda-sóis */}
      {[60, 210, 380, 760, 930, 1110].map((x, i) => <Palm key={"pt" + i} x={x} y={-10} s={0.62} flip={i % 2 ? -1 : 1} />)}
      {[40, 300, 500, 700, 1000, 1170].map((x, i) => <Palm key={"pb" + i} x={x} y={744} s={0.62} flip={i % 2 ? 1 : -1} />)}
      {[-18, 1218].map((x, k) => [120, 260, 400, 540, 690].map((y, i) => <Palm key={k + "_" + i} x={x} y={y + k * 30} s={0.55} flip={k ? -1 : 1} />))}
      <Umbrella x={150} y={740} c="#ef4444" />
      <Umbrella x={620} y={742} c="#3b82f6" />
      <Umbrella x={1040} y={740} c="#f59e0b" />
      <Umbrella x={-20} y={330} c="#10b981" />
      <Umbrella x={1220} y={250} c="#ec4899" />
      <Backdrop night={night} />
      {/* calçadas */}
      <g>
        <rect x="0" y="246" width="1200" height="178" fill="#d8d3c5" />
        <rect x="548" y="0" width="104" height="720" fill="#d8d3c5" />
        <rect x="0" y="566" width="1200" height="40" fill="#d8d3c5" />
        <path d="M0 246 H548 M652 246 H1200 M0 424 H548 M652 424 H1200 M0 566 H548 M652 566 H1200 M0 606 H548 M652 606 H1200" stroke="#b8b2a2" strokeWidth="2" />
        {/* pavers */}
        {Array.from({ length: 40 }, (_, i) => <path key={i} d={`M${i * 30} 246 V300 M${i * 30} 370 V424`} stroke="rgba(0,0,0,.05)" />)}
      </g>
      {/* ruas */}
      <rect x="0" y="300" width="1200" height="70" fill="#4d515b" />
      <rect x="560" y="0" width="80" height="720" fill="#4d515b" />
      <rect x="0" y="574" width="1200" height="24" fill="#4d515b" />
      <path d="M0 302.5 H1200 M0 367.5 H1200 M562.5 0 V720 M637.5 0 V720" stroke="#fff" strokeWidth="1.5" opacity=".5" />
      <path d="M0 335 H552 M648 335 H1200" stroke="#f5d547" strokeWidth="3" strokeDasharray="22 16" />
      <path d="M600 0 V292 M600 378 V568 M600 604 V720" stroke="#f5d547" strokeWidth="3" strokeDasharray="22 16" />
      <path d="M0 586 H552 M648 586 H1200" stroke="#fff" strokeWidth="2" strokeDasharray="14 12" opacity=".7" />
      {/* faixas de pedestre */}
      {Array.from({ length: 6 }, (_, i) => (
        <g key={i} fill="#fff" opacity=".85">
          <rect x="534" y={304 + i * 11} width="16" height="6" />
          <rect x="650" y={304 + i * 11} width="16" height="6" />
          <rect x={564 + i * 13} y="284" width="7" height="13" />
          <rect x={564 + i * 13} y="374" width="7" height="13" />
          <rect x={564 + i * 13} y="552" width="7" height="13" />
          <rect x={564 + i * 13} y="609" width="7" height="13" />
        </g>
      ))}
      <Traffic />
      {/* arco de entrada */}
      <g pointerEvents="none">
        <rect x="552" y="14" width="8" height="46" fill="#7c3aed" stroke={LINE} />
        <rect x="640" y="14" width="8" height="46" fill="#7c3aed" stroke={LINE} />
        <rect x="548" y="10" width="104" height="16" rx="6" fill="#1b1030" stroke="#facc15" strokeWidth="1.6" />
        <text x="600" y="22.5" fontSize="10" fontWeight="900" textAnchor="middle" fill="#fde047" letterSpacing="1">CASSINORA LAND</text>
      </g>
      {/* verde das ruas */}
      {[[132, 258], [262, 258], [392, 258], [684, 258], [814, 258], [944, 258], [1074, 258]].map(([x, y], i) => <Tree key={"t" + i} x={x} y={y + 14} s={0.62} c={i % 2 ? "#2e8b46" : "#3fa34a"} />)}
      {[[40, 398], [180, 398], [330, 398], [820, 398], [980, 398], [1120, 398]].map(([x, y], i) => <Bench key={"b" + i} x={x} y={y} />)}
      {[80, 240, 400, 720, 880, 1040, 1160].map((x, i) => <Lamp key={"l" + i} x={x} y={296} night={night} />)}
      {[100, 260, 420, 700, 860, 1020].map((x, i) => <Lamp key={"l2" + i} x={x} y={382} night={night} />)}
      {[538, 662].map((x) => [120, 200, 440, 520].map((y) => <Lamp key={x + "_" + y} x={x} y={y} night={night} />))}
      {[[536, 150], [664, 150], [536, 650], [664, 650], [536, 60], [664, 60]].map(([x, y], i) => <Tree key={"tt" + i} x={x} y={y} s={0.7} />)}
      {/* casas e prédios */}
      {PLOTS.map((_, i) => <Plot key={i} i={i} owner={owners[i]} night={night} onPick={onPlot} />)}
      {BUILDINGS.map((b) => <Building key={b.id} b={b} night={night} onPick={onBuilding} />)}
      <rect x={VIEW.x} y={VIEW.y} width={VIEW.w} height={VIEW.h} fill="#0b1030" opacity={night} pointerEvents="none" />
    </g>
    </NightCtx.Provider>
  );
});

export default Scene;
