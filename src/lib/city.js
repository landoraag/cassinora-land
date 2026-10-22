// A cidade 2D: mapa de 1200 x 720 (unidades do SVG), prédios públicos, terrenos das casas e caminhos.
// Cada prédio tem uma "porta" (onde o boneco chega) e uma ação. Quem compra casa ganha um terreno
// (meta/city guarda de quem é cada um) e a casa aparece no mapa; clicar nela entra na casa (/casa/:uid).
import { doc, runTransaction } from "firebase/firestore";
import { db } from "./firebase";

export const MAP_W = 1200;
export const MAP_H = 720;

// Zonas por onde se anda: avenida (A), rua vertical (B), rua de baixo (C).
export const ZONES = [
  { id: "A", x1: 0, y1: 246, x2: 1200, y2: 424 },
  { id: "B", x1: 548, y1: 0, x2: 652, y2: 720 },
  { id: "C", x1: 0, y1: 566, x2: 1200, y2: 606 },
];
const LINKS = { A: ["B"], B: ["A", "C"], C: ["B"] };
const JUNCTION = { "A|B": [600, 335], "B|A": [600, 335], "B|C": [600, 586], "C|B": [600, 586] };

const clampTo = (z, x, y) => [Math.max(z.x1, Math.min(z.x2, x)), Math.max(z.y1, Math.min(z.y2, y))];
const inZone = (z, x, y) => x >= z.x1 && x <= z.x2 && y >= z.y1 && y <= z.y2;
const dist2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;

// A zona e o ponto caminhável mais próximos de (x, y).
export function snapToWalkable(x, y) {
  let best = null;
  for (const z of ZONES) {
    const p = clampTo(z, x, y);
    const d = dist2(p, [x, y]);
    if (!best || d < best.d) best = { z, p, d };
  }
  return best;
}

// Caminho (lista de pontos) de `from` até `to` passando só pelas ruas.
export function routeTo(from, to) {
  const a = snapToWalkable(from[0], from[1]);
  const b = snapToWalkable(to[0], to[1]);
  if (a.z.id === b.z.id) return [b.p];
  // busca em largura entre as zonas
  const prev = { [a.z.id]: null };
  const queue = [a.z.id];
  while (queue.length) {
    const cur = queue.shift();
    if (cur === b.z.id) break;
    for (const n of LINKS[cur]) if (!(n in prev)) { prev[n] = cur; queue.push(n); }
  }
  const chain = [];
  for (let z = b.z.id; z; z = prev[z]) chain.unshift(z);
  const pts = [];
  for (let i = 0; i < chain.length - 1; i++) pts.push(JUNCTION[`${chain[i]}|${chain[i + 1]}`]);
  pts.push(b.p);
  return pts;
}

/* ---------------- prédios públicos ---------------- */
// action: { eco: "<painel>", shop?: "<loja>" } abre um painel da economia · { route } vai para outra tela
export const BUILDINGS = [
  { id: "banco", name: "Banco", icon: "🏦", x: 20, y: 430, w: 110, h: 120, color: "#2a5db0", action: { eco: "bank" } },
  { id: "mercado", name: "Mercado", icon: "🛒", x: 150, y: 430, w: 110, h: 120, color: "#2f9e5b", action: { eco: "shops", shop: "mercado" } },
  { id: "hospital", name: "Hospital", icon: "🏥", x: 280, y: 430, w: 110, h: 120, color: "#e8eefc", roof: "#ef4444", action: { eco: "shops", shop: "saude" } },
  { id: "escola", name: "Escola", icon: "🎓", x: 410, y: 430, w: 110, h: 120, color: "#d9a441", action: { eco: "shops", shop: "escola" } },
  { id: "empregos", name: "Centro de empregos", icon: "💼", x: 680, y: 430, w: 110, h: 120, color: "#7c3aed", action: { eco: "work" } },
  { id: "lazer", name: "Lazer", icon: "🎬", x: 810, y: 430, w: 110, h: 120, color: "#db2777", action: { eco: "shops", shop: "lazer" } },
  { id: "imobiliaria", name: "Imobiliária", icon: "🏠", x: 940, y: 430, w: 110, h: 120, color: "#0d9488", action: { eco: "shops", shop: "imoveis" } },
  { id: "concessionaria", name: "Concessionária", icon: "🚗", x: 1070, y: 430, w: 110, h: 120, color: "#ea580c", action: { eco: "shops", shop: "veiculos" } },
  { id: "cassino", name: "Cassino", icon: "🎰", x: 520, y: 612, w: 160, h: 100, color: "#b91c1c", roof: "#facc15", action: { route: "/" } },
  { id: "moveis", name: "Lojas de móveis", icon: "🛋️", x: 440, y: 258, w: 50, h: 48, color: "#8b5e34", kiosk: true, action: { eco: "shops", shop: "decoracao" } },
  { id: "caridade", name: "Caridade", icon: "💝", x: 495, y: 258, w: 50, h: 48, color: "#e11d48", kiosk: true, action: { eco: "charity" } },
  { id: "beco", name: "Beco (roubar)", icon: "🕵️", x: 655, y: 258, w: 50, h: 48, color: "#374151", kiosk: true, action: { eco: "rob" } },
  { id: "financeira", name: "Financeira", icon: "🤝", x: 710, y: 258, w: 50, h: 48, color: "#0ea5e9", kiosk: true, action: { eco: "loans" } },
].map((b) => ({ ...b, door: b.kiosk ? [b.x + b.w / 2, 322] : b.id === "cassino" ? [600, 596] : [b.x + b.w / 2, 418] }));

/* ---------------- terrenos das casas ---------------- */
const NORTH_X = [20, 150, 280, 410, 700, 830, 960, 1090];
const SOUTH_X = [20, 140, 260, 380, 710, 830, 950, 1070];
export const PLOTS = [
  ...NORTH_X.map((x) => ({ x, y: 112, w: 110, h: 134, door: [x + 55, 252] })),
  ...SOUTH_X.map((x) => ({ x, y: 612, w: 110, h: 100, door: [x + 55, 598] })),
];
export const PLOT_COUNT = PLOTS.length;

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
