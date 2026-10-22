import { useId, useState } from "react";
import {
  ACCESSORIES,
  BG_COLORS,
  EXTRAS,
  EYES,
  EYE_COLORS,
  FACIALS,
  HAIRS,
  HAIR_COLORS,
  MOUTHS,
  OUTFITS,
  OUTFIT_COLORS,
  PANTS_COLORS,
  SHOE_COLORS,
  SKINS,
  cleanDoll,
  randomDoll,
  shade,
} from "../lib/doll";

// Boneco 2D "chibi anime" em SVG (cabeção, olhos grandes com brilho, cabelo em mechas com reflexo,
// roupa com dobras e contorno na cor mais escura de cada peça).
// Medidas: cabeça centro (60,46) 76x68; tronco y78–110; pernas até y140; tênis até y150 (pés = 150).
//  - mode "full": corpo inteiro · "portrait": rosto e ombros com fundo (avatar).
//  - mood / energy / health mudam a carinha (boca, sobrancelha, olhos caídos com "z", pálido).

const INK = "#0d0d12";
const ol = (c, a = -0.55) => shade(c, a);
const sk = (c) => ({ stroke: ol(c), strokeWidth: 1.5, strokeLinejoin: "round", strokeLinecap: "round" });

/* ---------- cabelo ---------- */
// base + mechas em ponta (fringe) + reflexo. Todos desenhados em cima de uma cabeça x22–98, topo y≈12.
function hairParts(id, c) {
  const dark = shade(c, -0.3);
  const hl = shade(c, 0.45);
  const S = sk(c);
  const gloss = (d) => <path d={d} fill="none" stroke={hl} strokeWidth="3.2" strokeLinecap="round" opacity="0.5" />;
  const strand = (d, f = dark) => <path d={d} fill={f} stroke={ol(c)} strokeWidth="1" strokeLinejoin="round" />;
  switch (id) {
    case "short": // lateral, franja em mechas
      return {
        back: <path d="M23 50 C14 6 52 -4 66 4 C92 4 108 24 97 52Z" fill={dark} {...S} />,
        front: (
          <g>
            <path d="M22 54 C14 14 40 2 62 3 C86 3 106 14 98 54 C96 44 92 38 88 34 L82 46 L76 32 L68 44 L58 30 L50 44 L40 32 L34 46 L28 36 C25 42 23 48 22 54Z" fill={c} {...S} />
            {gloss("M36 14 Q52 6 72 10")}
            {strand("M30 36 Q26 52 32 60 Q36 48 36 38Z")}
            {strand("M90 36 Q96 52 90 60 Q86 48 84 38Z")}
          </g>
        ),
      };
    case "messy": // bagunçado com pontas para todo lado
      return {
        back: <path d="M22 56 L12 44 L22 40 L14 24 L28 28 L26 8 L42 16 L50 0 L62 12 L74 0 L82 16 L98 8 L96 28 L108 24 L98 42 L110 44 L98 56Z" fill={dark} {...S} />,
        front: (
          <g>
            <path d="M23 58 L16 42 L26 44 L20 26 L34 32 L34 12 L46 24 L54 6 L62 22 L72 6 L78 24 L90 12 L90 32 L102 26 L96 44 L106 42 L98 58 C96 46 92 40 86 36 L78 48 L70 34 L60 46 L52 34 L42 48 L36 38 C28 42 24 50 23 58Z" fill={c} {...S} />
            {gloss("M40 20 Q50 12 58 18")}
            {gloss("M68 16 Q78 12 86 20")}
          </g>
        ),
      };
    case "spiky": // espetado de anime
      return {
        back: <path d="M22 54 L10 36 L24 38 L12 12 L32 24 L30 -2 L46 16 L60 -10 L74 16 L90 -2 L88 24 L108 12 L96 38 L110 36 L98 54Z" fill={dark} {...S} />,
        front: (
          <g>
            <path d="M22 58 L12 42 L26 44 L16 22 L34 32 L36 8 L48 24 L60 -4 L72 24 L84 8 L86 32 L104 22 L94 44 L108 42 L98 58 C96 46 92 40 86 36 L78 50 L70 36 L60 48 L50 36 L42 50 L34 38 C27 42 23 50 22 58Z" fill={c} {...S} />
            {gloss("M40 16 L46 26")}
            {gloss("M60 4 L60 18")}
            {gloss("M80 16 L74 26")}
          </g>
        ),
      };
    case "wild": // rebelde: mechas longas na frente do rosto
      return {
        back: <path d="M21 58 L12 40 L24 42 L16 20 L32 28 L34 6 L46 20 L58 -2 L70 20 L82 6 L84 28 L102 20 L94 42 L108 40 L99 58Z" fill={dark} {...S} />,
        front: (
          <g>
            <path d="M22 60 L14 44 L26 46 L18 26 L34 32 L36 10 L48 24 L58 4 L68 22 L82 8 L84 30 L100 24 L94 46 L106 44 L98 60 C96 48 92 40 86 36 L78 52 L68 36 L60 50 L52 36 L42 54 L34 40 C27 44 23 52 22 60Z" fill={c} {...S} />
            {strand("M32 38 Q28 62 38 74 Q42 56 42 40Z", c)}
            {strand("M78 40 Q82 62 94 70 Q90 54 88 38Z", c)}
            {strand("M56 36 Q54 52 60 62 Q64 50 64 36Z", c)}
            {gloss("M38 16 Q50 8 62 14")}
          </g>
        ),
      };
    case "fluffy": // cacheado fofo
    case "curly":
      return {
        back: (
          <g fill={dark} {...S}>
            <circle cx="24" cy="46" r="12" />
            <circle cx="96" cy="46" r="12" />
            <circle cx="60" cy="14" r="22" />
          </g>
        ),
        front: (
          <g fill={c} {...S}>
            <circle cx="26" cy="32" r="14" />
            <circle cx="40" cy="16" r="15" />
            <circle cx="60" cy="10" r="16" />
            <circle cx="80" cy="16" r="15" />
            <circle cx="94" cy="32" r="14" />
            <circle cx="42" cy="34" r="10" />
            <circle cx="58" cy="32" r="9" />
            <circle cx="76" cy="34" r="10" />
            <path d="M44 14 Q54 8 62 12 M70 18 Q80 12 88 20" fill="none" stroke={hl} strokeWidth="3" strokeLinecap="round" opacity="0.5" />
          </g>
        ),
      };
    case "bowl": // tigela, franja reta e lateral comprida
      return {
        back: <path d="M20 44 C14 8 106 8 100 44 L102 80 Q92 90 84 78 L36 78 Q28 90 18 80Z" fill={dark} {...S} />,
        front: (
          <g>
            <path d="M22 54 C16 12 104 12 98 54 C94 40 84 34 74 36 C66 44 54 44 46 36 C36 34 26 40 22 54Z" fill={c} {...S} />
            {gloss("M36 14 Q60 6 84 14")}
            {strand("M24 40 Q22 62 30 80 Q34 62 34 44Z")}
            {strand("M96 40 Q98 62 90 80 Q86 62 86 44Z")}
          </g>
        ),
      };
    case "buzz":
      return { front: <path d="M28 40 C26 8 94 8 92 40 C86 26 74 22 60 22 C46 22 34 26 28 40Z" fill={c} opacity="0.85" /> };
    case "long":
      return {
        back: <path d="M20 46 C12 4 108 4 100 46 L106 112 Q60 126 14 112Z" fill={dark} {...S} />,
        front: (
          <g>
            <path d="M22 56 C14 12 106 12 98 56 C94 40 84 32 72 30 C64 44 50 44 44 32 C34 36 26 44 22 56Z" fill={c} {...S} />
            {gloss("M36 14 Q60 6 84 14")}
            {strand("M26 44 Q20 74 30 96 Q34 70 36 46Z")}
            {strand("M94 44 Q100 74 90 96 Q86 70 84 46Z")}
          </g>
        ),
      };
    case "pony":
      return {
        back: <path d="M92 20 C128 16 122 64 108 82 C106 96 96 104 90 108 C96 80 92 56 84 42Z" fill={dark} {...S} />,
        front: (
          <g>
            <path d="M22 54 C14 14 40 2 62 3 C86 3 106 14 98 54 C96 44 92 38 88 34 L82 46 L76 32 L68 44 L58 30 L50 44 L40 32 L34 46 L28 36 C25 42 23 48 22 54Z" fill={c} {...S} />
            {gloss("M36 14 Q52 6 72 10")}
          </g>
        ),
      };
    case "bun":
      return {
        front: (
          <g>
            <circle cx="60" cy="2" r="14" fill={c} {...S} />
            <path d="M22 54 C14 14 40 4 62 5 C86 5 106 14 98 54 C96 44 92 38 88 34 L82 46 L76 32 L68 44 L58 30 L50 44 L40 32 L34 46 L28 36 C25 42 23 48 22 54Z" fill={c} {...S} />
            {gloss("M36 16 Q52 8 72 12")}
          </g>
        ),
      };
    case "bob":
      return {
        back: <path d="M20 44 C14 6 106 6 100 44 L104 84 Q92 94 82 82 L38 82 Q28 94 16 84Z" fill={dark} {...S} />,
        front: (
          <g>
            <path d="M21 54 C14 14 106 14 99 54 C96 38 80 30 60 30 C40 30 24 38 21 54Z" fill={c} {...S} />
            {gloss("M36 16 Q60 8 84 16")}
          </g>
        ),
      };
    case "mohawk":
      return {
        front: (
          <g>
            <path d="M28 46 C28 16 92 16 92 46 C84 30 36 30 28 46Z" fill={c} opacity="0.35" />
            <path d="M48 30 L44 4 L54 14 L60 -10 L66 14 L76 4 L72 30 Q60 36 48 30Z" fill={c} {...S} />
          </g>
        ),
      };
    case "afro":
      return {
        back: <circle cx="60" cy="30" r="48" fill={dark} {...S} />,
        front: <path d="M26 46 C24 20 96 20 94 46 C84 32 36 32 26 46Z" fill={c} {...S} />,
      };
    default:
      return {};
  }
}

/* ---------- rosto (estilo boneco de vinil: olhos pretos brilhantes, sobrancelha grossa, nariz pequeno) ---------- */
function Eye({ x, flip, kind }) {
  const d = flip ? -1 : 1;
  const hl = (rx, ry) => (
    <g>
      <ellipse cx={x - 2.6 * d * -1 * -1 - 0.6} cy="49.6" rx={rx} ry={ry} fill="#fff" opacity=".95" />
      <circle cx={x + 3.4} cy="58.6" r="1.3" fill="#fff" opacity=".55" />
    </g>
  );
  if (kind === "dot")
    return (
      <g>
        <ellipse cx={x} cy="54" rx="5.4" ry="6.6" fill="#0d0d12" />
        <circle cx={x - 1.4} cy="51.6" r="1.8" fill="#fff" />
      </g>
    );
  if (kind === "sharp")
    return (
      <g>
        <ellipse cx={x} cy="54" rx="8.4" ry="7.4" fill="#0d0d12" transform={`rotate(${d * -9} ${x} 54)`} />
        <ellipse cx={x - 2.4} cy="51.6" rx="2.6" ry="2.2" fill="#fff" opacity=".95" />
        <circle cx={x + 3} cy="57" r="1.1" fill="#fff" opacity=".55" />
      </g>
    );
  return (
    <g>
      <ellipse cx={x} cy="54" rx="8.6" ry="10.4" fill="#0d0d12" />
      {hl(2.8, 3.4)}
      {kind === "lash" && (
        <g stroke="#0d0d12" strokeWidth="2" strokeLinecap="round" fill="none">
          <path d={`M${x + d * 7} 47.6 q${d * 4} -3 ${d * 6.6} -0.4`} />
          <path d={`M${x + d * 8.2} 51 q${d * 3.6} -1 ${d * 5.4} 1.4`} />
        </g>
      )}
    </g>
  );
}

const sleepyEyes = () => [42, 78].map((x) => <path key={x} d={`M${x - 8} 54 Q${x} 62 ${x + 8} 54`} fill="none" stroke="#0d0d12" strokeWidth="3.4" strokeLinecap="round" />);

function browsOf(mood, color) {
  const a = mood < 25 ? 4 : mood > 75 ? -1.5 : 0.5;
  return (
    <g fill={color} stroke={shade(color, -0.3)} strokeWidth=".8" strokeLinejoin="round">
      <path d={`M29 ${44 + a} Q42 ${34} 55 ${38 - a * 0.8} L55.5 ${43 - a * 0.8} Q42 ${40.5} 30 ${50 + a}Z`} />
      <path d={`M65 ${38 - a * 0.8} Q78 ${34} 91 ${44 + a} L90 ${50 + a} Q78 ${40.5} 64.5 ${43 - a * 0.8}Z`} />
    </g>
  );
}

function mouthOf(kind, mood, stroke) {
  let k = kind;
  if (k === "mood") k = mood >= 75 ? "grin" : mood >= 40 ? "smile" : mood >= 20 ? "flat" : "sad";
  let m = null;
  switch (k) {
    case "grin":
      m = (
        <g>
          <path d="M50 66 Q60 80 70 66 Q60 63 50 66Z" fill="#7a1f2b" stroke={stroke} strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M53 66.4 L67 66.4" stroke="#fff" strokeWidth="2.4" />
          <path d="M54 73.6 Q60 77 66 73.6 Q60 70.4 54 73.6Z" fill="#f0707f" />
        </g>
      );
      break;
    case "smile":
      m = <path d="M52 67 Q60 74 68 67" fill="none" stroke={stroke} strokeWidth="2.6" strokeLinecap="round" />;
      break;
    case "flat":
      m = <path d="M54 69 L66 69" fill="none" stroke={stroke} strokeWidth="2.6" strokeLinecap="round" />;
      break;
    case "sad":
      m = <path d="M52 72 Q60 64 68 72" fill="none" stroke={stroke} strokeWidth="2.6" strokeLinecap="round" />;
      break;
    case "smirk":
      m = <path d="M52 68 Q61 73 69 63" fill="none" stroke={stroke} strokeWidth="2.6" strokeLinecap="round" />;
      break;
    case "o":
      m = <ellipse cx="60" cy="69" rx="4.6" ry="5.8" fill="#7a1f2b" stroke={stroke} strokeWidth="1.6" />;
      break;
    default:
      return null;
  }
  return <g transform="translate(60 73) scale(.82) translate(-60 -69)">{m}</g>;
}

/* ---------- acessórios ---------- */
function accessory(id, accent) {
  switch (id) {
    case "glasses":
      return (
        <g fill="none" stroke="#2b2b34" strokeWidth="2.2">
          <circle cx="44" cy="54" r="13.5" fill="rgba(190,225,255,0.16)" />
          <circle cx="76" cy="54" r="13.5" fill="rgba(190,225,255,0.16)" />
          <path d="M57.5 52 Q60 49 62.5 52 M30.5 50 L22 46 M89.5 50 L98 46" />
          <path d="M36 48 Q42 44 48 47" stroke="#fff" strokeWidth="1.6" opacity="0.7" />
        </g>
      );
    case "shades":
      return (
        <g>
          <rect x="29" y="44" width="28" height="19" rx="8" fill="#16161a" />
          <rect x="63" y="44" width="28" height="19" rx="8" fill="#16161a" />
          <path d="M56 49 L64 49 M29 48 L22 45 M91 48 L98 45" stroke="#16161a" strokeWidth="2.6" />
          <path d="M34 50 L44 50 M68 50 L78 50" stroke="rgba(255,255,255,0.4)" strokeWidth="2.2" strokeLinecap="round" />
        </g>
      );
    case "cap":
      return (
        <g>
          <path d="M22 34 Q22 -2 60 -2 Q98 -2 98 34 Z" fill={accent} {...sk(accent)} />
          <path d="M60 -1 L60 33" stroke={shade(accent, -0.3)} strokeWidth="1.6" />
          <path d="M20 35 Q60 48 108 36 Q104 28 96 30 Q60 36 22 30Z" fill={shade(accent, -0.25)} {...sk(accent)} />
        </g>
      );
    case "hat":
      return (
        <g>
          <rect x="38" y="-16" width="44" height="34" rx="5" fill="#1a1a1e" {...sk("#1a1a1e")} />
          <rect x="38" y="6" width="44" height="7" fill={accent} />
          <ellipse cx="60" cy="19" rx="42" ry="7.5" fill="#1a1a1e" {...sk("#1a1a1e")} />
        </g>
      );
    case "crown":
      return (
        <g>
          <path d="M30 24 L34 -6 L48 8 L60 -14 L72 8 L86 -6 L90 24Z" fill="#facc15" stroke="#a16207" strokeWidth="1.6" strokeLinejoin="round" />
          <circle cx="60" cy="2" r="3" fill="#ef4444" />
          <circle cx="42" cy="12" r="2.2" fill="#3b82f6" />
          <circle cx="78" cy="12" r="2.2" fill="#22c55e" />
        </g>
      );
    case "phones":
      return (
        <g>
          <path d="M22 48 Q18 -2 60 -2 Q102 -2 98 48" fill="none" stroke="#222" strokeWidth="5.5" strokeLinecap="round" />
          <rect x="12" y="42" width="13" height="24" rx="6.5" fill={accent} stroke="#222" strokeWidth="1.6" />
          <rect x="95" y="42" width="13" height="24" rx="6.5" fill={accent} stroke="#222" strokeWidth="1.6" />
        </g>
      );
    case "bandana":
      return (
        <g>
          <path d="M22 32 Q60 10 98 32 L98 42 Q60 22 22 42Z" fill={accent} {...sk(accent)} />
          <path d="M98 34 L112 28 L108 44Z" fill={shade(accent, -0.2)} {...sk(accent)} />
          {[42, 58, 74].map((x) => <circle key={x} cx={x} cy={25 + (x === 58 ? -1 : 2)} r="1.5" fill="rgba(255,255,255,0.75)" />)}
        </g>
      );
    case "headband":
      return (
        <g>
          <path d="M21 30 Q60 14 99 30 L99 42 Q60 26 21 42Z" fill="#1f2937" {...sk("#1f2937")} />
          <rect x="40" y="23" width="40" height="17" rx="3" fill="#cfd6e0" stroke={INK} strokeWidth="1.5" />
          <path d="M60 31.5 m-5 0 a5 5 0 1 1 5 5 q-2.4 -2.4 0 -5" fill="none" stroke={INK} strokeWidth="1.5" />
          <path d="M99 34 L112 40 L108 52 M99 38 L110 56" fill="none" stroke="#1f2937" strokeWidth="4" strokeLinecap="round" />
        </g>
      );
    case "beret":
      return (
        <g>
          <path d="M16 36 C8 -4 52 -16 82 -8 C112 -2 112 28 104 36 Q60 26 16 36Z" fill={accent} stroke={shade(accent, -0.5)} strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M16 36 Q60 24 104 36 L104 42 Q60 31 16 42Z" fill="#26262c" />
          <path d="M44 4 C54 -4 74 -2 80 6 L66 22Z" fill={shade(accent, 0.25)} opacity=".5" />
          <path d="M44 6 L66 6 L55 24Z" fill="#c9a227" stroke="#6b5311" strokeWidth="1.2" strokeLinejoin="round" transform="translate(6 -1)" />
          <path d="M50 9 L66 9 L58 20Z" fill="none" stroke="#6b5311" strokeWidth="1.4" transform="translate(6 -1)" />
        </g>
      );
    case "mask":
      return (
        <g>
          <path d="M26 60 Q60 74 94 60 Q98 84 60 90 Q22 84 26 60Z" fill="#1f2937" {...sk("#1f2937")} />
          <path d="M26 62 L18 54 M94 62 L102 54" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
        </g>
      );
    default:
      return null;
  }
}

// O boneco como grupo SVG (dá para colocar dentro de outras cenas, como a cidade).
// Proporção "vinil": cabeção quadradão, corpo curto e parrudo, botas grandes.
export function DollShape({ cfg, mood = 60, energy = 100, health = 100, tool }) {
  const uid = useId().replace(/:/g, "");
  const d = cleanDoll(cfg);
  const skin = SKINS[d.skin];
  const skinDark = shade(skin, -0.2);
  const skinLight = shade(skin, 0.18);
  const hair = HAIR_COLORS[d.hairColor];
  const accent = OUTFIT_COLORS[d.outfitColor];
  const accentDark = shade(accent, -0.3);
  const accentLight = shade(accent, 0.3);
  const pants = PANTS_COLORS[d.pants];
  const shoe = SHOE_COLORS[d.shoes];
  const hp = hairParts(d.hair, hair);
  const brow = d.hair === "none" ? "#3b2417" : shade(hair, -0.25);
  const pale = health < 30;
  const tired = energy < 15;
  const dress = d.outfit === "dress";
  const longSleeve = ["hoodie", "jacket", "suit", "coat"].includes(d.outfit);
  const main = d.outfit === "coat" ? "#f4f7ff" : d.outfit === "suit" ? shade(accent, -0.35) : accent;
  const gloves = d.outfit === "jacket";
  const handC = gloves ? "#2a2a30" : skin;
  const masked = d.acc === "mask";
  const earring = d.extra === "earring" || d.extra === "both";
  const necklace = d.extra === "necklace" || d.extra === "both";
  const O = (c, w = 1.3) => ({ stroke: ol(c, -0.4), strokeWidth: w, strokeLinejoin: "round", strokeLinecap: "round" });
  const id = (n) => `${n}${uid}`;
  const boot = (x) => (
    <g>
      <path d={`M${x} 140 L${x + 24} 140 Q${x + 28} 140 ${x + 28} 146 L${x + 28} 150 Q${x + 28} 153 ${x + 25} 153 L${x + 3} 153 Q${x} 153 ${x} 150Z`} fill={shoe} {...O(shoe)} />
      <path d={`M${x} 148 L${x + 28} 148 L${x + 28} 150 Q${x + 28} 153 ${x + 25} 153 L${x + 3} 153 Q${x} 153 ${x} 150Z`} fill={shade(shoe, -0.45)} />
      <path d={`M${x + 4} 143 Q${x + 12} 140.5 ${x + 22} 143`} fill="none" stroke={shade(shoe, 0.35)} strokeWidth="1.8" strokeLinecap="round" opacity=".8" />
      <path d={`M${x + 8} 138 v5 M${x + 14} 138 v5 M${x + 20} 138 v5`} stroke={shade(shoe, 0.4)} strokeWidth="1" opacity=".5" />
    </g>
  );
  const arm = (x, flip) => {
    const sleeveH = longSleeve ? 30 : 15;
    return (
      <g>
        <rect x={x} y="88" width="15" height="32" rx="7" fill={skin} {...O(skin)} />
        <rect x={x - 0.5} y="86" width="16" height={sleeveH} rx="7.5" fill={main} {...O(main)} />
        {longSleeve && <rect x={x - 0.5} y={86 + sleeveH - 6} width="16" height="6" rx="3" fill={accentDark} opacity={d.outfit === "coat" ? 0.18 : 0.8} />}
        {d.outfit === "jacket" && <path d={`M${x + (flip ? 3 : 12)} 90 V112`} stroke={accentLight} strokeWidth="2.2" opacity=".9" />}
        <circle cx={x + 7.5} cy="124" r="8" fill={handC} {...O(handC)} />
        <ellipse cx={x + (flip ? 2 : 13)} cy="126" rx="3.6" ry="4.6" fill={shade(handC, 0.12)} {...O(handC, 0.8)} />
      </g>
    );
  };

  return (
    <g className="doll-body">
      <defs>
        <linearGradient id={id("sg")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={skinLight} />
          <stop offset="60%" stopColor={skin} />
          <stop offset="100%" stopColor={skinDark} />
        </linearGradient>
        <linearGradient id={id("cg")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={shade(main, 0.08)} />
          <stop offset="55%" stopColor={main} />
          <stop offset="100%" stopColor={shade(main, -0.3)} />
        </linearGradient>
        <linearGradient id={id("pg")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={shade(pants, 0.08)} />
          <stop offset="100%" stopColor={shade(pants, -0.25)} />
        </linearGradient>
      </defs>
      <ellipse cx="60" cy="153" rx="36" ry="5.5" fill="rgba(0,0,0,0.28)" />
      {hp.back}

      {/* pernas + botas */}
      <g className="legL">
        <path d="M40 116 L40 142 L60 142 L60 116Z" fill={dress ? skin : `url(#${id("pg")})`} {...O(dress ? skin : pants)} />
        {!dress && d.outfit === "jacket" && <path d="M44 120 V138" stroke={accentLight} strokeWidth="2" opacity=".8" />}
        {boot(34)}
      </g>
      <g className="legR">
        <path d="M60 116 L60 142 L80 142 L80 116Z" fill={dress ? skin : `url(#${id("pg")})`} {...O(dress ? skin : pants)} />
        {!dress && <rect x="68" y="124" width="10" height="9" rx="2" fill={shade(pants, 0.12)} {...O(pants, 1)} />}
        {boot(58)}
      </g>

      <g className="armL">{arm(23, true)}</g>

      {/* tronco */}
      <rect x="51" y="78" width="18" height="12" rx="5" fill={skinDark} />
      {dress && <path d="M38 108 L26 142 L94 142 L82 108Z" fill={`url(#${id("cg")})`} {...O(main)} />}
      <rect x="36" y="84" width="48" height="36" rx="11" fill={`url(#${id("cg")})`} {...O(main)} />
      {d.outfit === "tee" && <path d="M49 84 Q60 98 71 84Z" fill={skinDark} />}
      {d.outfit === "hoodie" && (
        <g>
          <path d="M40 86 Q60 70 80 86 Q78 98 60 100 Q42 98 40 86Z" fill={accentDark} {...O(accentDark)} />
          <path d="M54 94 V110 M66 94 V110" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="54" cy="111" r="1.8" fill="#fff" />
          <circle cx="66" cy="111" r="1.8" fill="#fff" />
          <path d="M42 108 Q60 116 78 108 L78 118 Q60 124 42 118Z" fill={accentDark} opacity=".85" />
        </g>
      )}
      {d.outfit === "jacket" && (
        <g>
          <path d="M36 92 Q36 84 46 84 H74 Q84 84 84 92 V120 H36Z" fill={shade("#6b7280", -0.05)} {...O("#6b7280")} />
          <path d="M44 88 H76 V100 H44Z" fill="#8b93a1" opacity=".6" />
          {[46, 56, 66].map((x) => <rect key={x} x={x} y="104" width="8" height="10" rx="1.5" fill={accentLight} stroke={shade(accent, -0.5)} strokeWidth="1" />)}
          <path d="M40 84 L34 92 L44 94Z M80 84 L86 92 L76 94Z" fill={accent} {...O(accent)} />
          <path d="M60 84 V102" stroke={accentDark} strokeWidth="1.6" />
          <path d="M52 90 l3 -3 l1.4 3 l3 .5 l-2.4 2.2 l.8 3 l-2.8 -1.6 l-2.8 1.6 l.8 -3Z" fill="#e5e7eb" opacity=".9" transform="translate(-2 1) scale(.8)" />
        </g>
      )}
      {d.outfit === "suit" && (
        <g>
          <path d="M50 84 L60 108 L70 84Z" fill="#fff" />
          <path d="M57 88 L63 88 L64.6 106 L60 112 L55.4 106Z" fill="#dc2626" stroke="#7f1d1d" strokeWidth=".9" />
          <path d="M50 84 L57 116 M70 84 L63 116" stroke="rgba(0,0,0,.5)" strokeWidth="2" />
          <circle cx="60" cy="116" r="1.4" fill="#e5e7eb" />
        </g>
      )}
      {d.outfit === "coat" && (
        <g>
          <path d="M50 84 L60 106 L70 84Z" fill={accent} />
          <path d="M60 106 V120" stroke="#cbd5e1" strokeWidth="1.6" />
          <rect x="68" y="104" width="10" height="10" rx="2" fill="none" stroke="#cbd5e1" strokeWidth="1.4" />
          <path d="M73 104 V100" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M48 88 Q50 104 60 106 M72 88 Q70 104 60 106" fill="none" stroke="#2b6bff" strokeWidth="2.2" opacity=".85" />
          <circle cx="60" cy="110" r="1.4" fill="#94a3b8" />
          <circle cx="60" cy="116" r="1.4" fill="#94a3b8" />
        </g>
      )}
      {d.outfit === "apron" && (
        <g>
          <path d="M44 100 L76 100 L80 120 L40 120Z" fill="#f8fafc" {...O("#f8fafc")} />
          <path d="M45 100 L50 86 M75 100 L70 86" stroke="#f1f5f9" strokeWidth="4" strokeLinecap="round" />
          <rect x="52" y="106" width="16" height="10" rx="2" fill="none" stroke="#cbd5e1" strokeWidth="1.3" />
        </g>
      )}
      {dress && <path d="M49 84 Q60 96 71 84Z" fill={skinDark} />}
      {/* cinto utilitário */}
      {!dress && d.outfit !== "apron" && (
        <g>
          <rect x="36" y="113" width="48" height="7" rx="2.5" fill="#26262c" {...O("#26262c", 1)} />
          <rect x="54" y="113.6" width="12" height="5.8" rx="1.5" fill="#9ca3af" stroke="#4b5563" strokeWidth=".9" />
          {d.outfit === "jacket" && <rect x="76" y="112" width="9" height="12" rx="2" fill="#3a3a42" {...O("#3a3a42", 1)} />}
        </g>
      )}
      {necklace && (
        <g>
          <path d="M51 85 Q60 102 69 85" fill="none" stroke="#e5e7eb" strokeWidth="1.5" />
          <circle cx="60" cy="98" r="2.8" fill="#9ca3af" stroke="#4b5563" strokeWidth=".9" />
        </g>
      )}
      <g className="armR">
        {arm(82, false)}
        {tool && (
          <text x="90" y="138" fontSize="22" textAnchor="middle">
            {tool}
          </text>
        )}
      </g>

      {/* cabeça */}
      <ellipse cx="18" cy="56" rx="6" ry="9" fill={skin} {...O(skin)} />
      <ellipse cx="102" cy="56" rx="6" ry="9" fill={skin} {...O(skin)} />
      {earring && <circle cx="18" cy="68" r="3" fill="none" stroke="#facc15" strokeWidth="2" />}
      <rect x="19" y="14" width="82" height="70" rx="30" fill={`url(#${id("sg")})`} {...O(skin, 1.5)} />
      {pale && <rect x="19" y="14" width="82" height="70" rx="30" fill="#8fd3a4" opacity=".3" />}
      <ellipse cx="31" cy="68" rx="7" ry="4" fill="#ff6b81" opacity=".28" />
      <ellipse cx="89" cy="68" rx="7" ry="4" fill="#ff6b81" opacity=".28" />
      {browsOf(mood, brow)}
      {tired ? sleepyEyes() : (
        <g>
          <Eye x={42} flip={false} kind={d.eyes} />
          <Eye x={78} flip kind={d.eyes} />
        </g>
      )}
      <path d="M60 57 Q55.6 67.6 57.4 68.6 Q60 70 62.6 68.6 Q64.4 67.6 60 57Z" fill={skinDark} opacity=".75" />
      {d.facial === "mustache" && <path d="M42 70 Q51 60 60 67 Q69 60 78 70 Q70 79 60 73 Q50 79 42 70Z" fill={hair} {...O(hair, 1)} />}
      {d.facial === "beard" && (
        <g>
          <path d="M19 52 Q16 92 60 94 Q104 92 101 52 Q98 72 82 74 Q72 68 60 70 Q48 68 38 74 Q22 72 19 52Z" fill={hair} {...O(hair, 1.2)} />
          <path d="M42 70 Q51 60 60 67 Q69 60 78 70 Q70 79 60 73 Q50 79 42 70Z" fill={shade(hair, -0.12)} {...O(hair, 1)} />
          <path d="M30 80 Q60 96 90 80" fill="none" stroke={shade(hair, 0.3)} strokeWidth="2" opacity=".35" strokeLinecap="round" />
        </g>
      )}
      {!masked && mouthOf(d.mouth, mood, d.facial === "beard" ? "#f2dfd0" : "#4a2020")}
      {hp.front}
      {accessory(d.acc, accent)}
      {pale && (
        <g transform="rotate(-14 72 26)">
          <rect x="62" y="22" width="20" height="9" rx="2.5" fill="#f3d9b1" stroke="#c9a679" strokeWidth=".8" />
          <path d="M72 23.5 L72 29.5 M69 26.5 L75 26.5" stroke="#d97373" strokeWidth="1.2" />
        </g>
      )}
      {tired && (
        <g fill="#9fb3ff" fontFamily="sans-serif" fontWeight="700">
          <text x="104" y="22" fontSize="15">z</text>
          <text x="113" y="8" fontSize="10">z</text>
        </g>
      )}
    </g>
  );
}

export default function Doll({ cfg, mode = "full", size = 64, mood = 60, energy = 100, health = 100, walk = false, className = "", title }) {
  const d = cleanDoll(cfg);
  const portrait = mode === "portrait";
  return (
    <svg
      className={"doll" + (portrait ? " doll-portrait" : "") + (walk ? " doll-walk" : "") + (className ? " " + className : "")}
      viewBox={portrait ? "6 -6 108 108" : "-8 -20 136 180"}
      width={portrait ? size : (size * 136) / 180}
      height={size}
      role="img"
      aria-label={title || "Boneco"}
    >
      {title && <title>{title}</title>}
      {portrait && <rect x="6" y="-6" width="108" height="108" fill={BG_COLORS[d.bg]} />}
      <DollShape cfg={d} mood={mood} energy={energy} health={health} />
    </svg>
  );
}

const TABS = [
  ["pele", "🙂 Rosto"],
  ["cabelo", "💇 Cabelo"],
  ["roupa", "👕 Roupa"],
  ["extras", "🕶️ Extras"],
];

function Swatches({ list, value, onChange, label }) {
  return (
    <div className="de-group">
      <span className="de-label">{label}</span>
      <div className="de-swatches">
        {list.map((c, i) => (
          <button type="button" key={c + i} className={"de-swatch" + (i === value ? " sel" : "")} style={{ background: c }} onClick={() => onChange(i)} aria-label={`${label} ${i + 1}`} aria-pressed={i === value} />
        ))}
      </div>
    </div>
  );
}

function Options({ options, field, value, cfg, onChange, label, mini = true, locks = {} }) {
  return (
    <div className="de-group">
      <span className="de-label">{label}</span>
      <div className="de-opts">
        {Object.entries(options).map(([id, name]) => (
          <button type="button" key={id} className={"de-opt" + (id === value ? " sel" : "") + (locks[id] ? " locked" : "")} disabled={!!locks[id]} title={locks[id] ? `Libera com: ${locks[id]}` : undefined} onClick={() => onChange(id)} aria-pressed={id === value}>
            {mini && <Doll cfg={{ ...cfg, [field]: id }} mode="portrait" size={46} />}
            <em>{locks[id] ? `🔒 ${locks[id]}` : name}</em>
          </button>
        ))}
      </div>
    </div>
  );
}

export function DollEditor({ value, onChange, mood = 60, outfitLocks = {}, accLocks = {} }) {
  const [tab, setTab] = useState("pele");
  const cfg = cleanDoll(value);
  const set = (k) => (v) => onChange(cleanDoll({ ...cfg, [k]: v }));
  return (
    <div className="doll-editor">
      <div className="de-preview">
        <Doll cfg={cfg} size={168} mood={mood} title="Prévia do boneco" />
        <Doll cfg={cfg} mode="portrait" size={64} mood={mood} className="de-ava" title="Avatar" />
        <button type="button" className="btn btn-ghost de-random" onClick={() => onChange(randomDoll())}>
          🎲 Aleatório
        </button>
      </div>
      <div className="de-panel">
        <div className="tabs de-tabs" role="tablist">
          {TABS.map(([id, label]) => (
            <button type="button" role="tab" aria-selected={tab === id} key={id} className={tab === id ? "on" : ""} onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
        </div>
        {tab === "pele" && (
          <>
            <Swatches list={SKINS} value={cfg.skin} onChange={set("skin")} label="Pele" />
            <Options options={EYES} field="eyes" value={cfg.eyes} cfg={cfg} onChange={set("eyes")} label="Olhos" />
            <Options options={MOUTHS} field="mouth" value={cfg.mouth} cfg={cfg} onChange={set("mouth")} label="Boca" />
            <Swatches list={EYE_COLORS} value={cfg.eyeColor} onChange={set("eyeColor")} label="Cor dos olhos" />
            <Options options={FACIALS} field="facial" value={cfg.facial} cfg={cfg} onChange={set("facial")} label="Barba" />
          </>
        )}
        {tab === "cabelo" && (
          <>
            <Options options={HAIRS} field="hair" value={cfg.hair} cfg={cfg} onChange={set("hair")} label="Estilo" />
            <Swatches list={HAIR_COLORS} value={cfg.hairColor} onChange={set("hairColor")} label="Cor do cabelo" />
          </>
        )}
        {tab === "roupa" && (
          <>
            <Options options={OUTFITS} field="outfit" value={cfg.outfit} cfg={cfg} onChange={set("outfit")} label="Roupa (as de cargo se ganham na carreira)" locks={outfitLocks} />
            <Swatches list={OUTFIT_COLORS} value={cfg.outfitColor} onChange={set("outfitColor")} label="Cor da roupa" />
            <Swatches list={PANTS_COLORS} value={cfg.pants} onChange={set("pants")} label="Calça" />
            <Swatches list={SHOE_COLORS} value={cfg.shoes} onChange={set("shoes")} label="Tênis" />
          </>
        )}
        {tab === "extras" && (
          <>
            <Options options={EXTRAS} field="extra" value={cfg.extra} cfg={cfg} onChange={set("extra")} label="Brinco e colar" />
            <Options options={ACCESSORIES} field="acc" value={cfg.acc} cfg={cfg} onChange={set("acc")} label="Acessório" locks={accLocks} />
            <Swatches list={BG_COLORS} value={cfg.bg} onChange={set("bg")} label="Fundo do avatar" />
          </>
        )}
      </div>
    </div>
  );
}
