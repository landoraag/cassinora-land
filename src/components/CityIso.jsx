import { createContext, memo, useContext } from "react";
import { BUILDINGS, MAP_H, MAP_W, PLOTS } from "../lib/city";
import { OUTFIT_COLORS, dollOf, shade } from "../lib/doll";
import { ITEMS } from "../lib/rpg";

// Cidade isométrica 2D ("low poly"): o mundo continua sendo o mapa 1200 x 720 (ruas, portas, terrenos),
// só que desenhado em projeção isométrica: faces com luz chapada, telhados, vidros, árvores de poucos polígonos.
// Faces visíveis: a de frente (+y, esquerda na tela) e a lateral (+x, direita). Luz vem de cima à esquerda.

export const S = 0.62; // escala horizontal
export const Z = 0.9; // escala da altura
export const OX = 520;
export const OY = 200;
export const VIEW = { x: -30, y: -50, w: 1360, h: 930 };
export const iso = (x, y, z = 0) => [OX + (x - y) * S, OY + ((x + y) * S) / 2 - z * Z];
export const unIso = (sx, sy) => {
  const u = (sx - OX) / S;
  const v = ((sy - OY) * 2) / S;
  return [(u + v) / 2, (v - u) / 2];
};
const f1 = (n) => Math.round(n * 10) / 10;
const P = (...pts) => pts.map(([x, y, z = 0]) => iso(x, y, z).map(f1).join(",")).join(" ");
const EDGE = "rgba(20,20,40,.22)";
const NightCtx = createContext(0);

/* ---------- peças ---------- */
function Shadow({ x, y, w, h, z }) {
  const ox = z * 0.5;
  const oy = z * 0.28;
  return <polygon points={P([x + w, y], [x + w + ox, y + oy], [x + w + ox, y + h + oy], [x + ox, y + h + oy], [x, y + h], [x + w, y + h])} fill="rgba(20,30,20,.22)" />;
}
function IsoBox({ x, y, w, h, z, base = 0, c, top, left, right, shadow = true, children }) {
  const t = top || shade(c, 0.22);
  const l = left || c;
  const r = right || shade(c, -0.26);
  return (
    <g>
      {shadow && base === 0 && <Shadow x={x} y={y} w={w} h={h} z={z} />}
      <polygon points={P([x + w, y, base], [x + w, y + h, base], [x + w, y + h, z], [x + w, y, z])} fill={r} stroke={EDGE} strokeLinejoin="round" />
      <polygon points={P([x, y + h, base], [x + w, y + h, base], [x + w, y + h, z], [x, y + h, z])} fill={l} stroke={EDGE} strokeLinejoin="round" />
      <polygon points={P([x, y, z], [x + w, y, z], [x + w, y + h, z], [x, y + h, z])} fill={t} stroke={EDGE} strokeLinejoin="round" />
      {children}
    </g>
  );
}
// desenha em coordenadas locais (u para a direita, v para baixo, em unidades do mundo) sobre a face da frente / lateral
function FaceL({ x, y, h, z, children }) {
  const [ox, oy] = iso(x, y + h, z);
  return <g className="cy-face" transform={`matrix(${S} ${S / 2} 0 ${Z} ${ox} ${oy})`}>{children}</g>;
}
function FaceR({ x, y, w, h, z, children }) {
  const [ox, oy] = iso(x + w, y + h, z);
  return <g className="cy-face" transform={`matrix(${S} ${-S / 2} 0 ${Z} ${ox} ${oy})`}>{children}</g>;
}
function Gable({ x, y, w, h, z, rh, c, ridge = "x", oh = 5 }) {
  // telhado de duas águas; a cumeeira corre ao longo de x (ou de y)
  if (ridge === "x") {
    const ym = y + h / 2;
    return (
      <g>
        <polygon points={P([x + w + oh, y + h + oh, z], [x - oh, y + h + oh, z], [x - oh, ym, z + rh], [x + w + oh, ym, z + rh])} fill={shade(c, 0.1)} stroke={EDGE} strokeLinejoin="round" />
        <polygon points={P([x + w + oh, y - oh, z], [x + w + oh, y + h + oh, z], [x + w + oh, ym, z + rh])} fill={shade(c, -0.3)} stroke={EDGE} strokeLinejoin="round" />
      </g>
    );
  }
  const xm = x + w / 2;
  return (
    <g>
      <polygon points={P([x - oh, y + h + oh, z], [x + w + oh, y + h + oh, z], [xm, y + h + oh, z + rh])} fill={shade(c, -0.1)} stroke={EDGE} strokeLinejoin="round" />
      <polygon points={P([x + w + oh, y - oh, z], [x + w + oh, y + h + oh, z], [xm, y + h + oh, z + rh], [xm, y - oh, z + rh])} fill={shade(c, -0.28)} stroke={EDGE} strokeLinejoin="round" />
    </g>
  );
}
const Glass = ({ x, y, w, h, lit }) => (
  <g>
    <rect x={x} y={y} width={w} height={h} fill={lit ? "#ffd86b" : "#8fd0e8"} stroke="rgba(10,40,60,.5)" strokeWidth=".8" />
    <rect x={x} y={y} width={w} height={h * 0.45} fill="#fff" opacity={lit ? 0.15 : 0.3} />
  </g>
);
function WinGrid({ x, y, w, h, cols, rows, lit, gap = 5, pad = 0.18 }) {
  const cw = (w - gap * (cols + 1)) / cols;
  const rh = (h - gap * (rows + 1)) / rows;
  const out = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) out.push(<Glass key={r + "_" + c} x={x + gap + c * (cw + gap)} y={y + gap + r * (rh + gap)} w={cw} h={rh * (1 - pad * 0)} lit={lit} />);
  return <g>{out}</g>;
}
const Awning = ({ x, y, w, c1 = "#fff", c2 = "#d94f3a", n = 8, h = 12 }) => (
  <g>
    {Array.from({ length: n }, (_, i) => (
      <path key={i} d={`M${x + (i * w) / n} ${y} h${w / n} l1.5 ${h} h${-w / n - 3}Z`} fill={i % 2 ? c1 : c2} />
    ))}
  </g>
);

/* ---------- cilindro, árvore, palmeira, poste, banco ---------- */
function Cyl({ x, y, r, z, c, base = 0, band }) {
  const [cx, cy] = iso(x, y, base);
  const [tx, ty] = iso(x, y, z);
  const rx = r * S * 1.414;
  const ry = rx / 2;
  return (
    <g>
      <ellipse cx={cx + 6} cy={cy + 3} rx={rx * 1.15} ry={ry * 1.15} fill="rgba(20,30,20,.2)" />
      <path d={`M${f1(tx - rx)} ${f1(ty)} L${f1(cx - rx)} ${f1(cy)} A${f1(rx)} ${f1(ry)} 0 0 0 ${f1(cx + rx)} ${f1(cy)} L${f1(tx + rx)} ${f1(ty)}Z`} fill="url(#cy-silo)" stroke={EDGE} />
      {band && <path d={`M${f1(tx - rx)} ${f1(ty + (cy - ty) * 0.35)} A${f1(rx)} ${f1(ry)} 0 0 0 ${f1(tx + rx)} ${f1(ty + (cy - ty) * 0.35)} L${f1(tx + rx)} ${f1(ty + (cy - ty) * 0.5)} A${f1(rx)} ${f1(ry)} 0 0 1 ${f1(tx - rx)} ${f1(ty + (cy - ty) * 0.5)}Z`} fill={band} opacity=".85" />}
      <ellipse cx={tx} cy={ty} rx={rx} ry={ry} fill={shade(c, 0.28)} stroke={EDGE} />
    </g>
  );
}
function cone(x, y, r, z0, z1, c, n = 6) {
  const apex = [x, y, z1];
  const ring = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 + 0.4;
    return [x + Math.cos(a) * r, y + Math.sin(a) * r, z0];
  });
  const faces = ring.map((p, i) => ({ p, q: ring[(i + 1) % n], i }));
  faces.sort((a, b) => a.p[0] + a.p[1] - (b.p[0] + b.p[1]));
  return faces.map(({ p, q, i }) => {
    const nx = Math.cos(((i + 0.5) / n) * Math.PI * 2 + 0.4);
    const ny = Math.sin(((i + 0.5) / n) * Math.PI * 2 + 0.4);
    const lightv = -nx * 0.6 - ny * 0.4; // luz vem de cima à esquerda
    return <polygon key={i} points={P(apex, p, q)} fill={shade(c, lightv * 0.28)} stroke="rgba(0,40,0,.18)" strokeWidth=".6" strokeLinejoin="round" />;
  });
}
function Tree({ x, y, s = 1, c = "#5aa83e" }) {
  return (
    <g>
      <ellipse cx={iso(x, y)[0] + 6 * s} cy={iso(x, y)[1] + 2} rx={16 * s} ry={6 * s} fill="rgba(20,30,20,.22)" />
      <polygon points={P([x - 2.5 * s, y - 2.5 * s, 0], [x + 2.5 * s, y - 2.5 * s, 0], [x + 2.5 * s, y + 2.5 * s, 0], [x - 2.5 * s, y + 2.5 * s, 0], [x - 2.5 * s, y + 2.5 * s, 14 * s], [x + 2.5 * s, y + 2.5 * s, 14 * s], [x + 2.5 * s, y - 2.5 * s, 14 * s])} fill="#7a5a3a" stroke={EDGE} />
      {cone(x, y, 15 * s, 12 * s, 52 * s, c)}
      {cone(x, y, 11 * s, 34 * s, 70 * s, shade(c, 0.12))}
    </g>
  );
}
function Palm({ x, y, s = 1 }) {
  const [px, py] = iso(x, y);
  const [tx, ty] = iso(x, y, 52 * s);
  return (
    <g>
      <ellipse cx={px + 5} cy={py + 2} rx="12" ry="4" fill="rgba(20,30,20,.22)" />
      <path d={`M${f1(px)} ${f1(py)} Q${f1(px + 8 * s)} ${f1((py + ty) / 2)} ${f1(tx)} ${f1(ty)}`} fill="none" stroke="#8a5a2b" strokeWidth={4.5 * s} strokeLinecap="round" />
      {[-80, -40, 0, 40, 80, 120, 170].map((a) => (
        <path key={a} transform={`translate(${f1(tx)} ${f1(ty)}) rotate(${a - 90})`} d="M0 0 Q12 -9 28 3 Q12 -2 0 0Z" fill={a % 80 ? "#3fa64a" : "#2f8f3d"} stroke="#1d6b30" strokeWidth=".6" />
      ))}
      <circle cx={tx} cy={ty + 3} r="2.6" fill="#7a4b1a" />
    </g>
  );
}
function Lamp({ x, y, night }) {
  const [px, py] = iso(x, y);
  return (
    <g>
      <ellipse cx={px + 3} cy={py + 1} rx="6" ry="2.5" fill="rgba(0,0,0,.2)" />
      <rect x={px - 1.4} y={py - 34} width="2.8" height="34" fill="#3d424e" />
      <path d={`M${px} ${py - 34} h9`} stroke="#3d424e" strokeWidth="2.6" />
      <circle cx={px + 9} cy={py - 32} r="3.6" fill={night > 0.2 ? "#fff3b0" : "#dde3ee"} stroke={EDGE} />
      {night > 0.2 && <circle cx={px + 9} cy={py - 26} r="30" fill="url(#cy-glow)" />}
    </g>
  );
}
function Bench({ x, y }) {
  return (
    <IsoBox x={x - 12} y={y - 3} w={24} h={6} z={9} c="#b0763a" shadow />
  );
}
function Umbrella({ x, y, c = "#e04b3a" }) {
  const [px, py] = iso(x, y);
  return (
    <g>
      <ellipse cx={px + 4} cy={py + 2} rx="13" ry="4.5" fill="rgba(0,0,0,.16)" />
      <polygon points={`${f1(px - 13)},${f1(py - 8)} ${f1(px + 13)},${f1(py - 8)} ${f1(px + 9)},${f1(py + 1)} ${f1(px - 9)},${f1(py + 1)}`} fill="#8fd6f5" opacity=".9" />
      <path d={`M${px} ${py} V${py - 26}`} stroke="#7a5a3a" strokeWidth="2" />
      <path d={`M${f1(px - 16)} ${f1(py - 22)} Q${px} ${f1(py - 38)} ${f1(px + 16)} ${f1(py - 22)}Z`} fill={c} stroke={EDGE} />
      <path d={`M${f1(px - 5)} ${f1(py - 22)} Q${px - 3} ${f1(py - 34)} ${px} ${f1(py - 35)} Q${px + 3} ${f1(py - 34)} ${f1(px + 5)} ${f1(py - 22)}Z`} fill="#fff" opacity=".9" />
    </g>
  );
}

/* ---------- carros ---------- */
function CarIso({ c, vertical }) {
  const body = vertical ? { x: -8, y: -17, w: 16, h: 34 } : { x: -17, y: -8, w: 34, h: 16 };
  const cab = vertical ? { x: -6, y: -9, w: 12, h: 16 } : { x: -9, y: -6, w: 16, h: 12 };
  return (
    <g>
      <IsoBox {...body} z={9} c={c} />
      <IsoBox {...cab} base={9} z={17} c="#dff3ff" top={shade(c, 0.2)} left="#9fd3ef" right="#6fa8c8" shadow={false} />
    </g>
  );
}
const CAR_COLORS = ["#d94f3a", "#3b82c4", "#e8b93a", "#43a874", "#e8832a", "#8a63c7", "#eef0f4", "#d9548f"];
function Traffic() {
  const ax = [[316, 26, 0, 0, true], [316, 26, -13, 3, true], [353, 22, -5, 1, false], [353, 22, -16, 4, false], [326, 32, -22, 6, true]];
  const by = [[582, 15, 0, 2, false], [582, 15, -8, 5, false], [620, 18, -4, 7, true], [620, 18, -12, 0, true]];
  return (
    <g pointerEvents="none">
      {ax.map(([y, dur, delay, ci, rev], i) => (
        <g key={"a" + i} transform={`translate(${iso(0, y).map(f1).join(" ")})`}>
          <g className="cy-ax" style={{ animationDuration: dur + "s", animationDelay: delay + "s", animationDirection: rev ? "reverse" : "normal" }}>
            <CarIso c={CAR_COLORS[ci]} />
          </g>
        </g>
      ))}
      {by.map(([x, dur, delay, ci, rev], i) => (
        <g key={"b" + i} transform={`translate(${iso(x, 0).map(f1).join(" ")})`}>
          <g className="cy-by" style={{ animationDuration: dur + "s", animationDelay: delay + "s", animationDirection: rev ? "reverse" : "normal" }}>
            <CarIso c={CAR_COLORS[ci]} vertical />
          </g>
        </g>
      ))}
    </g>
  );
}

/* ---------- prédios públicos ---------- */
const BLD = {
  banco: { c: "#ecdfc2", z: 118, roof: "#2f8f62", sign: "BANCO", sc: "#1f4f8a", tc: "#ffd45a" },
  mercado: { c: "#e8913c", z: 100, sign: "MERCADO", sc: "#fff4dc", tc: "#b45a10" },
  hospital: { c: "#e8f2f2", z: 140, sign: "HOSPITAL", sc: "#2aa0a8", tc: "#fff" },
  escola: { c: "#d98c4a", z: 120, roof: "#2f5fa8", sign: "ESCOLA", sc: "#fff4dc", tc: "#8a4a12" },
  empregos: { c: "#2b8f9a", z: 215, sign: "EMPREGOS", sc: "#0f3d44", tc: "#7ff0ff" },
  lazer: { c: "#d9548f", z: 112, sign: "CINE", sc: "#1f1233", tc: "#fde047" },
  imobiliaria: { c: "#5db2a3", z: 104, roof: "#c0562e", sign: "IMOBILIÁRIA", sc: "#fff", tc: "#0f766e" },
  concessionaria: { c: "#e2a03c", z: 96, sign: "AUTO CENTER", sc: "#2b1a08", tc: "#ffd07a" },
  cassino: { c: "#b33a3a", z: 108, sign: "CASSINORA", sc: "#1b0b0b", tc: "#ffd34d" },
};

function Building({ b, night, onPick }) {
  const lit = night > 0.2;
  const cfg = BLD[b.id];
  const [lx, ly] = iso(b.x + b.w / 2, b.y + b.h, 0);
  if (b.kiosk) {
    const z = 50;
    return (
      <g className="city-hit" onClick={() => onPick(b)}>
        <IsoBox x={b.x} y={b.y} w={b.w} h={b.h} z={z} c={shade(b.color, 0.1)} />
        <FaceL x={b.x} y={b.y} h={b.h} z={z}>
          <Glass x={8} y={16} w={b.w - 16} h={14} lit={lit} />
          <rect x="6" y="32" width={b.w - 12} height="5" fill="#b0763a" />
          <circle cx={b.w / 2} cy="8" r="6.5" fill="#fff" stroke={EDGE} />
          <text x={b.w / 2} y="12" fontSize="9" textAnchor="middle">{b.icon}</text>
        </FaceL>
        <polygon points={P([b.x - 4, b.y + b.h + 8, z - 14], [b.x + b.w + 4, b.y + b.h + 8, z - 14], [b.x + b.w + 4, b.y + b.h, z], [b.x - 4, b.y + b.h, z])} fill={b.color} stroke={EDGE} />
        <polygon points={P([b.x + b.w + 4, b.y + b.h + 8, z - 14], [b.x + b.w + 4, b.y + b.h, z], [b.x + b.w + 4, b.y, z])} fill={shade(b.color, -0.3)} opacity="0" />
        <text x={lx} y={ly + 13} fontSize="9.5" textAnchor="middle" fill="#fff" stroke="rgba(15,20,45,.85)" strokeWidth="3" paintOrder="stroke" fontWeight="800">{b.name}</text>
      </g>
    );
  }
  const z = cfg.z;
  const w = b.w;
  const h = b.h;
  const cx = w / 2;
  return (
    <g className="city-hit" onClick={() => onPick(b)}>
      <IsoBox x={b.x} y={b.y} w={w} h={h} z={z} c={cfg.c} />
      {/* telhado / topo */}
      {b.id === "banco" && <Gable x={b.x} y={b.y} w={w} h={h} z={z} rh={26} c={cfg.roof} ridge="y" />}
      {b.id === "escola" && <Gable x={b.x} y={b.y} w={w} h={h} z={z} rh={22} c={cfg.roof} ridge="x" />}
      {b.id === "imobiliaria" && <Gable x={b.x + 6} y={b.y + 6} w={w - 12} h={h - 12} z={z} rh={20} c={cfg.roof} ridge="x" />}
      {b.id === "hospital" && (
        <g>
          <ellipse cx={iso(b.x + w / 2, b.y + h / 2, z)[0]} cy={iso(b.x + w / 2, b.y + h / 2, z)[1]} rx="26" ry="13" fill="#3b4a6b" stroke="#ffd45a" strokeWidth="1.6" />
          <text x={iso(b.x + w / 2, b.y + h / 2, z)[0]} y={iso(b.x + w / 2, b.y + h / 2, z)[1] + 4.5} fontSize="13" fontWeight="900" textAnchor="middle" fill="#fff">H</text>
        </g>
      )}
      {b.id === "escola" && (
        <g>
          <IsoBox x={b.x + 38} y={b.y + 40} w={30} h={30} z={z + 48} base={z + 14} c="#e8a35a" shadow={false} />
          <Gable x={b.x + 38} y={b.y + 40} w={30} h={30} z={z + 48} rh={16} c="#8b2f2f" ridge="x" oh={3} />
          <circle cx={iso(b.x + 53, b.y + 70, z + 34)[0]} cy={iso(b.x + 53, b.y + 70, z + 34)[1]} r="7" fill="#fff" stroke="#4a2f1a" strokeWidth="1.5" />
        </g>
      )}
      {b.id === "empregos" && (
        <g>
          <IsoBox x={b.x + 16} y={b.y + 24} w={w - 32} h={h - 48} z={z + 36} base={z} c="#34a3b0" shadow={false} />
          <path d={`M${iso(b.x + 30, b.y + 40, z + 36).map(f1).join(" ")} L${iso(b.x + 30, b.y + 40, z + 80).map(f1).join(" ")}`} stroke="#64748b" strokeWidth="2" />
          <circle cx={iso(b.x + 30, b.y + 40, z + 80)[0]} cy={iso(b.x + 30, b.y + 40, z + 80)[1]} r="2.4" fill="#ef4444" className="cy-blink" />
        </g>
      )}
      {b.id === "lazer" && (
        <g>
          <polygon points={P([b.x + 10, b.y + h - 6, z], [b.x + w - 10, b.y + h - 6, z], [b.x + w - 10, b.y + h - 6, z + 34], [b.x + 10, b.y + h - 6, z + 34])} fill="#1f1233" stroke="#fde047" strokeWidth="1.6" />
          <text transform={`translate(${iso(b.x + 10, b.y + h - 6, z + 8).map(f1).join(" ")}) matrix(${S} ${S / 2} 0 ${Z} 0 0)`} fontSize="22" fontWeight="900" fill="#fde047">CINE ★</text>
        </g>
      )}
      {b.id === "concessionaria" && (
        <g>
          <path d={`M${iso(b.x + 4, b.y + h, z + 12).map(f1).join(" ")} L${iso(b.x + w - 4, b.y + h, z + 12).map(f1).join(" ")}`} stroke="#475569" />
          {Array.from({ length: 8 }, (_, i) => {
            const [qx, qy] = iso(b.x + 8 + i * 13.4, b.y + h, z + 12);
            return <path key={i} d={`M${f1(qx)} ${f1(qy)} l5 0 l-2.5 8Z`} fill={["#ffd45a", "#43a874", "#3b82c4", "#d94f3a"][i % 4]} />;
          })}
        </g>
      )}
      {b.id === "cassino" && (
        <g>
          <ellipse cx={iso(b.x + w / 2, b.y + h / 2, z)[0]} cy={iso(b.x + w / 2, b.y + h / 2, z - 6)[1]} rx="46" ry="20" fill="#d4a017" stroke="#8a6a00" />
          <path d={`M${f1(iso(b.x + w / 2, b.y + h / 2, z)[0] - 40)} ${f1(iso(b.x + w / 2, b.y + h / 2, z)[1])} Q${f1(iso(b.x + w / 2, b.y + h / 2, z)[0])} ${f1(iso(b.x + w / 2, b.y + h / 2, z + 70)[1])} ${f1(iso(b.x + w / 2, b.y + h / 2, z)[0] + 40)} ${f1(iso(b.x + w / 2, b.y + h / 2, z)[1])}Z`} fill="#ffd34d" stroke="#8a6a00" />
          <path d={`M${f1(iso(b.x + w / 2, b.y + h / 2, z)[0])} ${f1(iso(b.x + w / 2, b.y + h / 2, z + 66)[1] - 4)} l3 -9 l3 9 l9 3 l-9 3 l-3 9 l-3 -9 l-9 -3Z`} fill="#fff" className="cy-blink" />
        </g>
      )}
      {/* fachada da frente (+y) */}
      <FaceL x={b.x} y={b.y} h={h} z={z}>
        <rect x="0" y={z - 8} width={w} height="8" fill="rgba(0,0,0,.18)" />
        <rect x={cx - 32} y="8" width="64" height="16" rx="3" fill={cfg.sc} stroke={EDGE} />
        <text x={cx} y="20.5" fontSize="10.5" fontWeight="900" textAnchor="middle" fill={cfg.tc}>{cfg.sign}</text>
        {b.id === "banco" && (
          <g>
            {[8, 34, 66, 92].map((x) => <rect key={x} x={x} y="30" width="10" height={z - 40} fill="#fbf6ea" stroke={EDGE} />)}
            <rect x="0" y={z - 10} width={w} height="10" fill="#d8ceb4" />
            <Glass x={20} y={40} w={12} h={34} lit={lit} />
            <Glass x={78} y={40} w={12} h={34} lit={lit} />
            <rect x={cx - 11} y={z - 44} width="22" height="36" rx="2" fill="#a16207" stroke={EDGE} />
          </g>
        )}
        {b.id === "mercado" && (
          <g>
            <Awning x={4} y={30} w={102} c1="#fff" c2="#2f9e5b" n={9} h={14} />
            <Glass x={8} y={50} w={34} h={34} lit={lit} />
            <Glass x={68} y={50} w={34} h={34} lit={lit} />
            <rect x={cx - 10} y={50} width="20" height={z - 52} fill="#14532d" stroke={EDGE} />
            {[14, 26, 76, 90].map((x, i) => <circle key={x} cx={x} cy={z - 6} r="5" fill={["#ef4444", "#f59e0b", "#84cc16", "#ef4444"][i]} />)}
          </g>
        )}
        {b.id === "hospital" && (
          <g>
            <circle cx={cx} cy="46" r="15" fill="#fff" stroke="#ef4444" strokeWidth="2" />
            <rect x={cx - 3} y="36" width="6" height="20" fill="#ef4444" />
            <rect x={cx - 10} y="43" width="20" height="6" fill="#ef4444" />
            <WinGrid x={4} y={62} w={102} h={z - 62 - 44} cols={4} rows={2} lit={lit} gap={5} />
            <rect x={cx - 17} y={z - 40} width="34" height="40" fill="#bfe9ee" stroke={EDGE} />
            <rect x={cx - 21} y={z - 44} width="42" height="6" fill="#ef4444" />
          </g>
        )}
        {b.id === "escola" && (
          <g>
            <WinGrid x={4} y={30} w={102} h={z - 30 - 38} cols={4} rows={2} lit={lit} gap={6} />
            <rect x={cx - 12} y={z - 40} width="24" height="40" rx="2" fill="#5b2f14" stroke={EDGE} />
          </g>
        )}
        {b.id === "empregos" && (
          <g>
            <WinGrid x={3} y={30} w={104} h={z - 30 - 44} cols={5} rows={8} lit={lit} gap={3} />
            <rect x="0" y="62" width={w} height="4" fill="#ff9a3c" />
            <rect x="0" y="126" width={w} height="4" fill="#ff9a3c" />
            <rect x={cx - 14} y={z - 42} width="28" height="42" fill="#0f3d44" stroke={EDGE} />
          </g>
        )}
        {b.id === "lazer" && (
          <g>
            {[10, 42, 74].map((x, i) => (
              <g key={x}>
                <rect x={x} y="34" width="26" height="40" fill="#111827" stroke="#fde047" />
                <rect x={x + 3} y="37" width="20" height="34" fill={["#22d3ee", "#f97316", "#a3e635"][i]} />
                <circle cx={x + 13} cy="54" r="7" fill={["#6366f1", "#facc15", "#16a34a"][i]} />
              </g>
            ))}
            <rect x={cx - 13} y={z - 38} width="26" height="38" fill="#1f1233" stroke={EDGE} />
          </g>
        )}
        {b.id === "imobiliaria" && (
          <g>
            {[10, 62].map((x) => (
              <g key={x}>
                <Glass x={x} y={32} w={38} h={42} lit={lit} />
                {[0, 1].map((k) => <rect key={k} x={x + 4 + k * 17} y="38" width="13" height="16" fill="#fff" stroke="#999" strokeWidth=".6" />)}
              </g>
            ))}
            <rect x={cx - 9} y={z - 40} width="18" height="40" fill="#134e4a" stroke={EDGE} />
          </g>
        )}
        {b.id === "concessionaria" && (
          <g>
            <rect x="6" y="34" width="98" height={z - 36} fill={lit ? "#ffd86b" : "#bfe8f5"} stroke={EDGE} />
            <rect x="6" y={z - 12} width="98" height="10" fill="#cbd5e1" />
            <rect x="16" y={z - 28} width="30" height="14" rx="5" fill="#d94f3a" />
            <rect x="62" y={z - 28} width="30" height="14" rx="5" fill="#3b82c4" />
          </g>
        )}
        {b.id === "cassino" && (
          <g>
            <WinGrid x={6} y={34} w={44} h={z - 34 - 36} cols={2} rows={1} lit gap={5} />
            <WinGrid x={w - 50} y={34} w={44} h={z - 34 - 36} cols={2} rows={1} lit gap={5} />
            <rect x={cx - 14} y={z - 46} width="28" height="46" fill="#3b0a0a" stroke="#ffd34d" />
            <rect x={cx - 16} y={z - 8} width="32" height="8" fill="#dc2626" />
          </g>
        )}
      </FaceL>
      {/* lateral (+x) */}
      <FaceR x={b.x} y={b.y} w={w} h={h} z={z}>
        {b.id === "empregos" ? (
          <WinGrid x={3} y={10} w={h - 6} h={z - 30} cols={5} rows={8} lit={lit} gap={3} />
        ) : (
          <WinGrid x={4} y={14} w={h - 8} h={Math.max(30, z - 40)} cols={3} rows={Math.max(1, Math.floor(z / 46))} lit={lit} gap={6} />
        )}
      </FaceR>
      <text x={lx} y={ly + 16} fontSize="11.5" textAnchor="middle" fill="#fff" stroke="rgba(15,20,45,.85)" strokeWidth="3.2" paintOrder="stroke" fontWeight="800">{b.name}</text>
    </g>
  );
}

/* ---------- casas dos jogadores ---------- */
function House({ plot, tier, wall, roof, lit }) {
  const p = plot;
  const px = p.x;
  const py = p.y;
  const door = [px + p.w / 2, py + p.h];
  const pool = (x, y, w, h) => (
    <g>
      <polygon points={P([x - 3, y - 3], [x + w + 3, y - 3], [x + w + 3, y + h + 3], [x - 3, y + h + 3])} fill="#eef3f6" stroke={EDGE} />
      <polygon points={P([x, y], [x + w, y], [x + w, y + h], [x, y + h])} fill="#3bb7e0" />
      <polygon points={P([x + 3, y + 3], [x + w * 0.5, y + 3], [x + w * 0.3, y + h * 0.5], [x + 3, y + h * 0.5])} fill="#9be3f7" opacity=".6" />
    </g>
  );
  if (tier <= 1) {
    const x = px + 22, y = py + 24, w = 66, h = 56, z = 46;
    return (
      <g>
        <IsoBox x={x} y={y} w={w} h={h} z={z} c={wall}>
          <polygon points={P([x + 3, y + 3, z], [x + w - 3, y + 3, z], [x + w - 3, y + h - 3, z], [x + 3, y + h - 3, z])} fill={shade(roof, 0.05)} opacity=".85" />
        </IsoBox>
        <FaceL x={x} y={y} h={h} z={z}>
          <Glass x={8} y={14} w={16} h={16} lit={lit} />
          <rect x={w - 26} y={z - 30} width="16" height="30" rx="2" fill="#6b4423" stroke={EDGE} />
        </FaceL>
        <FaceR x={x} y={y} w={w} h={h} z={z}><Glass x={10} y={12} w={14} h={16} lit={lit} /><Glass x={34} y={12} w={14} h={16} lit={lit} /></FaceR>
      </g>
    );
  }
  if (tier === 2) {
    const x = px + 14, y = py + 24, w = 82, h = 64, z = 54;
    return (
      <g>
        <IsoBox x={x} y={y} w={w} h={h} z={z} c={wall} />
        <Gable x={x} y={y} w={w} h={h} z={z} rh={34} c={roof} ridge="x" />
        <IsoBox x={x + 56} y={y + 14} w={10} h={10} z={z + 44} base={z + 14} c="#9a5a3a" shadow={false} />
        <FaceL x={x} y={y} h={h} z={z}>
          <Glass x={8} y={12} w={18} h={18} lit={lit} />
          <Glass x={w - 26} y={12} w={18} h={18} lit={lit} />
          <rect x={w / 2 - 9} y={z - 32} width="18" height="32" rx="2" fill="#6b4423" stroke={EDGE} />
          <rect x={w / 2 - 14} y={z - 3} width="28" height="3" fill="#d9d2c0" />
        </FaceL>
        <FaceR x={x} y={y} w={w} h={h} z={z}><Glass x={12} y={12} w={16} h={18} lit={lit} /><Glass x={38} y={12} w={16} h={18} lit={lit} /></FaceR>
        {Array.from({ length: 7 }, (_, i) => <polygon key={i} points={P([px + 4 + i * 14, py + p.h - 10, 0], [px + 4 + i * 14, py + p.h - 10, 12], [px + 6 + i * 14, py + p.h - 10, 12], [px + 6 + i * 14, py + p.h - 10, 0])} fill="#fff" stroke={EDGE} strokeWidth=".6" />)}
      </g>
    );
  }
  if (tier === 3) {
    const x = px + 22, y = py + 14, w = 62, h = 60, z = 132;
    return (
      <g>
        <IsoBox x={x} y={y} w={w} h={h} z={z} c={wall} />
        <IsoBox x={x + 8} y={y + 8} w={w - 16} h={h - 16} z={z + 12} base={z} c={shade(wall, -0.06)} shadow={false} />
        <FaceL x={x} y={y} h={h} z={z}>
          <WinGrid x={2} y={8} w={w - 4} h={z - 40} cols={3} rows={4} lit={lit} gap={5} />
          {[0, 1, 2, 3].map((r) => <rect key={r} x="2" y={8 + 5 + r * ((z - 40 - 5) / 4) + (z - 40 - 5) / 4 - 4} width={w - 4} height="3" fill={shade(wall, -0.3)} />)}
          <rect x={w / 2 - 9} y={z - 28} width="18" height="28" fill="#27272a" stroke={EDGE} />
        </FaceL>
        <FaceR x={x} y={y} w={w} h={h} z={z}><WinGrid x={3} y={8} w={h - 6} h={z - 40} cols={3} rows={4} lit={lit} gap={5} /></FaceR>
        {pool(px + 6, py + 80, 40, 26)}
      </g>
    );
  }
  const x = px + 8, y = py + 26, w = 94, h = 64, z = 60;
  return (
    <g>
      <IsoBox x={x} y={y} w={w} h={h} z={z} c={wall} />
      <Gable x={x} y={y} w={w} h={h} z={z} rh={26} c={roof} ridge="x" />
      <IsoBox x={x + 28} y={y + 14} w={38} h={38} z={z + 44} base={z} c={shade(wall, 0.05)} shadow={false} />
      <Gable x={x + 28} y={y + 14} w={38} h={38} z={z + 44} rh={22} c={roof} ridge="y" oh={3} />
      <FaceL x={x} y={y} h={h} z={z}>
        <Glass x={8} y={12} w={14} h={20} lit={lit} />
        <Glass x={28} y={12} w={12} h={20} lit={lit} />
        <Glass x={w - 40} y={12} w={12} h={20} lit={lit} />
        <Glass x={w - 22} y={12} w={14} h={20} lit={lit} />
        <rect x={w / 2 - 9} y={z - 34} width="18" height="34" rx="2" fill="#3f2a17" stroke="#ffd34d" />
        {[34, 60].map((cx) => <rect key={cx} x={cx} y="8" width="4" height={z - 8} fill="#fff" stroke={EDGE} strokeWidth=".6" />)}
      </FaceL>
      <FaceR x={x} y={y} w={w} h={h} z={z}><Glass x={10} y={12} w={16} h={20} lit={lit} /><Glass x={36} y={12} w={16} h={20} lit={lit} /></FaceR>
      <g>
        <path d={`M${iso(x + 52, y + 14, z + 44 + 22).map(f1).join(" ")} v-16`} stroke="#555" strokeWidth="1.5" />
        <path d={`M${iso(x + 52, y + 14, z + 44 + 22 + 16).map(f1).join(" ")} l14 4 l-14 4Z`} fill="#ffd45a" stroke="#ca8a04" className="cy-flag" />
      </g>
      {pool(px + 6, py + 100, 36, 22)}
    </g>
  );
}

function Plot({ i, owner, night, onPick }) {
  const p = PLOTS[i];
  const south = i >= 8;
  const houseItem = owner && ITEMS[owner.assets?.house];
  const accent = owner ? OUTFIT_COLORS[dollOf(owner).outfitColor] : "#9aa3b2";
  const veh = owner && ITEMS[owner.assets?.vehicle];
  const lit = night > 0.2;
  const [lx, ly] = iso(p.x + p.w / 2, south ? p.y + 6 : p.y + p.h - 6, 0);
  const [sx, sy] = iso(p.x + p.w / 2, p.y + p.h - 18, 0);
  const [vx, vy] = iso(p.x + 96, p.y + p.h - 14, 0);
  return (
    <g className="city-hit" onClick={() => onPick(i)}>
      {houseItem ? (
        <House plot={{ ...p, y: south ? p.y + 0 : p.y, h: p.h }} tier={houseItem.tier} wall={shade(accent, 0.6)} roof={shade(accent, -0.1)} lit={lit} />
      ) : (
        <g>
          <path d={`M${f1(sx)} ${f1(sy)} v-36`} stroke="#6b4a2a" strokeWidth="3" />
          <rect x={sx - 30} y={sy - 58} width="60" height="24" rx="3" fill="#fff" stroke="#d94f3a" strokeWidth="2" />
          <text x={sx} y={sy - 41} fontSize="11" textAnchor="middle" fill="#d94f3a" fontWeight="900">À VENDA</text>
        </g>
      )}
      {veh && <text x={vx} y={vy} fontSize="19" textAnchor="middle">{veh.icon}</text>}
      {owner && (
        <g>
          <rect x={lx - 50} y={ly - 2} width="100" height="15" rx="7" fill="rgba(15,20,45,.72)" />
          <text x={lx} y={ly + 9} fontSize="10.5" textAnchor="middle" fill="#fff" fontWeight="700">{(owner.persona?.name || owner.nickname || "").slice(0, 16)}</text>
        </g>
      )}
    </g>
  );
}

/* ---------- cenário de fundo ---------- */
function Tower({ x, y, w, h, z, kind = "blue", heli, lit }) {
  const c = kind === "orange" ? "#e0b78a" : kind === "glass" ? "#2b8f9a" : "#3d8fc0";
  return (
    <g>
      <IsoBox x={x} y={y} w={w} h={h} z={z} c={c} />
      <FaceL x={x} y={y} h={h} z={z}><rect x="2" y="3" width={w - 4} height={z - 6} fill={kind === "orange" ? (lit ? "url(#cy-win-ol)" : "url(#cy-win-o)") : lit ? "url(#cy-win-l)" : "url(#cy-win)"} /></FaceL>
      <FaceR x={x} y={y} w={w} h={h} z={z}><rect x="2" y="3" width={h - 4} height={z - 6} fill={kind === "orange" ? (lit ? "url(#cy-win-ol)" : "url(#cy-win-o)") : lit ? "url(#cy-win-l)" : "url(#cy-win)"} /></FaceR>
      {kind === "glass" && <IsoBox x={x + 6} y={y + 6} w={w - 12} h={h - 12} z={z + 14} base={z} c="#34a3b0" shadow={false} />}
      {heli && (
        <g>
          <ellipse cx={iso(x + w / 2, y + h / 2, z)[0]} cy={iso(x + w / 2, y + h / 2, z)[1]} rx={w * 0.4} ry={w * 0.2} fill="#3b4a6b" stroke="#ffd45a" />
          <text x={iso(x + w / 2, y + h / 2, z)[0]} y={iso(x + w / 2, y + h / 2, z)[1] + 3.5} fontSize="10" fontWeight="900" textAnchor="middle" fill="#fff">H</text>
        </g>
      )}
    </g>
  );
}
function Factory({ lit }) {
  return (
    <g>
      <IsoBox x={316} y={30} w={86} h={56} z={50} c="#b9c2cf" />
      {[0, 1, 2, 3].map((i) => <polygon key={i} points={P([318 + i * 20, 86, 50], [318 + i * 20, 86, 66], [336 + i * 20, 86, 50])} fill="#9aa5b6" stroke={EDGE} />)}
      <FaceL x={316} y={30} h={56} z={50}><Glass x={60} y={14} w={20} h={16} lit={lit} /><rect x="12" y="14" width="22" height="36" fill="#6b7280" /></FaceL>
      {[330, 358].map((x, i) => (
        <g key={x}>
          <Cyl x={x} y={40} r={6} z={110} c="#cbd5e1" band="#ef4444" />
          {[0, 1, 2].map((k) => <circle key={k} cx={iso(x, 40, 114)[0]} cy={iso(x, 40, 114)[1]} r={5 + k} fill="#e5e7eb" opacity=".7" className="cy-smoke" style={{ animationDelay: -(i + k) * 1.1 + "s" }} />)}
        </g>
      ))}
      {[420, 452, 484].map((x, i) => <Cyl key={x} x={x} y={52} r={13} z={86 - i * 6} c="#eef2f7" />)}
      <Cyl x={522} y={66} r={13} z={56} c="#93c5fd" />
    </g>
  );
}
function Skyline({ lit }) {
  return (
    <g>
      <Tower x={672} y={30} w={44} h={44} z={190} lit={lit} />
      <Tower x={728} y={26} w={40} h={40} z={235} kind="glass" lit={lit} />
      <Tower x={782} y={30} w={54} h={46} z={150} kind="orange" heli lit={lit} />
      <Tower x={848} y={24} w={42} h={42} z={215} lit={lit} />
      <Tower x={902} y={30} w={58} h={48} z={120} kind="orange" lit={lit} />
    </g>
  );
}
function Mine() {
  const [cx, cy] = iso(130, 56, 0);
  const steps = [[116, "#8a6340"], [96, "#9a7048"], [78, "#7c583a"], [60, "#6a4a30"], [42, "#573b26"], [26, "#3f2a1a"]];
  const a = iso(130, 56, 4);
  const b = iso(310, 40, 70);
  return (
    <g>
      {steps.map(([r, c], i) => {
        const rx = r * S * 1.414 * 0.85;
        return <ellipse key={i} cx={cx} cy={cy + i * 4} rx={rx} ry={rx / 2} fill={c} stroke="rgba(0,0,0,.25)" />;
      })}
      <path d={`M${f1(cx - 80)} ${f1(cy + 2)} Q${f1(cx)} ${f1(cy + 30)} ${f1(cx + 80)} ${f1(cy + 2)}`} fill="none" stroke="#d2ad72" strokeWidth="3.5" strokeDasharray="9 6" />
      <g transform={`translate(${f1(cx - 24)} ${f1(cy + 14)})`}>
        <IsoBox x={0} y={0} w={22} h={12} z={9} c="#f0c430" shadow={false} />
        <IsoBox x={-10} y={0} w={10} h={12} base={0} z={14} c="#e89a1c" shadow={false} />
      </g>
      <path d={`M${f1(a[0])} ${f1(a[1])} L${f1(b[0])} ${f1(b[1])}`} stroke="#7a5d00" strokeWidth="9" strokeLinecap="round" />
      <path d={`M${f1(a[0])} ${f1(a[1])} L${f1(b[0])} ${f1(b[1])}`} stroke="#f4c20d" strokeWidth="6" strokeLinecap="round" />
      <path d={`M${f1(a[0])} ${f1(a[1])} L${f1(b[0])} ${f1(b[1])}`} stroke="#fff6bf" strokeWidth="1.5" strokeDasharray="4 7" className="cy-belt" />
      {[0.3, 0.6, 0.9].map((t) => {
        const px = a[0] + (b[0] - a[0]) * t;
        const py = a[1] + (b[1] - a[1]) * t;
        return <path key={t} d={`M${f1(px)} ${f1(py)} V${f1(py + 26)}`} stroke="#475569" strokeWidth="3" />;
      })}
      {cone(480 * 0 + 300, 36, 12, 0, 22, "#8b93a1", 5).length ? null : null}
    </g>
  );
}
function Park() {
  const [px, py] = iso(1030, 56, 0);
  const [fx, fy] = iso(1140, 40, 0);
  return (
    <g>
      <ellipse cx={px} cy={py} rx="34" ry="14" fill="#53c1ea" stroke="#fff" strokeWidth="2.5" />
      <path d={`M${f1(px - 16)} ${f1(py)} q5 -3 10 0 t10 0 t10 0`} stroke="#fff" fill="none" opacity=".7" />
      <path d={`M${f1(fx - 30)} ${f1(fy + 2)} L${f1(fx)} ${f1(fy - 78)} L${f1(fx + 30)} ${f1(fy + 2)}`} fill="none" stroke="#64748b" strokeWidth="3" />
      <circle cx={fx} cy={fy - 78} r="40" fill="none" stroke="#94a3b8" strokeWidth="2.4" />
      <g className="cy-spin" style={{ transformOrigin: `${f1(fx)}px ${f1(fy - 78)}px` }}>
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          const x = fx + Math.cos(a) * 40;
          const y = fy - 78 + Math.sin(a) * 40;
          return (
            <g key={i}>
              <path d={`M${f1(fx)} ${f1(fy - 78)} L${f1(x)} ${f1(y)}`} stroke="#cbd5e1" strokeWidth="1.2" />
              <rect x={x - 5} y={y - 3} width="10" height="8" rx="2" fill={["#d94f3a", "#e8b93a", "#3b82c4", "#43a874"][i % 4]} stroke={EDGE} />
            </g>
          );
        })}
      </g>
    </g>
  );
}

/* ---------- itens ordenados por profundidade ---------- */
const TREES = [
  [132, 262], [262, 262], [392, 262], [684, 262], [814, 262], [944, 262], [1074, 262], [60, 396], [250, 396], [470, 396], [760, 396], [900, 396], [1100, 396],
  [552, 70], [648, 70], [552, 180], [648, 180], [552, 470], [648, 470], [552, 650], [648, 650],
  [980, 90], [1090, 94], [1068, 70], [28, 150], [1176, 150], [300, 10], [20, 690], [1180, 690],
];
const PALMS = [[60, -22], [220, -22], [390, -22], [760, -22], [930, -22], [1110, -22], [60, 742], [300, 742], [520, 742], [700, 742], [1000, 742], [-22, 130], [-22, 300], [-22, 470], [-22, 640], [1222, 130], [1222, 300], [1222, 470], [1222, 640]];
const LAMPS = [[80, 298], [240, 298], [400, 298], [720, 298], [880, 298], [1040, 298], [1160, 298], [100, 372], [260, 372], [420, 372], [700, 372], [860, 372], [1020, 372], [558, 120], [642, 120], [558, 200], [642, 200], [558, 440], [642, 440], [558, 520], [642, 520]];
const BENCHES = [[40, 404], [180, 404], [330, 404], [820, 404], [980, 404], [1120, 404]];
const UMBRELLAS = [[160, 748, "#e04b3a"], [640, 750, "#3b82c4"], [1040, 748, "#e8b93a"], [-24, 380, "#43a874"], [1226, 250, "#d9548f"]];

const DESC = [];
BUILDINGS.forEach((b) => DESC.push({ key: "b-" + b.id, depth: b.x + b.w + b.y + b.h, kind: "b", b }));
PLOTS.forEach((p, i) => DESC.push({ key: "p-" + i, depth: p.x + p.w + p.y + p.h, kind: "p", i }));
TREES.forEach(([x, y], i) => DESC.push({ key: "t-" + i, depth: x + y + 2, kind: "t", x, y, i }));
PALMS.forEach(([x, y], i) => DESC.push({ key: "pm-" + i, depth: x + y, kind: "pm", x, y }));
LAMPS.forEach(([x, y], i) => DESC.push({ key: "l-" + i, depth: x + y, kind: "l", x, y }));
BENCHES.forEach(([x, y], i) => DESC.push({ key: "bn-" + i, depth: x + y + 3, kind: "bn", x, y }));
UMBRELLAS.forEach(([x, y, c], i) => DESC.push({ key: "um-" + i, depth: x + y, kind: "um", x, y, c }));
DESC.push({ key: "bg-fac", depth: 540 + 90, kind: "fac" }, { key: "bg-sky", depth: 960 + 80, kind: "sky" });
DESC.sort((a, b) => a.depth - b.depth);
export const SORTED = DESC;

function Item({ d, owners, night, onBuilding, onPlot }) {
  const lit = night > 0.2;
  switch (d.kind) {
    case "b":
      return <Building b={d.b} night={night} onPick={onBuilding} />;
    case "p":
      return <Plot i={d.i} owner={owners[d.i]} night={night} onPick={onPlot} />;
    case "t":
      return <Tree x={d.x} y={d.y} s={d.i % 3 === 0 ? 1.15 : 0.95} c={d.i % 2 ? "#5aa83e" : "#6fb544"} />;
    case "pm":
      return <Palm x={d.x} y={d.y} s={0.9} />;
    case "l":
      return <Lamp x={d.x} y={d.y} night={night} />;
    case "bn":
      return <Bench x={d.x} y={d.y} />;
    case "um":
      return <Umbrella x={d.x} y={d.y} c={d.c} />;
    case "fac":
      return <Factory lit={lit} />;
    case "sky":
      return <Skyline lit={lit} />;
    default:
      return null;
  }
}

/* ---------- chão, ruas e mar ---------- */
function Sea() {
  const v = VIEW;
  const waves = Array.from({ length: 34 }, (_, i) => {
    const t = (i * 137) % 100;
    const x = v.x + ((i * 97) % v.w);
    const y = v.y + ((t * 9 + i * 41) % v.h);
    return <path key={i} className="cy-wave" style={{ animationDelay: -(i % 6) * 0.7 + "s" }} d={`M${x} ${y} q6 -5 12 0 t12 0 t12 0`} fill="none" stroke="#fff" strokeWidth="1.6" opacity=".4" />;
  });
  return (
    <g pointerEvents="none">
      <rect x={v.x} y={v.y} width={v.w} height={v.h} fill="url(#cy-sea)" />
      {waves}
      <g className="cy-bob"><polygon points="60,110 120,110 108,126 72,126" fill="#7c4a22" /><polygon points="90,106 90,60 118,104" fill="#fff" stroke={EDGE} /><polygon points="86,104 86,70 66,104" fill="#fde68a" stroke={EDGE} /></g>
      <g className="cy-bob"><polygon points="1230,330 1290,330 1278,346 1242,346" fill="#7c4a22" /><polygon points="1262,326 1262,284 1288,328" fill="#fff" stroke={EDGE} /></g>
      <g className="cy-bob"><polygon points="40,700 140,700 128,722 54,722" fill="#1f2a44" stroke={EDGE} /><rect x="62" y="680" width="22" height="20" fill="#d94f3a" /><rect x="86" y="680" width="22" height="20" fill="#3b82c4" /><rect x="110" y="684" width="20" height="16" fill="#e8b93a" /></g>
    </g>
  );
}
function Ground() {
  const T = 44; // espessura da ilha
  const sand = [[-44, -44], [1244, -44], [1244, 764], [-44, 764]];
  const grass = [[0, 0], [MAP_W, 0], [MAP_W, MAP_H], [0, MAP_H]];
  const poly = (pts, z = 0) => pts.map(([x, y]) => iso(x, y, z).map(f1).join(",")).join(" ");
  const rect = (x, y, w, h) => poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]]);
  const edgeL = [[-44, 764, 0], [1244, 764, 0], [1244, 764, -T], [-44, 764, -T]];
  const edgeR = [[1244, -44, 0], [1244, 764, 0], [1244, 764, -T], [1244, -44, -T]];
  const pp = (pts) => pts.map(([x, y, z]) => iso(x, y, z).map(f1).join(",")).join(" ");
  return (
    <g pointerEvents="none">
      {/* ilha flutuante: terra por baixo */}
      <polygon points={pp(edgeL)} fill="#8a5a36" stroke={EDGE} />
      <polygon points={pp([[-44, 764, -T * 0.55], [1244, 764, -T * 0.55], [1244, 764, -T], [-44, 764, -T]])} fill="#6b4328" />
      <polygon points={pp(edgeR)} fill="#6b4328" stroke={EDGE} />
      <polygon points={pp([[1244, -44, -T * 0.55], [1244, 764, -T * 0.55], [1244, 764, -T], [1244, -44, -T]])} fill="#52331c" />
      <polygon points={poly(sand)} fill="#f0dc9c" stroke="#fff" strokeWidth="3" strokeDasharray="2 9" strokeLinecap="round" />
      <polygon points={poly(grass)} fill="#6cbf5a" />
      {Array.from({ length: 14 }, (_, i) => <polygon key={i} points={rect(0, i * 52, MAP_W, 26)} fill="rgba(255,255,255,.05)" />)}
      {/* calçadas */}
      <polygon points={rect(0, 246, 1200, 178)} fill="#e3d8bf" stroke="#c9bd9f" strokeWidth="1.5" />
      <polygon points={rect(548, 0, 104, 720)} fill="#e3d8bf" stroke="#c9bd9f" strokeWidth="1.5" />
      <polygon points={rect(0, 566, 1200, 40)} fill="#e3d8bf" stroke="#c9bd9f" strokeWidth="1.5" />
      {/* ruas */}
      <polygon points={rect(0, 300, 1200, 70)} fill="#555a66" />
      <polygon points={rect(560, 0, 80, 720)} fill="#555a66" />
      <polygon points={rect(0, 574, 1200, 24)} fill="#555a66" />
      <polyline points={poly([[0, 335], [552, 335]])} fill="none" stroke="#f5d547" strokeWidth="2.6" strokeDasharray="14 10" />
      <polyline points={poly([[648, 335], [1200, 335]])} fill="none" stroke="#f5d547" strokeWidth="2.6" strokeDasharray="14 10" />
      <polyline points={poly([[600, 0], [600, 292]])} fill="none" stroke="#f5d547" strokeWidth="2.6" strokeDasharray="14 10" />
      <polyline points={poly([[600, 378], [600, 566]])} fill="none" stroke="#f5d547" strokeWidth="2.6" strokeDasharray="14 10" />
      <polyline points={poly([[600, 606], [600, 720]])} fill="none" stroke="#f5d547" strokeWidth="2.6" strokeDasharray="14 10" />
      <polyline points={poly([[0, 586], [552, 586]])} fill="none" stroke="#fff" strokeWidth="2" strokeDasharray="12 10" opacity=".7" />
      <polyline points={poly([[648, 586], [1200, 586]])} fill="none" stroke="#fff" strokeWidth="2" strokeDasharray="12 10" opacity=".7" />
      {/* faixas de pedestre */}
      {Array.from({ length: 6 }, (_, i) => (
        <g key={i} fill="#fff" opacity=".88">
          <polygon points={rect(534, 304 + i * 11, 16, 6)} />
          <polygon points={rect(650, 304 + i * 11, 16, 6)} />
          <polygon points={rect(564 + i * 13, 284, 7, 13)} />
          <polygon points={rect(564 + i * 13, 374, 7, 13)} />
          <polygon points={rect(564 + i * 13, 552, 7, 13)} />
          <polygon points={rect(564 + i * 13, 609, 7, 13)} />
        </g>
      ))}
      {/* terrenos (gramado das casas) */}
      {PLOTS.map((p, i) => (
        <g key={i}>
          <polygon points={rect(p.x, p.y, p.w, p.h)} fill="#78c765" stroke="#4c9a46" strokeWidth="2" />
          <polygon points={rect(p.x + 4, p.y + 4, p.w - 8, 10)} fill="rgba(255,255,255,.07)" />
          {i < 8 && <polygon points={rect(p.x + p.w / 2 - 6, p.y + p.h - 26, 12, 26)} fill="#ddd2b6" />}
        </g>
      ))}
    </g>
  );
}
function Defs({ night }) {
  const win = (id, bg, fg) => (
    <pattern id={id} width="10" height="12" patternUnits="userSpaceOnUse">
      <rect width="10" height="12" fill={bg} />
      <rect x="1.8" y="1.8" width="6.4" height="8.4" fill={fg} />
    </pattern>
  );
  return (
    <defs>
      <linearGradient id="cy-sea" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#3cb8e6" /><stop offset="1" stopColor="#1a78b8" /></linearGradient>
      <linearGradient id="cy-silo" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#dde4ee" /><stop offset=".5" stopColor="#f7f9fc" /><stop offset="1" stopColor="#9aa6b8" /></linearGradient>
      <radialGradient id="cy-glow"><stop offset="0" stopColor="#fff3b0" stopOpacity=".6" /><stop offset="1" stopColor="#fff3b0" stopOpacity="0" /></radialGradient>
      {win("cy-win", "#2b6aa0", "#aee0ff")}
      {win("cy-win-l", "#2b6aa0", "#ffd86b")}
      {win("cy-win-o", "#d8c8b0", "#7fb8e8")}
      {win("cy-win-ol", "#d8c8b0", "#ffd86b")}
    </defs>
  );
}

const Scene = memo(function Scene({ owners, night, onBuilding, onPlot }) {
  return (
    <NightCtx.Provider value={night}>
      <g>
        <Defs night={night} />
        <Sea />
        <Ground />
        <Mine />
        <Park />
        <Traffic />
        {SORTED.map((d) => (
          <g key={d.key} id={"it-" + d.key}>
            <Item d={d} owners={owners} night={night} onBuilding={onBuilding} onPlot={onPlot} />
          </g>
        ))}
        <path d={`M${iso(552, 14, 0).map(f1).join(" ")} L${iso(552, 14, 78).map(f1).join(" ")} M${iso(648, 14, 0).map(f1).join(" ")} L${iso(648, 14, 78).map(f1).join(" ")}`} stroke="#7c3aed" strokeWidth="7" pointerEvents="none" />
        <g pointerEvents="none">
          <polygon points={P([548, 14, 78], [652, 14, 78], [652, 14, 98], [548, 14, 98])} fill="#1b1030" stroke="#ffd34d" strokeWidth="1.6" />
          <text transform={`translate(${iso(556, 14, 82).map(f1).join(" ")}) matrix(${S} ${-S / 2} 0 ${Z} 0 0)`} fontSize="0" />
          <text x={iso(600, 14, 90)[0]} y={iso(600, 14, 90)[1] + 3} fontSize="9.5" fontWeight="900" textAnchor="middle" fill="#ffd34d">CASSINORA LAND</text>
        </g>
      </g>
    </NightCtx.Provider>
  );
});
export default Scene;
export { MAP_H, MAP_W };
