// A cidade 2D (vista de cima): mapa grande de 2460 x 1370 (unidades do SVG), desenhado a partir do croqui de referência (1024 x 572).
// Dados compartilhados entre o desenho (CityMap.jsx) e o caminhar (grade + A*): prédios com porta e ação, terrenos das casas, ruas,
// lagos e as casinhas de enfeite. Quem compra casa ganha um terreno (meta/city) e a casa aparece no mapa.
import { doc, runTransaction } from "firebase/firestore";
import { db } from "./firebase";

export const K = 2.4; // referência -> mundo
export const MAP_W = Math.round(1024 * K);
export const MAP_H = Math.round(572 * K);
const k = (n) => n * K;

function rng(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- ilha, ruas, lagos ---------- */
export const ISLAND = { x: k(46), y: k(22), w: k(942), h: k(526), r: k(70) };
export function inIsland(x, y) {
  const { x: ix, y: iy, w, h, r } = ISLAND;
  if (x < ix || y < iy || x > ix + w || y > iy + h) return false;
  const cx = x < ix + r ? ix + r : x > ix + w - r ? ix + w - r : x;
  const cy = y < iy + r ? iy + r : y > iy + h - r ? iy + h - r : y;
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
}
// [x, y, w, h, vertical?]  (em coordenadas de referência; viram mundo em ROADS)
const ROAD_REF = [
  [55, 197, 935, 16, 0], [270, 263, 475, 14, 0], [262, 378, 483, 14, 0], [240, 458, 505, 16, 0], [345, 136, 380, 10, 0],
  [58, 295, 212, 10, 0], [58, 365, 212, 10, 0], [58, 435, 212, 10, 0], [745, 325, 245, 10, 0], [745, 395, 245, 10, 0], [745, 280, 245, 8, 0],
  [501, 18, 22, 535, 1], [339, 25, 12, 180, 1], [277, 205, 12, 262, 1], [719, 25, 12, 442, 1], [135, 205, 10, 265, 1], [855, 205, 10, 265, 1], [190, 205, 8, 265, 1], [930, 205, 8, 265, 1],
];
export const ROADS = ROAD_REF.map(([x, y, w, h, v]) => ({ x: k(x), y: k(y), w: k(w), h: k(h), v: !!v }));
export const LAKES = [
  { x: k(600), y: k(160), rx: k(46), ry: k(20) },
  { x: k(905), y: k(222), rx: k(62), ry: k(24) },
  { x: k(795), y: k(128), rx: k(34), ry: k(18) },
  { x: k(640), y: k(70), rx: k(22), ry: k(12) },
];

/* ---------- prédios que dá para entrar ---------- */
// action: { shop } entra na loja · { eco } abre o painel · { route } vai para outra tela
const B = (id, name, icon, x, y, w, h, z, color, kind, action, door) => ({ id, name, icon, x: k(x), y: k(y), w: k(w), h: k(h), z: k(z), color, kind, action, door: [k(door[0] ?? x + w / 2), k(door[1])] });
const row = (x, w) => [x + w / 2, 464];
const kio = (x, w) => [x + w / 2, 268];
export const BUILDINGS = [
  B("banco", "Banco", "🏦", 296, 398, 40, 62, 26, "#e8dcb8", "bank", { eco: "bank" }, row(296, 40)),
  B("mercado", "Mercado", "🛒", 340, 398, 40, 62, 22, "#e8913c", "market", { shop: "mercado" }, row(340, 40)),
  B("hospital", "Hospital", "🏥", 384, 398, 40, 62, 30, "#f1f5f7", "hospital", { shop: "saude" }, row(384, 40)),
  B("escola", "Escola", "🎓", 428, 398, 44, 62, 26, "#d98c4a", "school", { shop: "escola" }, row(428, 44)),
  B("empregos", "Centro de empregos", "💼", 530, 398, 42, 62, 52, "#2b8f9a", "tower", { eco: "work" }, row(530, 42)),
  B("lazer", "Cinema e lazer", "🎬", 575, 398, 42, 62, 24, "#d9548f", "cine", { shop: "lazer" }, row(575, 42)),
  B("imobiliaria", "Imobiliária", "🏠", 620, 398, 42, 62, 24, "#5db2a3", "estate", { shop: "imoveis" }, row(620, 42)),
  B("concessionaria", "Concessionária", "🚗", 665, 398, 42, 62, 20, "#e2a03c", "autos", { shop: "veiculos" }, row(665, 42)),
  B("cassino", "Cassino", "🎰", 478, 486, 78, 44, 24, "#b33a3a", "casino", { route: "/" }, [517, 535]),
  B("faculdade", "Faculdade", "🏛️", 300, 232, 46, 32, 24, "#d8c7a6", "college", { shop: "faculdade" }, kio(300, 46)),
  B("moveis", "Móveis", "🛋️", 352, 232, 38, 30, 16, "#b07a45", "kiosk", { shop: "decoracao" }, kio(352, 38)),
  B("caridade", "Caridade", "💝", 396, 232, 38, 30, 16, "#e11d48", "kiosk", { eco: "charity" }, kio(396, 38)),
  B("utilidades", "Utilidades", "🔧", 440, 232, 38, 30, 16, "#64748b", "kiosk", { shop: "utilidades" }, kio(440, 38)),
  B("beco", "Beco (roubar)", "🕵️", 540, 232, 38, 30, 16, "#374151", "kiosk", { eco: "rob" }, kio(540, 38)),
  B("financeira", "Financeira", "🤝", 584, 232, 38, 30, 18, "#0ea5e9", "kiosk", { eco: "loans" }, kio(584, 38)),
  B("boutique", "Boutique Visual", "✨", 628, 232, 38, 30, 16, "#a855f7", "kiosk", { shop: "visual" }, kio(628, 38)),
  B("parque", "Parque de diversões", "🎡", 672, 232, 40, 30, 16, "#f59e0b", "kiosk", { shop: "lazer" }, kio(672, 40)),
];

/* ---------- terrenos das casas ---------- */
const plotRow = (xs, y, w, h) => xs.map((x) => ({ x: k(x), y: k(y), w: k(w), h: k(h), door: [k(x + w / 2), k(y + h + 6)] }));
export const PLOTS = [
  ...plotRow([310, 350, 390, 430], 300, 36, 38),
  ...plotRow([540, 580, 620, 660], 300, 36, 38),
  ...plotRow([262, 306, 350, 394], 482, 40, 32),
  ...plotRow([574, 618, 662, 706], 482, 40, 32),
];
export const PLOT_COUNT = PLOTS.length;
// o corpo da casa dentro do terreno (bloqueia o caminho)
export const plotBody = (p) => ({ x: p.x + p.w * 0.14, y: p.y + p.h * 0.1, w: p.w * 0.72, h: p.h * 0.56 });

/* ---------- enfeites: casinhas, prédios, fábricas ---------- */
const hit = (a, b, m = 0) => a.x < b.x + b.w + m && a.x + a.w + m > b.x && a.y < b.y + b.h + m && a.y + a.h + m > b.y;
const R = rng(7);
const pick = (arr) => arr[Math.floor(R() * arr.length)];
const roadRects = ROADS.map((r) => ({ x: r.x, y: r.y, w: r.w, h: r.h }));
const fixed = [...BUILDINGS, ...PLOTS].map((o) => ({ x: o.x, y: o.y, w: o.w, h: o.h }));
fixed.push({ x: k(742), y: k(40), w: k(56), h: k(72) });
export const WHEEL = { x: k(742), y: k(40), w: k(56), h: k(72) };
const lakeRects = LAKES.map((l) => ({ x: l.x - l.rx, y: l.y - l.ry, w: l.rx * 2, h: l.ry * 2 }));
export const DECOR = []; // {kind, x,y,w,h,z,c,roof}
const free = (o, m = 4) => inIsland(o.x, o.y) && inIsland(o.x + o.w, o.y + o.h) && !roadRects.some((r) => hit(o, r, m)) && !fixed.some((r) => hit(o, r, m)) && !lakeRects.some((r) => hit(o, r, 4)) && !DECOR.some((r) => hit(o, r, 3));
function fill(x1, y1, x2, y2, make, step, tries = 1) {
  for (let y = y1; y < y2; y += step[1])
    for (let x = x1; x < x2; x += step[0]) {
      if (R() < 0.12) continue;
      for (let t = 0; t < tries; t++) {
        const o = make(k(x + R() * 3), k(y + R() * 3));
        if (free(o)) { DECOR.push(o); break; }
      }
    }
}
const ROOFS = ["#b4532a", "#c0562e", "#a33b2b", "#8a4b2a", "#d6762a", "#9a3b3b"];
const WALLS = ["#f1e3c6", "#e8d2a8", "#f5efe0", "#e9c9a0", "#d9e4ee"];
const house = (x, y) => ({ kind: "house", x, y, w: k(14 + R() * 5), h: k(11 + R() * 3), z: k(8), c: pick(WALLS), roof: pick(ROOFS) });
const tower = (zmin, zmax, wmin = 20, wmax = 30, cols = ["#3d8fc0", "#2b8f9a", "#e0b78a", "#8ea4b8", "#c9d6e3"]) => (x, y) => ({ kind: "tower", x, y, w: k(wmin + R() * (wmax - wmin)), h: k(wmin + R() * (wmax - wmin)), z: k(zmin + R() * (zmax - zmin)), c: pick(cols) });
const block = (x, y) => ({ kind: "block", x, y, w: k(26 + R() * 8), h: k(18 + R() * 4), z: k(22 + R() * 14), c: pick(["#e8c9a6", "#d9d2c0", "#e3b78a", "#cfd8e0"]) });
// fábricas (NO)
const FACTORIES = [
  [70, 150, 60, 36, 18, "#a53b34", true], [175, 150, 46, 34, 22, "#b9c2cf", true], [232, 120, 62, 54, 20, "#8c95a6", false], [250, 55, 40, 38, 24, "#9ba6b6", true],
  [360, 150, 46, 36, 20, "#b9c2cf", false], [418, 132, 56, 40, 18, "#a53b34", true], [290, 50, 38, 30, 18, "#c2cad6", false],
];
FACTORIES.forEach(([x, y, w, h, z, c, chim]) => DECOR.push({ kind: "factory", x: k(x), y: k(y), w: k(w), h: k(h), z: k(z), c, chim }));
export const MINE = { x: k(135), y: k(95), rx: k(55), ry: k(26) };
// cidade grande ao norte (centro e leste)
fill(354, 30, 498, 190, block, [34, 28], 3);
fill(526, 22, 718, 100, tower(34, 90), [30, 30], 3);
fill(734, 22, 984, 130, tower(40, 100), [30, 28], 3);
fill(526, 205, 716, 258, block, [40, 26], 2);
fill(735, 140, 984, 196, block, [34, 28], 2);
// bairros
fill(60, 218, 272, 470, house, [24, 22], 3);
fill(748, 410, 985, 470, house, [22, 20], 3);
fill(748, 286, 985, 392, house, [22, 20], 3);
fill(210, 482, 262, 520, house, [22, 20], 2);
fill(745, 480, 880, 530, house, [22, 20], 2);
fill(60, 475, 205, 535, house, [24, 20], 2);
fill(780, 218, 860, 275, house, [22, 20], 2);

/* ---------- árvores e postes ---------- */
export const TREES = [];
{
  const T = rng(31);
  const spots = [[56, 25, 990, 70], [56, 90, 120, 200], [525, 95, 720, 200], [740, 130, 985, 250], [58, 210, 275, 470], [300, 280, 500, 380], [530, 280, 720, 380], [250, 485, 500, 540], [570, 485, 740, 540], [748, 286, 985, 540]];
  for (const [x1, y1, x2, y2] of spots)
    for (let i = 0; i < (x2 - x1) * (y2 - y1) / 520; i++) {
      const x = k(x1 + T() * (x2 - x1));
      const y = k(y1 + T() * (y2 - y1));
      const o = { x: x - k(3), y: y - k(3), w: k(6), h: k(6) };
      if (inIsland(x, y) && !roadRects.some((r) => hit(o, r, 2)) && !fixed.some((r) => hit(o, r, 3)) && !DECOR.some((r) => hit(o, r, 1)) && !lakeRects.some((r) => hit(o, r, 3))) TREES.push({ x, y, s: 0.8 + T() * 0.6, c: T() > 0.5 ? "#4f9f3a" : "#63b244" });
    }
}

/* ---------- caminhar: grade + A* ---------- */
const CELL = 12;
const GW = Math.ceil(MAP_W / CELL);
const GH = Math.ceil(MAP_H / CELL);
const blocked = new Uint8Array(GW * GH);
function block_(o, m = 0) {
  const x1 = Math.max(0, Math.floor((o.x - m) / CELL));
  const x2 = Math.min(GW - 1, Math.floor((o.x + o.w + m) / CELL));
  const y1 = Math.max(0, Math.floor((o.y - m) / CELL));
  const y2 = Math.min(GH - 1, Math.floor((o.y + o.h + m) / CELL));
  for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) blocked[y * GW + x] = 1;
}
for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (!inIsland(x * CELL + CELL / 2, y * CELL + CELL / 2)) blocked[y * GW + x] = 1;
BUILDINGS.forEach((b) => block_(b));
PLOTS.forEach((p) => block_(plotBody(p)));
DECOR.forEach((d) => block_(d));
block_({ x: k(748), y: k(70), w: k(44), h: k(38) });
LAKES.forEach((l) => block_({ x: l.x - l.rx * 0.9, y: l.y - l.ry * 0.9, w: l.rx * 1.8, h: l.ry * 1.8 }));
block_({ x: MINE.x - MINE.rx * 0.7, y: MINE.y - MINE.ry * 0.5, w: MINE.rx * 1.4, h: MINE.ry }, 0);
// as portas ficam sempre livres
[...BUILDINGS.map((b) => b.door), ...PLOTS.map((p) => p.door)].forEach(([x, y]) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const cx = Math.floor(x / CELL) + dx, cy = Math.floor(y / CELL) + dy; if (cx >= 0 && cy >= 0 && cx < GW && cy < GH && inIsland(cx * CELL, cy * CELL)) blocked[cy * GW + cx] = 0; } });

const cellOf = (x, y) => [Math.max(0, Math.min(GW - 1, Math.floor(x / CELL))), Math.max(0, Math.min(GH - 1, Math.floor(y / CELL)))];
export const isBlocked = (x, y) => { const [cx, cy] = cellOf(x, y); return blocked[cy * GW + cx] === 1; };
function nearestFreeCell(cx, cy) {
  if (!blocked[cy * GW + cx]) return [cx, cy];
  for (let r = 1; r < 60; r++)
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const x = cx + dx, y = cy + dy;
        if (x >= 0 && y >= 0 && x < GW && y < GH && !blocked[y * GW + x]) return [x, y];
      }
  return [cx, cy];
}
export function snapToWalkable(x, y) {
  const [cx, cy] = nearestFreeCell(...cellOf(x, y));
  return { p: [cx * CELL + CELL / 2, cy * CELL + CELL / 2] };
}
const los = (a, b) => {
  const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const n = Math.ceil(d / 5);
  for (let i = 1; i < n; i++) if (isBlocked(a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n)) return false;
  return true;
};
// tenta andar de a até b em linha reta; desliza pelos eixos se esbarrar
export function stepMove(x, y, nx, ny) {
  if (!isBlocked(nx, ny)) return [nx, ny];
  if (!isBlocked(nx, y)) return [nx, y];
  if (!isBlocked(x, ny)) return [x, ny];
  return [x, y];
}
export function routeTo(from, to) {
  const [sx, sy] = nearestFreeCell(...cellOf(from[0], from[1]));
  const [tx, ty] = nearestFreeCell(...cellOf(to[0], to[1]));
  const goal = [tx * CELL + CELL / 2, ty * CELL + CELL / 2];
  const sIdx = sy * GW + sx;
  const tIdx = ty * GW + tx;
  if (sIdx === tIdx) return [goal];
  const g = new Float32Array(GW * GH).fill(Infinity);
  const prev = new Int32Array(GW * GH).fill(-1);
  const heap = [[0, sIdx]];
  g[sIdx] = 0;
  const h = (i) => { const dx = Math.abs((i % GW) - tx), dy = Math.abs(((i / GW) | 0) - ty); return Math.max(dx, dy) + 0.414 * Math.min(dx, dy); };
  const push = (n) => { heap.push(n); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
  const pop = () => { const top = heap[0]; const last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { let l = 2 * i + 1, r = l + 1, m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
  let found = false;
  while (heap.length) {
    const [, cur] = pop();
    if (cur === tIdx) { found = true; break; }
    const cx = cur % GW, cy = (cur / GW) | 0;
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= GW || ny >= GH) continue;
        const ni = ny * GW + nx;
        if (blocked[ni]) continue;
        if (dx && dy && (blocked[cy * GW + nx] || blocked[ny * GW + cx])) continue;
        const ng = g[cur] + (dx && dy ? 1.414 : 1);
        if (ng < g[ni]) { g[ni] = ng; prev[ni] = cur; push([ng + h(ni), ni]); }
      }
  }
  if (!found) return [];
  const pts = [];
  for (let i = tIdx; i !== -1; i = prev[i]) pts.unshift([(i % GW) * CELL + CELL / 2, ((i / GW) | 0) * CELL + CELL / 2]);
  pts[pts.length - 1] = goal;
  // simplifica: só mantém os pontos onde a linha reta deixa de ser livre
  const out = [];
  let a = [from[0], from[1]];
  let i = 0;
  while (i < pts.length) {
    let j = pts.length - 1;
    while (j > i && !los(a, pts[j])) j--;
    out.push(pts[j]);
    a = pts[j];
    i = j + 1;
  }
  return out;
}

// Dá um terreno livre a quem tem casa e ainda não tem terreno (transação em meta/city).
export async function claimPlot(uid) {
  const cityRef = doc(db, "meta", "city");
  const wRef = doc(db, "wallets", uid);
  return runTransaction(db, async (tx) => {
    const [cs, ws] = await Promise.all([tx.get(cityRef), tx.get(wRef)]);
    const w = ws.data() || {};
    if (!w.assets?.house) return -1;
    const plots = cs.exists() ? cs.data().plots || {} : {};
    if (Number.isInteger(w.plot) && plots[w.plot] === uid) return w.plot;
    let idx = Object.keys(plots).find((k) => plots[k] === uid);
    if (idx === undefined) {
      idx = PLOTS.findIndex((_, i) => !plots[i]);
      if (idx < 0) throw new Error("A cidade está lotada de casas!");
      tx.set(cityRef, { plots: { ...plots, [idx]: uid } }, { merge: true });
    }
    idx = Number(idx);
    if (w.plot !== idx) tx.update(wRef, { plot: idx });
    return idx;
  });
}
