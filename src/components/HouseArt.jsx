import { WALL_H, planFor } from "../lib/houseplan";
import { shade } from "../lib/doll";

// Casa em corte isométrico (como uma casa de bonecas): paredes dos fundos altas, divisórias baixas, móveis em caixas com luz da esquerda.
const r1 = (n) => Math.round(n * 10) / 10;
export const px = (x, y, z = 0) => [(x - y) * 32, (x + y) * 16 - z];
const pts = (...a) => a.map(([x, y, z = 0]) => px(x, y, z).map(r1).join(",")).join(" ");
const EDGE = "rgba(20,12,8,.35)";

export function Bx({ x, y, w, d, h, z = 0, c, top, left, right, op }) {
  return (
    <g opacity={op}>
      <polygon points={pts([x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h])} fill={right || shade(c, -0.24)} stroke={EDGE} strokeLinejoin="round" />
      <polygon points={pts([x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h])} fill={left || c} stroke={EDGE} strokeLinejoin="round" />
      <polygon points={pts([x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h])} fill={top || shade(c, 0.2)} stroke={EDGE} strokeLinejoin="round" />
    </g>
  );
}
const Flat = ({ x, y, w, d, z = 0.4, c, op = 1, stroke }) => <polygon points={pts([x, y, z], [x + w, y, z], [x + w, y + d, z], [x, y + d, z])} fill={c} opacity={op} stroke={stroke} />;
// retângulo sobre a parede do fundo (plano y = 0): u em tiles ao longo de x, v em px de altura
const BackRect = ({ y = 0.02, u1, u2, v1, v2, c, stroke, op }) => <polygon points={pts([u1, y, v1], [u2, y, v1], [u2, y, v2], [u1, y, v2])} fill={c} stroke={stroke} opacity={op} />;
// retângulo sobre a parede da esquerda (plano x = 0)
const LeftRect = ({ x = 0.02, u1, u2, v1, v2, c, stroke, op }) => <polygon points={pts([x, u1, v1], [x, u2, v1], [x, u2, v2], [x, u1, v2])} fill={c} stroke={stroke} opacity={op} />;
// faces de objetos: +gy (left) e +gx (right)
const FaceY = ({ x1, x2, y, v1, v2, c, stroke }) => <polygon points={pts([x1, y, v1], [x2, y, v1], [x2, y, v2], [x1, y, v2])} fill={c} stroke={stroke} />;
const FaceX = ({ x, y1, y2, v1, v2, c, stroke }) => <polygon points={pts([x, y1, v1], [x, y2, v1], [x, y2, v2], [x, y1, v2])} fill={c} stroke={stroke} />;

/* ---------- casca: fundo, piso, paredes ---------- */
function floorOf(r) {
  const base = { wood: "#b9824f", dark: "#8c6a4a", tile: "#e8dfc8", bath: "#9fd6e0" }[r.floor];
  const out = [<polygon key="f" points={pts([r.x, r.y], [r.x + r.w, r.y], [r.x + r.w, r.y + r.d], [r.x, r.y + r.d])} fill={base} />];
  if (r.floor === "wood" || r.floor === "dark") {
    for (let i = 1; i < r.d * 2; i++) out.push(<path key={"l" + i} d={`M${px(r.x, r.y + i / 2).map(r1)} L${px(r.x + r.w, r.y + i / 2).map(r1)}`} stroke="rgba(0,0,0,.14)" />);
    for (let i = 0; i < r.w; i++) for (let j = 0; j < r.d * 2; j++) if ((i * 3 + j * 5) % 7 === 0) out.push(<path key={"p" + i + "_" + j} d={`M${px(r.x + i + 0.5, r.y + j / 2).map(r1)} L${px(r.x + i + 0.5, r.y + j / 2 + 0.5).map(r1)}`} stroke="rgba(0,0,0,.12)" />);
  } else {
    const alt = r.floor === "tile" ? "#c9bc9a" : "#7cc0cf";
    for (let i = 0; i < r.w; i++) for (let j = 0; j < r.d; j++) if ((i + j) % 2) out.push(<polygon key={i + "_" + j} points={pts([r.x + i, r.y + j], [r.x + i + 1, r.y + j], [r.x + i + 1, r.y + j + 1], [r.x + i, r.y + j + 1])} fill={alt} opacity=".7" />);
  }
  return out;
}

function Window({ u, night }) {
  const sky = night ? "#0c1238" : "#9bd4ff";
  return (
    <g>
      <BackRect u1={u} u2={u + 3} v1={48} v2={98} c="#f3e9d8" stroke={EDGE} />
      <BackRect u1={u + 0.12} u2={u + 2.88} v1={54} v2={92} c={sky} />
      {night && [0.4, 1.3, 2.1].map((o, i) => <circle key={i} cx={px(u + o, 0, 80 - i * 6)[0]} cy={px(u + o, 0, 80 - i * 6)[1]} r="1.3" fill="#fff" />)}
      {night ? <circle cx={px(u + 2.3, 0, 82)[0]} cy={px(u + 2.3, 0, 82)[1]} r="7" fill="#f8efb0" /> : <circle cx={px(u + 2.2, 0, 80)[0]} cy={px(u + 2.2, 0, 80)[1]} r="8" fill="#ffe36b" />}
      <path d={`M${px(u + 1.5, 0, 54).map(r1)} L${px(u + 1.5, 0, 92).map(r1)}`} stroke="#f3e9d8" strokeWidth="3" />
      <path d={`M${px(u + 0.12, 0, 73).map(r1)} L${px(u + 2.88, 0, 73).map(r1)}`} stroke="#f3e9d8" strokeWidth="3" />
      <path d={`M${px(u - 0.2, 0, 98).map(r1)} L${px(u - 0.2, 0, 28).map(r1)} L${px(u + 0.5, 0, 28).map(r1)} L${px(u + 0.1, 0, 98).map(r1)}Z`} fill="#4a4a6e" stroke={EDGE} />
      <path d={`M${px(u + 3.2, 0, 98).map(r1)} L${px(u + 3.2, 0, 28).map(r1)} L${px(u + 2.5, 0, 28).map(r1)} L${px(u + 2.9, 0, 98).map(r1)}Z`} fill="#4a4a6e" stroke={EDGE} />
    </g>
  );
}

export function Shell({ plan, night }) {
  const { W, D, rooms } = plan;
  const H = WALL_H;
  const top = rooms.filter((r) => r.y === 0);
  const left = rooms.filter((r) => r.x === 0);
  const wallG = [];
  top.forEach((r, i) => {
    wallG.push(<polygon key={"b" + i} points={pts([r.x, 0, 0], [r.x + r.w, 0, 0], [r.x + r.w, 0, H], [r.x, 0, H])} fill={r.wall} stroke={EDGE} />);
    wallG.push(<polygon key={"bs" + i} points={pts([r.x, 0, 0], [r.x + r.w, 0, 0], [r.x + r.w, 0, 8], [r.x, 0, 8])} fill={shade(r.wall, -0.3)} />);
    wallG.push(<polygon key={"bt" + i} points={pts([r.x, 0, H - 14], [r.x + r.w, 0, H - 14], [r.x + r.w, 0, H], [r.x, 0, H])} fill={shade(r.wall, 0.12)} />);
  });
  left.forEach((r, i) => {
    wallG.push(<polygon key={"l" + i} points={pts([0, r.y, 0], [0, r.y + r.d, 0], [0, r.y + r.d, H], [0, r.y, H])} fill={shade(r.wall, -0.12)} stroke={EDGE} />);
    wallG.push(<polygon key={"ls" + i} points={pts([0, r.y, 0], [0, r.y + r.d, 0], [0, r.y + r.d, 8], [0, r.y, 8])} fill={shade(r.wall, -0.4)} />);
    wallG.push(<polygon key={"lt" + i} points={pts([0, r.y, H - 14], [0, r.y + r.d, H - 14], [0, r.y + r.d, H], [0, r.y, H])} fill={shade(r.wall, 0)} />);
  });
  const slab = 14;
  const mid = rooms[0];
  return (
    <g>
      {/* borda da laje */}
      <polygon points={pts([0, D, 0], [W, D, 0], [W, D, -slab], [0, D, -slab])} fill="#7a5230" stroke={EDGE} />
      <polygon points={pts([W, 0, 0], [W, D, 0], [W, D, -slab], [W, 0, -slab])} fill="#5c3b20" stroke={EDGE} />
      {rooms.map((r) => <g key={r.kind + r.x + r.y}>{floorOf(r)}</g>)}
      {wallG}
      {/* topo e pontas das paredes */}
      <polygon points={pts([0, -0.3, H], [W, -0.3, H], [W, 0, H], [0, 0, H])} fill="#8a5a33" stroke={EDGE} />
      <polygon points={pts([-0.3, 0, H], [0, 0, H], [0, D, H], [-0.3, D, H])} fill="#a06a3c" stroke={EDGE} />
      <polygon points={pts([W, -0.3, 0], [W, 0, 0], [W, 0, H], [W, -0.3, H])} fill="#5c3b20" stroke={EDGE} />
      <polygon points={pts([-0.3, D, 0], [0, D, 0], [0, D, H], [-0.3, D, H])} fill="#7a5230" stroke={EDGE} />
      {/* janelas e porta de entrada */}
      <Window u={mid.x + 0.9} night={night} />
      {top.filter((r) => r.kind !== "sala" && r.kind !== "kitnet").map((r) => (r.kind === "banheiro" ? null : <Window key={r.kind} u={r.x + 1.5} night={night} />))}
      <LeftRect u1={mid.d - 1.7} u2={mid.d - 0.5} v1={0} v2={84} c="#6b4423" stroke="#3d2814" />
      <LeftRect u1={mid.d - 1.5} u2={mid.d - 0.7} v1={58} v2={78} c="#9fd6e8" />
      <LeftRect x={0.03} u1={mid.d - 0.85} u2={mid.d - 0.78} v1={36} v2={40} c="#ffd34d" />
      {/* divisórias baixas entre cômodos */}
      {rooms.filter((r) => r.x > 0 || r.y > 0).map((r, i) => (
        <g key={"dv" + i}>
          {r.x > 0 && (
            <g>
              <Bx x={r.x - 0.1} y={r.y} w={0.2} d={Math.max(0, (r.d - 2.2) / 2)} h={22} c="#c9a97a" />
              <Bx x={r.x - 0.1} y={r.y + r.d - Math.max(0, (r.d - 2.2) / 2)} w={0.2} d={Math.max(0, (r.d - 2.2) / 2)} h={22} c="#c9a97a" />
            </g>
          )}
          {r.y > 0 && (
            <g>
              <Bx x={r.x} y={r.y - 0.1} w={Math.max(0, (r.w - 2.2) / 2)} d={0.2} h={22} c="#c9a97a" />
              <Bx x={r.x + r.w - Math.max(0, (r.w - 2.2) / 2)} y={r.y - 0.1} w={Math.max(0, (r.w - 2.2) / 2)} d={0.2} h={22} c="#c9a97a" />
            </g>
          )}
        </g>
      ))}
    </g>
  );
}

/* ---------- móveis ---------- */
function Chair({ x, y, c = "#8a5a2b" }) {
  return (
    <g>
      <Bx x={x} y={y} w={0.7} d={0.7} h={14} c={c} />
      <Bx x={x} y={y + 0.58} w={0.7} d={0.12} h={16} z={14} c={c} />
    </g>
  );
}
function Plant({ x, y, s = 1 }) {
  const [cx, cy] = px(x + 0.35, y + 0.35, 14);
  return (
    <g>
      <Bx x={x} y={y} w={0.7} d={0.7} h={14} c="#b45309" />
      <circle cx={cx} cy={cy - 12 * s} r={12 * s} fill="#2e8b4a" /><circle cx={cx - 9 * s} cy={cy - 20 * s} r={8 * s} fill="#3aa35a" /><circle cx={cx + 8 * s} cy={cy - 24 * s} r={9 * s} fill="#43b564" /><circle cx={cx - 2 * s} cy={cy - 32 * s} r={6 * s} fill="#58c878" />
    </g>
  );
}
const Lamp = ({ x, y, night }) => {
  const [cx, cy] = px(x, y, 70);
  return (
    <g>
      <Bx x={x - 0.2} y={y - 0.2} w={0.4} d={0.4} h={5} c="#3d424e" />
      <path d={`M${px(x, y, 5).map(r1)} L${cx} ${cy}`} stroke="#3d424e" strokeWidth="2.4" />
      <path d={`M${cx - 14} ${cy + 2} L${cx - 8} ${cy - 16} H${cx + 8} L${cx + 14} ${cy + 2}Z`} fill="#f7c867" stroke={EDGE} />
      <circle cx={cx} cy={cy + 6} r={night ? 70 : 30} fill="url(#hs-glow)" opacity={night ? 0.5 : 0.2} />
    </g>
  );
};
const Frame = ({ u, v, w = 1.2, h = 26, kind = "land", c = "#5b3a1e", plane = "back" }) => {
  const R = plane === "back" ? BackRect : LeftRect;
  return (
    <g>
      <R u1={u} u2={u + w} v1={v} v2={v + h} c={c} stroke={EDGE} />
      <R u1={u + 0.08} u2={u + w - 0.08} v1={v + 4} v2={v + h - 4} c={kind === "land" ? "#7cc4ff" : "#2a2f52"} />
      {kind === "land" && <R u1={u + 0.08} u2={u + w - 0.08} v1={v + 4} v2={v + 11} c="#3f9e5a" />}
      {kind === "game" && <R u1={u + w * 0.3} u2={u + w * 0.7} v1={v + 9} v2={v + h - 9} c="#a855f7" />}
    </g>
  );
};

// cada móvel devolve { node, depth, use?: {kind, stand, at:[x,y,z]} }
function sala(r, has, night) {
  const o = [];
  const { x, y, w, d } = r;
  const add = (key, depth, node, use) => o.push({ key, depth, node, use });
  add("sala-lamp", x + w - 0.6 + y + d - 0.6, <Lamp x={x + w - 0.8} y={y + d - 0.8} night={night} />);
  if (has("picture")) add("sala-pic", 0, <Frame u={x + 3.9} v={66} w={2.2} h={34} />);
  // TV: se a pessoa comprou, aparece; senão só o móvel
  add("sala-tvstand", x + 6.4 + y + 1.2, <Bx x={x + 3.4} y={y + 0.3} w={3.2} d={0.9} h={13} c="#7a4a2b" />);
  if (has("tv")) {
    add("sala-tv", x + 6.2 + y + 1.0, (
      <g>
        <Bx x={x + 3.8} y={y + 0.55} w={2.4} d={0.14} h={34} z={13} c="#15171e" top="#2b2f3a" />
        <FaceY x1={x + 3.9} x2={x + 6.1} y={y + 0.69} v1={16} v2={44} c="#3b82f6" />
        <FaceY x1={x + 3.9} x2={x + 5.2} y={y + 0.69} v1={32} v2={44} c="#93c5fd" />
        {night && (() => { const [cx, cy] = px(x + 5, y + 1.3, 28); return <circle cx={cx} cy={cy + 14} r="56" fill="url(#hs-glow-b)" opacity=".5" />; })()}
      </g>
    ), { kind: "tv", stand: [x + 5, y + 2.6], at: [x + 5, y + 0.7, 52] });
  }
  if (has("aquarium"))
    add("sala-aq", x + 3.3 + y + 1.15, (
      <g>
        <Bx x={x + 0.9} y={y + 0.25} w={2.4} d={0.9} h={26} c="#5b4636" />
        <Bx x={x + 0.95} y={y + 0.3} w={2.3} d={0.8} h={26} z={26} c="#7fd3ef" top="#c9f0fb" op=".85" />
        <text x={px(x + 1.6, y + 1.2, 38)[0]} y={px(x + 1.6, y + 1.2, 38)[1]} fontSize="14">🐠</text>
        <text x={px(x + 2.4, y + 1.2, 46)[0]} y={px(x + 2.4, y + 1.2, 46)[1]} fontSize="11">🐟</text>
      </g>
    ), { kind: "aquarium", stand: [x + 2.1, y + 2.2], at: [x + 2.1, y + 1.2, 62] });
  if (has("shelf"))
    add("sala-shelf", x + 1.0 + y + 3.0, (
      <g>
        <Bx x={x + 0.1} y={y + 0.9} w={0.9} d={2.2} h={82} c="#8a5a2b" />
        {[0, 1, 2, 3].map((k) => <FaceX key={k} x={x + 1.0} y1={y + 1.0} y2={y + 3.0} v1={8 + k * 19} v2={22 + k * 19} c="#5b3a1e" stroke={EDGE} />)}
        {[0, 1, 2, 3].flatMap((k) => Array.from({ length: 6 }, (_, j) => <FaceX key={k + "_" + j} x={x + 1.0} y1={y + 1.08 + j * 0.32} y2={y + 1.3 + j * 0.32} v1={9 + k * 19} v2={17 + k * 19 + ((j * 5) % 4)} c={["#ef4444", "#3b82f6", "#facc15", "#22c55e", "#a855f7"][(j + k) % 5]} />))}
      </g>
    ), { kind: "shelf", stand: [x + 2.2, y + 2.0], at: [x + 0.6, y + 2, 86] });
  if (has("fireplace"))
    add("sala-fire", x + 1.2 + y + 4.9, (
      <g>
        <Bx x={x + 0.1} y={y + 3.3} w={1.1} d={1.9} h={70} c="#6b7280" />
        <FaceX x={x + 1.2} y1={y + 3.7} y2={y + 4.8} v1={2} v2={38} c="#15151a" />
        <path d={`M${px(x + 1.22, y + 4.25, 3).map(r1)} q-6 -16 0 -26 q4 10 8 0 q4 14 -2 26Z`} fill="#f97316" className="cy-blink" />
        <path d={`M${px(x + 1.22, y + 4.25, 3).map(r1)} q-3 -9 0 -15 q2 6 5 0 q1 8 -1 15Z`} fill="#fde047" />
      </g>
    ), { kind: "fireplace", stand: [x + 2.5, y + 4.2], at: [x + 0.7, y + 4.2, 76] });
  if (has("rug")) add("sala-rug", -1, <Flat x={x + 2.2} y={y + 2.4} w={4.8} d={2.8} c="#8b3a3a" stroke="#5c2020" />);
  if (has("sofa"))
    add("sala-sofa", x + 6.4 + y + 5.6, (
      <g>
        <Bx x={x + 2.8} y={y + 4.2} w={3.6} d={1.4} h={13} c="#4f78c4" />
        <Bx x={x + 2.8} y={y + 5.2} w={3.6} d={0.4} h={32} c="#3f66ae" />
        <Bx x={x + 2.6} y={y + 4.2} w={0.4} d={1.4} h={24} c="#3a5ea4" />
        <Bx x={x + 6.2} y={y + 4.2} w={0.4} d={1.4} h={24} c="#3a5ea4" />
      </g>
    ), { kind: "sofa", stand: [x + 4.6, y + 4.7], at: [x + 4.6, y + 5.6, 40] });
  if (has("sofa")) add("sala-ctable", x + 5.2 + y + 3.4, (
    <g>
      <Bx x={x + 3.6} y={y + 2.7} w={1.6} d={0.7} h={9} c="#8a5a2b" />
      <text x={px(x + 4.2, y + 3.1, 12)[0]} y={px(x + 4.2, y + 3.1, 12)[1]} fontSize="9">🍔🥤</text>
    </g>
  ));
  if (has("piano"))
    add("sala-piano", x + 7.8 + y + 4.6, (
      <g>
        <Bx x={x + 6.5} y={y + 2.0} w={1.4} d={2.6} h={36} c="#16161c" />
        <Bx x={x + 6.2} y={y + 2.1} w={0.42} d={2.4} h={4} z={30} c="#f5f5f5" top="#fff" />
        {Array.from({ length: 10 }, (_, k) => <path key={k} d={`M${px(x + 6.2, y + 2.2 + k * 0.24, 34).map(r1)} L${px(x + 6.2, y + 2.2 + k * 0.24, 30).map(r1)}`} stroke="#111" strokeWidth="1" />)}
      </g>
    ), { kind: "piano", stand: [x + 5.7, y + 3.4], at: [x + 7.2, y + 3.3, 42] });
  if (has("plant")) add("sala-plant", x + w - 1.1 + y + 0.4 + 0.7, <Plant x={x + w - 1.1} y={y + 0.4} />, { kind: "plant", stand: [x + w - 1.6, y + 1.8], at: [x + w - 0.8, y + 0.7, 56] });
  return o;
}

function cozinha(r) {
  const o = [];
  const { x, y, w, d } = r;
  const add = (key, depth, node, use) => o.push({ key, depth, node, use });
  // bancada ao fundo
  add("coz-counter", x + w + y + 1.2, (
    <g>
      <Bx x={x + 0.3} y={y + 0.2} w={w - 2.2} d={1.1} h={30} c="#c98b4e" top="#e9e1d0" />
      {[0, 1, 2].map((k) => <FaceY key={k} x1={x + 0.4 + k * 1.3} x2={x + 1.5 + k * 1.3} y={y + 1.3} v1={3} v2={26} c="#b87a40" stroke={EDGE} />)}
      {[0, 1].map((k) => <circle key={k} cx={px(x + 1.4 + k * 0.7, y + 0.6, 30.5)[0]} cy={px(x + 1.4 + k * 0.7, y + 0.6, 30.5)[1]} r="4.4" fill="#2b2b33" stroke="#999" />)}
      <ellipse cx={px(x + w - 3.2, y + 0.75, 30)[0]} cy={px(x + w - 3.2, y + 0.75, 30)[1]} rx="12" ry="5" fill="#9aa5b6" stroke="#6b7280" />
      <Bx x={x + 0.3} y={y + 0.2} w={w - 2.2} d={0.5} h={26} z={62} c="#b87a40" />
    </g>
  ));
  add("coz-fridge", x + w - 0.7 + y + 1.5, (
    <g>
      <Bx x={x + w - 1.7} y={y + 0.2} w={1.4} d={1.3} h={86} c="#e5e7eb" />
      <FaceY x1={x + w - 1.65} x2={x + w - 0.35} y={y + 1.5} v1={50} v2={52} c="#9ca3af" />
      <FaceY x1={x + w - 0.75} x2={x + w - 0.65} y={y + 1.5} v1={56} v2={78} c="#6b7280" />
      <FaceY x1={x + w - 0.75} x2={x + w - 0.65} y={y + 1.5} v1={22} v2={40} c="#6b7280" />
    </g>
  ), { kind: "fridge", stand: [x + w - 1.2, y + 2.4], at: [x + w - 1, y + 1.5, 92] });
  // mesa de jantar
  add("coz-table", x + 3.5 + y + 4.2, (
    <g>
      <Bx x={x + 1.8} y={y + 3.0} w={2.4} d={1.6} h={26} c="#a8703a" />
      <ellipse cx={px(x + 3, y + 3.8, 27)[0]} cy={px(x + 3, y + 3.8, 27)[1]} rx="9" ry="4" fill="#fff" />
    </g>
  ), { kind: "table", stand: [x + 3, y + 5.3], at: [x + 3, y + 3.8, 36] });
  add("coz-ch1", x + 1.6 + y + 3.6, <Chair x={x + 1.1} y={y + 3.3} />);
  add("coz-ch2", x + 5.0 + y + 3.6, <Chair x={x + 4.3} y={y + 3.3} />);
  add("coz-ch3", x + 2.8 + y + 5.2, <Chair x={x + 2.3} y={y + 4.8} />);
  o.push({ key: "coz-rug", depth: -1, node: <Flat x={x + 1.2} y={y + 2.6} w={3.6} d={2.8} c="#a0553a" op=".6" /> });
  return o;
}

function quarto(r) {
  const o = [];
  const { x, y, w } = r;
  const add = (key, depth, node, use) => o.push({ key, depth, node, use });
  add("q-bed", x + 3.8 + y + 4.2, (
    <g>
      <Bx x={x + 0.2} y={y + 1.7} w={3.6} d={2.5} h={11} c="#7a4a2b" />
      <Bx x={x + 0.4} y={y + 1.8} w={3.3} d={2.3} h={9} z={11} c="#e2ebf7" top="#f7fbff" />
      <Bx x={x + 1.7} y={y + 1.8} w={2.0} d={2.3} h={4} z={20} c="#5c6fa8" top="#7587c0" />
      <Bx x={x + 0.5} y={y + 1.95} w={0.7} d={0.8} h={5} z={20} c="#fff" /><Bx x={x + 0.5} y={y + 3.0} w={0.7} d={0.8} h={5} z={20} c="#fff" />
      <Bx x={x + 0.1} y={y + 1.7} w={0.2} d={2.5} h={38} c="#6a3f22" />
    </g>
  ), { kind: "bed", stand: [x + 4.6, y + 3.0], at: [x + 2, y + 3, 44] });
  add("q-ward", x + 1.0 + y + 1.5, (
    <g>
      <Bx x={x + 0.1} y={y + 0.1} w={0.9} d={1.5} h={92} c="#7a4a2b" />
      <FaceX x={x + 1.0} y1={y + 0.15} y2={y + 0.8} v1={6} v2={86} c="#8a5a35" stroke={EDGE} />
      <FaceX x={x + 1.0} y1={y + 0.85} y2={y + 1.5} v1={6} v2={86} c="#8a5a35" stroke={EDGE} />
    </g>
  ));
  const dx = Math.min(5.6, w - 2.8);
  add("q-desk", x + dx + 2 + y + 3.6, (
    <g>
      <Bx x={x + dx} y={y + 2.2} w={2.0} d={1.0} h={24} c="#3b3b46" top="#4a4a58" />
      <Bx x={x + dx + 0.5} y={y + 2.4} w={1.0} d={0.12} h={18} z={24} c="#0f172a" />
      <FaceY x1={x + dx + 0.55} x2={x + dx + 1.45} y={y + 2.52} v1={27} v2={40} c="#38bdf8" />
      <Bx x={x + dx + 0.6} y={y + 3.9} w={0.7} d={0.7} h={13} c="#2a2a33" />
    </g>
  ), { kind: "desk", stand: [x + dx + 1, y + 4.7], at: [x + dx + 1, y + 2.7, 50] });
  o.push({ key: "q-rug" + x, depth: -1, node: <Flat x={x + 4.2} y={y + 1.6} w={2.4} d={3.0} c="#4a6a8a" op=".6" /> });
  add("q-frame", 0, <Frame u={0.8} v={60} w={1.2} h={28} kind="game" plane="left" />);
  return o;
}

function banheiro(r) {
  const o = [];
  const { x, y, w, d } = r;
  const add = (key, depth, node, use) => o.push({ key, depth, node, use });
  add("b-tub", x + w - 0.3 + y + 1.7, (
    <g>
      <Bx x={x + 0.4} y={y + 0.3} w={Math.min(3.4, w - 0.8)} d={1.4} h={24} c="#f2f5f7" top="#cbe9f4" />
      <Flat x={x + 0.6} y={y + 0.5} w={Math.min(3.0, w - 1.2)} d={1.0} z={24.5} c="#6fc7ea" />
    </g>
  ), { kind: "bath", stand: [x + 1.5, y + 2.6], at: [x + 1.5, y + 1, 34] });
  add("b-sink", x + 1.2 + y + 3.4, (
    <g>
      <Bx x={x + 0.5} y={y + 2.9} w={0.8} d={0.7} h={26} c="#f2f5f7" />
      <Bx x={x + 0.4} y={y + 2.8} w={1.0} d={0.9} h={5} z={26} c="#ffffff" />
    </g>
  ));
  add("b-wc", x + w - 0.6 + y + 3.4, (
    <g>
      <Bx x={x + w - 1.6} y={y + 2.6} w={1.0} d={0.5} h={30} c="#f2f5f7" />
      <Bx x={x + w - 1.6} y={y + 3.1} w={1.0} d={0.9} h={16} c="#ffffff" />
    </g>
  ));
  o.push({ key: "b-mat", depth: -1, node: <Flat x={x + 1.0} y={y + 1.9} w={2.0} d={0.8} c="#3b9aa8" op=".8" /> });
  add("b-mirror", 0, <BackRect u1={x + 0.6} u2={x + 1.8} v1={58} v2={96} c="#cfeaf2" stroke="#8a6a3a" />);
  return o;
}

function escritorio(r) {
  const o = [];
  const { x, y, w } = r;
  const add = (key, depth, node, use) => o.push({ key, depth, node, use });
  add("e-desk", x + 4.0 + y + 2.2, (
    <g>
      <Bx x={x + 0.5} y={y + 0.3} w={3.4} d={1.2} h={26} c="#3b3b46" top="#4a4a58" />
      {[0, 1].map((k) => (
        <g key={k}>
          <Bx x={x + 1.0 + k * 1.4} y={y + 0.55} w={1.1} d={0.12} h={20} z={26} c="#0f172a" />
          <FaceY x1={x + 1.05 + k * 1.4} x2={x + 2.05 + k * 1.4} y={y + 0.67} v1={29} v2={44} c={k ? "#a855f7" : "#22d3ee"} />
        </g>
      ))}
      <Chair x={x + 1.9} y={y + 1.9} c="#2a2a33" />
    </g>
  ), { kind: "desk", stand: [x + 2.2, y + 3.2], at: [x + 2.2, y + 1, 52] });
  add("e-cab", x + w + y + 3.2, (
    <g>
      <Bx x={x + w - 1.3} y={y + 1.8} w={1.0} d={2.8} h={30} c="#8a5a2b" />
      {[0, 1, 2].map((k) => <FaceX key={k} x={x + w - 0.3} y1={y + 1.9 + k * 0.9} y2={y + 2.7 + k * 0.9} v1={4} v2={26} c="#7a4a1b" stroke={EDGE} />)}
    </g>
  ));
  add("e-bean", x + 3.6 + y + 4.2, <Bx x={x + 2.6} y={y + 3.6} w={1.3} d={1.3} h={14} c="#e0527a" />);
  add("e-poster", 0, <Frame u={x + 4.2} v={62} w={1.3} h={32} kind="game" />);
  o.push({ key: "e-rug", depth: -1, node: <Flat x={x + 1.2} y={y + 2.6} w={3.8} d={2.6} c="#4a6a58" op=".55" /> });
  return o;
}

/* ---------- monta tudo ---------- */
export function buildHouse(tier, has, night) {
  const plan = planFor(tier);
  let items = [];
  for (const r of plan.rooms) {
    if (r.kind === "kitnet") items.push(...kitnetRoom(r, has, night));
    else if (r.kind === "sala") {
      items.push(...sala(r, has, night));
      if (tier >= 4) items.push({ key: "sala-lustre", depth: 999, node: <Chandelier x={r.x + 5} y={r.y + 3.5} /> }, { key: "sala-pool", depth: r.x + 9.9 + r.y + 6.2, node: <PoolTable x={r.x + 8.0} y={r.y + 3.2} /> });
    } else if (r.kind === "cozinha") items.push(...cozinha(r));
    else if (r.kind === "quarto") items.push(...quarto(r));
    else if (r.kind === "banheiro") items.push(...banheiro(r));
    else if (r.kind === "escritorio") items.push(...escritorio(r));
  }
  // plantas extras nos cantos para dar vida
  if (tier >= 2) items.push({ key: "x-plant1", depth: plan.W + plan.D - 1.5, node: <Plant x={plan.W - 1.3} y={plan.D - 1.3} s={1.1} /> });
  return { plan, items };
}
function kitnetRoom(r, has, night) {
  const o = [];
  const add = (key, depth, node, use) => o.push({ key, depth, node, use });
  add("k-lamp", 10.2 + 5.2, <Lamp x={0.9} y={5.2} night={night} />);
  // cama (cabeceira na parede do fundo)
  add("k-bed", 3.0 + 3.6, (
    <g>
      <Bx x={0.4} y={0.3} w={2.6} d={3.4} h={11} c="#7a4a2b" />
      <Bx x={0.5} y={0.4} w={2.4} d={3.2} h={9} z={11} c="#e2ebf7" top="#f7fbff" />
      <Bx x={0.5} y={1.6} w={2.4} d={2.0} h={4} z={20} c="#5c6fa8" top="#7587c0" />
      <Bx x={0.7} y={0.5} w={0.9} d={0.6} h={5} z={20} c="#fff" /><Bx x={1.8} y={0.5} w={0.9} d={0.6} h={5} z={20} c="#fff" />
      <Bx x={0.4} y={0.2} w={2.6} d={0.2} h={36} c="#6a3f22" />
    </g>
  ), { kind: "bed", stand: [3.7, 2.4], at: [1.7, 2, 42] });
  // TV (se comprou) em cima de um móvel baixo
  add("k-stand", 5.6 + 1.2, <Bx x={3.5} y={0.3} w={2.1} d={0.9} h={13} c="#7a4a2b" />);
  if (has("tv"))
    add("k-tv", 5.5 + 1.0, (
      <g>
        <Bx x={3.7} y={0.55} w={1.7} d={0.14} h={30} z={13} c="#15171e" top="#2b2f3a" />
        <FaceY x1={3.78} x2={5.32} y={0.69} v1={16} v2={40} c="#3b82f6" />
        <FaceY x1={3.78} x2={4.6} y={0.69} v1={30} v2={40} c="#93c5fd" />
      </g>
    ), { kind: "tv", stand: [4.5, 2.5], at: [4.5, 0.7, 50] });
  if (has("picture")) add("k-pic", 0, <Frame u={3.7} v={62} w={1.7} h={32} />);
  // cozinha compacta
  add("k-counter", 8.1 + 1.2, (
    <g>
      <Bx x={5.9} y={0.2} w={2.2} d={1.1} h={30} c="#c98b4e" top="#e9e1d0" />
      {[0, 1].map((k) => <FaceY key={k} x1={6.0 + k * 1.05} x2={7.0 + k * 1.05} y={1.3} v1={3} v2={26} c="#b87a40" stroke={EDGE} />)}
      {[0, 1].map((k) => <circle key={k} cx={px(6.5 + k * 0.7, 0.7, 30.5)[0]} cy={px(6.5 + k * 0.7, 0.7, 30.5)[1]} r="4.4" fill="#2b2b33" stroke="#999" />)}
      <ellipse cx={px(7.6, 0.75, 30)[0]} cy={px(7.6, 0.75, 30)[1]} rx="11" ry="4.6" fill="#9aa5b6" stroke="#6b7280" />
    </g>
  ));
  add("k-fridge", 9.6 + 1.5, (
    <g>
      <Bx x={8.3} y={0.2} w={1.4} d={1.3} h={86} c="#e5e7eb" />
      <FaceY x1={8.35} x2={9.65} y={1.5} v1={50} v2={52} c="#9ca3af" />
      <FaceY x1={9.25} x2={9.35} y={1.5} v1={56} v2={78} c="#6b7280" />
    </g>
  ), { kind: "fridge", stand: [9, 2.4], at: [9, 1.5, 92] });
  add("k-table", 9.2 + 4.4, (
    <g>
      <Bx x={7.4} y={3.0} w={1.8} d={1.4} h={26} c="#a8703a" />
      <ellipse cx={px(8.3, 3.7, 27)[0]} cy={px(8.3, 3.7, 27)[1]} rx="8" ry="3.4" fill="#fff" />
    </g>
  ), { kind: "table", stand: [8.3, 5.2], at: [8.3, 3.7, 36] });
  add("k-ch1", 7.1 + 3.6, <Chair x={6.7} y={3.3} />);
  add("k-ch2", 9.9 + 3.6, <Chair x={9.3} y={3.3} />);
  if (has("rug")) add("k-rug", -1, <Flat x={3.0} y={2.5} w={4.0} d={2.8} c="#8b3a3a" stroke="#5c2020" />);
  if (has("sofa"))
    add("k-sofa", 6.6 + 5.6, (
      <g>
        <Bx x={3.2} y={4.2} w={3.4} d={1.4} h={13} c="#4f78c4" />
        <Bx x={3.2} y={5.2} w={3.4} d={0.4} h={32} c="#3f66ae" />
        <Bx x={3.0} y={4.2} w={0.4} d={1.4} h={24} c="#3a5ea4" /><Bx x={6.4} y={4.2} w={0.4} d={1.4} h={24} c="#3a5ea4" />
      </g>
    ), { kind: "sofa", stand: [4.9, 4.7], at: [4.9, 5.6, 40] });
  if (has("plant")) add("k-plant", 9.0 + 5.0 + 0.7, <Plant x={9.0} y={5.0} />, { kind: "plant", stand: [8.2, 5.4], at: [9.3, 5.3, 56] });
  return o;
}
function Chandelier({ x, y }) {
  const [cx, cy] = px(x, y, WALL_H - 10);
  return (
    <g>
      <path d={`M${cx} ${cy - 8} V${cy + 10}`} stroke="#444" strokeWidth="1.6" />
      <ellipse cx={cx} cy={cy + 12} rx="22" ry="7" fill="#e8c76a" stroke="#8a6a00" />
      {[-16, -6, 6, 16].map((o) => <circle key={o} cx={cx + o} cy={cy + 6} r="2.6" fill="#fff3b0" className="cy-blink" />)}
    </g>
  );
}
function PoolTable({ x, y }) {
  return (
    <g>
      <Bx x={x} y={y} w={1.9} d={3.0} h={22} c="#5b3a1e" top="#1f7a4a" />
      <Flat x={x + 0.15} y={y + 0.15} w={1.6} d={2.7} z={22.4} c="#2a9a5e" />
      {[0.5, 0.9, 1.3].map((o, k) => <circle key={k} cx={px(x + o, y + 1.4 + k * 0.2, 23)[0]} cy={px(x + o, y + 1.4 + k * 0.2, 23)[1]} r="2.2" fill={["#ef4444", "#facc15", "#fff"][k]} />)}
    </g>
  );
}

export function HouseDefs() {
  return (
    <defs>
      <radialGradient id="hs-glow"><stop offset="0" stopColor="#ffd98a" stopOpacity=".9" /><stop offset="1" stopColor="#ffd98a" stopOpacity="0" /></radialGradient>
      <radialGradient id="hs-glow-b"><stop offset="0" stopColor="#7fb2ff" stopOpacity=".9" /><stop offset="1" stopColor="#7fb2ff" stopOpacity="0" /></radialGradient>
      <linearGradient id="hs-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0b1030" /><stop offset="1" stopColor="#1f2552" /></linearGradient>
    </defs>
  );
}
