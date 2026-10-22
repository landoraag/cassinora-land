// Boneco 2D da persona: só números e ids guardados no Firestore (persona.doll), desenhado em SVG por
// components/Doll.jsx. Cores ficam em listas aqui, então nada que vem do banco vira CSS solto.

export const SKINS = ["#ffe0c8", "#f7cfa6", "#e8b48c", "#cf9468", "#a8704a", "#7f4f31", "#5b3721", "#3e2416"];
export const HAIR_COLORS = ["#161312", "#3b2417", "#6b4423", "#a9743a", "#d9a441", "#f0d77a", "#c1440e", "#8c8f99", "#2a5db0", "#c026a3", "#f1f1f4", "#7c3aed"];
export const OUTFIT_COLORS = ["#0057ff", "#1e3a8a", "#22c55e", "#ef4444", "#f59e0b", "#a855f7", "#ec4899", "#14b8a6", "#f4f4f5", "#27272a", "#6b3f1f", "#9ca3af", "#facc15", "#0ea5e9"];
export const PANTS_COLORS = ["#1f2937", "#374151", "#1e3a8a", "#78350f", "#4d7c0f", "#f4f4f5", "#c2a878", "#6b5a3a"];
export const FURS = ["#8d949e", "#5b6068", "#c98f5a", "#e8e0d2", "#2f3238", "#b8754a", "#d9a05b", "#9aa7b8"];
export const SHOE_COLORS = ["#111111", "#f4f4f5", "#b91c1c", "#2563eb"];
export const EYE_COLORS = ["#5a3a22", "#1b1b1f", "#2b6bff", "#d92b2b", "#3bb38a", "#7a55e0", "#d9902b", "#2bb3c9"];
export const BG_COLORS = ["#16254d", "#1f3b2e", "#4a1d2a", "#3b2a14", "#2b1d4d", "#123b44", "#2a2a2e", "#4a3a12"];

// id → rótulo (a ordem é a da tela)
export const SPECIES = { human: "Humano", wolf: "Lobo", rabbit: "Coelho", cat: "Gato", fox: "Raposa", dog: "Cachorro", bear: "Urso", panda: "Panda" };
export const BOTTOMS = { cargo: "Cargo", jeans: "Jeans", shorts: "Bermuda" };
export const HAIRS = { short: "Lateral", messy: "Bagunçado", spiky: "Espetado", wild: "Rebelde", fluffy: "Fofo", bowl: "Tigela", buzz: "Raspado", long: "Longo", pony: "Rabo", bun: "Coque", bob: "Chanel", mohawk: "Moicano", afro: "Black", curly: "Cacheado", dreads: "Dreads", twintails: "Maria-chiquinha", undercut: "Topete", braid: "Trança", none: "Careca" };
export const EYES = { big: "Anime", sharp: "Sérios", dot: "Simples", sleepy: "Caídos", lash: "Cílios" };
export const MOUTHS = { mood: "Segue o humor", grin: "Sorrisão", smirk: "Sorriso torto", o: "Surpreso" };
export const FACIALS = { none: "Nada", beard: "Barba", mustache: "Bigode", goatee: "Cavanhaque", freckles: "Sardas", scar: "Cicatriz" };
export const OUTFITS = { tee: "Camiseta", hoodie: "Moletom", jacket: "Jaqueta", suit: "Terno", dress: "Vestido", coat: "Jaleco", apron: "Avental", tank: "Regata", varsity: "Jaqueta de time", overalls: "Macacão", track: "Agasalho" };
// roupas de carreira: só quem chegou no nível da carreira pode usar (checado em lib/rpg.js)
export const OUTFIT_REQ = { coat: { career: "saude", level: 2 }, suit: { career: "negocios", level: 1 }, apron: { career: "gastronomia", level: 1 }, hoodie: null };
export const ACC_REQ = { cap: { career: "transporte", level: 1 }, crown: { fame: 300 } };
export const ACCESSORIES = { none: "Nada", glasses: "Óculos", shades: "Óculos escuros", cap: "Boné", hat: "Cartola", crown: "Coroa", phones: "Fone", bandana: "Bandana", headband: "Bandana ninja", mask: "Máscara", beret: "Boina", hood: "Capuz", ninja: "Balaclava", scarf: "Cachecol", backpack: "Mochila", flower: "Flor", eyepatch: "Tapa-olho" };
export const EXTRAS = { none: "Nenhum", earring: "Brinco", necklace: "Colar", both: "Brinco e colar" };

const pick = (list, i) => list[((i % list.length) + list.length) % list.length];
const keyOf = (obj, v, fallback) => (Object.prototype.hasOwnProperty.call(obj, v) ? v : fallback);
const idx = (v, list, fallback = 0) => (Number.isInteger(v) && v >= 0 && v < list.length ? v : fallback);

export const DEFAULT_DOLL = { species: "human", bottom: "cargo", skin: 1, hair: "short", hairColor: 1, eyes: "big", eyeColor: 0, extra: "none", mouth: "mood", facial: "none", outfit: "tee", outfitColor: 0, pants: 0, shoes: 1, acc: "none", bg: 0 };

// Tudo que vem do banco passa por aqui: valores fora das listas voltam ao padrão.
export function cleanDoll(d) {
  const o = d && typeof d === "object" ? d : {};
  return {
    species: keyOf(SPECIES, o.species, DEFAULT_DOLL.species),
    bottom: keyOf(BOTTOMS, o.bottom, DEFAULT_DOLL.bottom),
    skin: idx(o.skin, SKINS, DEFAULT_DOLL.skin),
    hair: keyOf(HAIRS, o.hair, DEFAULT_DOLL.hair),
    hairColor: idx(o.hairColor, HAIR_COLORS, DEFAULT_DOLL.hairColor),
    eyes: keyOf(EYES, o.eyes, DEFAULT_DOLL.eyes),
    eyeColor: idx(o.eyeColor, EYE_COLORS, DEFAULT_DOLL.eyeColor),
    extra: keyOf(EXTRAS, o.extra, DEFAULT_DOLL.extra),
    mouth: keyOf(MOUTHS, o.mouth, DEFAULT_DOLL.mouth),
    facial: keyOf(FACIALS, o.facial, DEFAULT_DOLL.facial),
    outfit: keyOf(OUTFITS, o.outfit, DEFAULT_DOLL.outfit),
    outfitColor: idx(o.outfitColor, OUTFIT_COLORS, DEFAULT_DOLL.outfitColor),
    pants: idx(o.pants, PANTS_COLORS, DEFAULT_DOLL.pants),
    shoes: idx(o.shoes, SHOE_COLORS, DEFAULT_DOLL.shoes),
    acc: keyOf(ACCESSORIES, o.acc, DEFAULT_DOLL.acc),
    bg: idx(o.bg, BG_COLORS, DEFAULT_DOLL.bg),
  };
}

// Número a partir de um texto (para dar um boneco fixo a quem ainda não montou o seu).
function hash(str) {
  let h = 2166136261;
  for (const ch of String(str || "?")) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

export function defaultDoll(seed) {
  const h = hash(seed);
  const keys = (o) => Object.keys(o);
  return cleanDoll({
    species: h % 11 === 0 ? pick(["wolf", "rabbit", "cat", "fox", "dog", "bear", "panda"], h >> 4) : "human",
    bottom: pick(keys(BOTTOMS), h >> 6),
    skin: h % SKINS.length,
    hair: pick(keys(HAIRS), h >> 3),
    hairColor: (h >> 5) % HAIR_COLORS.length,
    eyes: pick(keys(EYES), h >> 7),
    eyeColor: (h >> 19) % EYE_COLORS.length,
    mouth: "mood",
    facial: "none",
    outfit: pick(keys(OUTFITS), h >> 9),
    outfitColor: (h >> 11) % OUTFIT_COLORS.length,
    pants: (h >> 13) % PANTS_COLORS.length,
    shoes: (h >> 15) % SHOE_COLORS.length,
    acc: "none",
    bg: (h >> 17) % BG_COLORS.length,
  });
}

export function randomDoll() {
  const r = (n) => Math.floor(Math.random() * n);
  const k = (o) => Object.keys(o)[r(Object.keys(o).length)];
  return cleanDoll({
    species: Math.random() < 0.25 ? k({ wolf: 1, rabbit: 1, cat: 1, fox: 1, dog: 1, bear: 1, panda: 1 }) : "human",
    bottom: k(BOTTOMS),
    skin: r(SKINS.length),
    hair: k(HAIRS),
    hairColor: r(HAIR_COLORS.length),
    eyes: k(EYES),
    eyeColor: r(EYE_COLORS.length),
    extra: k(EXTRAS),
    mouth: "mood",
    facial: Math.random() < 0.25 ? k({ beard: 1, mustache: 1, goatee: 1, freckles: 1 }) : "none",
    outfit: k(OUTFITS),
    outfitColor: r(OUTFIT_COLORS.length),
    pants: r(PANTS_COLORS.length),
    shoes: r(SHOE_COLORS.length),
    acc: Math.random() < 0.5 ? "none" : k(ACCESSORIES),
    bg: r(BG_COLORS.length),
  });
}

// O boneco de uma carteira (persona.doll ou um padrão estável pelo nome).
export const dollOf = (w) => (w?.persona?.doll ? cleanDoll(w.persona.doll) : defaultDoll(w?.persona?.name || w?.nickname || w?.id));

// Cor um tom mais escura / mais clara (para sombras e detalhes), a partir de "#rrggbb".
export function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c) => Math.max(0, Math.min(255, Math.round(c + amt * (amt < 0 ? c : 255 - c))));
  const r = f((n >> 16) & 255);
  const g = f((n >> 8) & 255);
  const b = f(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}
