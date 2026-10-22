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

// Boneco 2D no estilo "figura de vinil" (Funko): cabeção largo, olhos pretos brilhantes, sobrancelha grossa
// esculpida, nariz pequeno, SEM boca, cabelo/barba como massas sólidas com sombra suave (sem contorno preto),
// corpo curto e parrudo, cinto com bolsos e botas enormes.
//  Medidas: cabeça x12–108 / y8–94 · tronco y92–130 · pernas até y148 · botas até y166.
//  - mode "full": corpo inteiro · "portrait": rosto e ombros com fundo (avatar).
//  - mood / energy / health mexem nas sobrancelhas, pálpebras e cor do rosto.

const BLACK = "#0b0b10";
const edge = (c) => ({ stroke: shade(c, -0.45), strokeOpacity: 0.55, strokeWidth: 1, strokeLinejoin: "round", strokeLinecap: "round" });

/* ---------- cabelo: massas esculpidas (gradiente claro → escuro, brilho suave) ---------- */
function hairParts(id, c, g) {
  const f = `url(#${g})`;
  const dark = shade(c, -0.38);
  const hl = shade(c, 0.5);
  const E = edge(c);
  const shine = (d, w = 3) => <path d={d} fill="none" stroke={hl} strokeWidth={w} strokeLinecap="round" opacity=".5" />;
  const cap = "M17 52 Q10 2 60 0 Q110 2 103 52 Q99 34 90 28 Q74 34 58 26 Q40 34 30 28 Q21 34 17 52Z";
  switch (id) {
    case "short":
      return {
        front: (
          <g>
            <path d={cap} fill={f} {...E} />
            {shine("M30 14 Q50 2 74 8")}
            <path d="M58 26 Q68 18 90 28" fill="none" stroke={dark} strokeWidth="1.6" opacity=".45" />
          </g>
        ),
      };
    case "messy":
      return {
        front: (
          <g>
            <path d="M17 54 L10 32 L24 34 L16 12 L34 22 L34 -4 L48 14 L60 -8 L72 14 L86 -4 L86 22 L104 12 L96 34 L110 32 L103 54 Q99 38 90 32 L82 46 L72 32 L62 46 L52 32 L42 46 L32 34 Q22 40 17 54Z" fill={f} {...E} />
            {shine("M38 14 L46 24", 3)}
            {shine("M62 2 L62 16", 3)}
            {shine("M84 8 L76 20", 3)}
          </g>
        ),
      };
    case "spiky": // varrido para cima, como no boneco de cabelo branco
      return {
        front: (
          <g>
            <path d="M15 62 Q6 30 20 6 L28 22 L32 -6 L44 14 L52 -12 L62 12 L74 -12 L80 14 L92 -6 L94 22 L102 6 Q114 30 105 62 Q101 40 92 32 Q76 38 60 36 Q44 38 28 32 Q19 40 15 62Z" fill={f} {...E} />
            {shine("M30 26 L34 6", 2.6)}
            {shine("M48 20 L52 -4", 2.6)}
            {shine("M70 20 L74 -4", 2.6)}
            {shine("M88 26 L90 6", 2.6)}
            <path d="M20 40 Q22 54 20 64 M100 40 Q98 54 100 64" stroke={dark} strokeWidth="2" fill="none" opacity=".35" strokeLinecap="round" />
          </g>
        ),
      };
    case "wild":
      return {
        front: (
          <g>
            <path d="M15 66 L8 44 L22 46 L12 22 L32 32 L30 4 L46 20 L58 -6 L70 20 L88 4 L88 32 L108 22 L98 46 L112 44 L105 66 Q100 44 90 38 L84 56 L74 38 L62 54 L52 38 L40 56 L32 40 Q20 46 15 66Z" fill={f} {...E} />
            <path d="M24 44 Q18 74 28 92 Q34 70 36 46Z" fill={f} {...E} />
            <path d="M96 44 Q102 74 92 92 Q86 70 84 46Z" fill={f} {...E} />
            {shine("M40 14 Q52 6 62 14")}
          </g>
        ),
      };
    case "fluffy":
    case "curly":
      return {
        back: (
          <g fill={shade(c, -0.25)}>
            <circle cx="20" cy="50" r="13" />
            <circle cx="100" cy="50" r="13" />
          </g>
        ),
        front: (
          <g fill={f} {...E}>
            {[[22, 34, 15], [36, 14, 16], [60, 6, 17], [84, 14, 16], [98, 34, 15], [44, 32, 11], [60, 28, 10], [76, 32, 11]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} />)}
            <path d="M42 12 Q54 4 64 8 M72 16 Q84 10 92 20" fill="none" stroke={hl} strokeWidth="3" strokeLinecap="round" opacity=".5" />
          </g>
        ),
      };
    case "bowl":
      return {
        back: <path d="M14 50 C8 -4 112 -4 106 50 L108 84 Q96 92 88 80 L32 80 Q24 92 12 84Z" fill={shade(c, -0.3)} />,
        front: (
          <g>
            <path d="M16 56 C8 6 112 6 104 56 C98 44 86 40 76 42 C68 50 52 50 44 42 C34 40 22 44 16 56Z" fill={f} {...E} />
            {shine("M30 14 Q60 2 90 14")}
          </g>
        ),
      };
    case "buzz":
      return { front: <path d="M20 44 C16 6 104 6 100 44 C92 28 76 24 60 24 C44 24 28 28 20 44Z" fill={c} opacity=".8" /> };
    case "long":
      return {
        back: <path d="M13 54 C4 0 116 0 107 54 L114 124 Q60 138 6 124Z" fill={shade(c, -0.3)} {...E} />,
        front: (
          <g>
            <path d="M15 62 C6 6 114 6 105 62 C100 42 84 32 68 30 C64 44 54 44 52 30 C34 32 20 42 15 62Z" fill={f} {...E} />
            {shine("M30 14 Q60 2 90 14")}
            <path d="M18 50 Q10 86 20 110 Q26 82 28 54Z M102 50 Q110 86 100 110 Q94 82 92 54Z" fill={f} {...E} />
          </g>
        ),
      };
    case "pony":
      return {
        back: <path d="M92 18 C130 14 126 66 108 88 C108 102 98 110 90 112 C98 82 94 58 84 42Z" fill={shade(c, -0.25)} {...E} />,
        front: (
          <g>
            <path d={cap} fill={f} {...E} />
            {shine("M30 14 Q50 2 74 8")}
            <rect x="86" y="22" width="8" height="12" rx="3" fill="#ef4444" />
          </g>
        ),
      };
    case "bun":
      return {
        front: (
          <g>
            <circle cx="60" cy="-6" r="15" fill={f} {...E} />
            <path d={cap} fill={f} {...E} />
            {shine("M30 14 Q50 2 74 8")}
          </g>
        ),
      };
    case "bob":
      return {
        back: <path d="M13 50 C6 -2 114 -2 107 50 L110 92 Q96 102 86 88 L34 88 Q24 102 10 92Z" fill={shade(c, -0.3)} {...E} />,
        front: (
          <g>
            <path d="M15 58 C8 8 112 8 105 58 C100 38 82 30 60 30 C38 30 20 38 15 58Z" fill={f} {...E} />
            {shine("M30 14 Q60 2 90 14")}
          </g>
        ),
      };
    case "mohawk":
      return {
        front: (
          <g>
            <path d="M24 46 C24 16 96 16 96 46 C88 30 32 30 24 46Z" fill={c} opacity=".35" />
            <path d="M46 30 L40 -2 L52 8 L60 -18 L68 8 L80 -2 L74 30 Q60 36 46 30Z" fill={f} {...E} />
          </g>
        ),
      };
    case "afro":
      return {
        back: <circle cx="60" cy="34" r="56" fill={shade(c, -0.25)} {...E} />,
        front: <path d="M20 50 C14 14 106 14 100 50 C88 32 32 32 20 50Z" fill={f} {...E} />,
      };
    default:
      return {};
  }
}

/* ---------- rosto ---------- */
function Eye({ x, flip, kind }) {
  const d = flip ? -1 : 1;
  const cy = 62;
  if (kind === "dot")
    return (
      <g>
        <ellipse cx={x} cy={cy} rx="6" ry="7" fill={BLACK} />
        <ellipse cx={x - 1.8} cy={cy - 2.4} rx="2" ry="2.4" fill="#fff" />
      </g>
    );
  const sharp = kind === "sharp";
  const rx = sharp ? 9.6 : 9.4;
  const ry = sharp ? 8.4 : 11.2;
  return (
    <g>
      <ellipse cx={x} cy={cy} rx={rx} ry={ry} fill="url(#eyeg)" transform={sharp ? `rotate(${d * -8} ${x} ${cy})` : undefined} />
      <ellipse cx={x - 3} cy={cy - ry * 0.42} rx="3.4" ry={sharp ? 2.6 : 4} fill="#fff" opacity=".95" />
      <circle cx={x + 3.6} cy={cy + ry * 0.5} r="1.4" fill="#fff" opacity=".5" />
      {kind === "lash" && (
        <g stroke={BLACK} strokeWidth="2.2" strokeLinecap="round" fill="none">
          <path d={`M${x + d * 7.6} ${cy - 8} q${d * 4.6} -3.4 ${d * 7.4} -0.4`} />
          <path d={`M${x + d * 9} ${cy - 4} q${d * 4} -1.2 ${d * 6} 1.6`} />
        </g>
      )}
    </g>
  );
}

function browsOf(mood, color) {
  const t = mood < 25 ? -3.5 : mood > 75 ? -0.5 : 1.5;
  const dk = shade(color, -0.35);
  return (
    <g fill={color} stroke={dk} strokeWidth=".8" strokeLinejoin="round">
      <path d={`M26 45 Q40 37 55 ${45 + t} L55 ${51 + t} Q40 44.5 26 51Z`} />
      <path d={`M94 45 Q80 37 65 ${45 + t} L65 ${51 + t} Q80 44.5 94 51Z`} />
    </g>
  );
}

function mouthOf(kind, stroke) {
  switch (kind) {
    case "grin":
      return (
        <g transform="translate(0 6)">
          <path d="M50 78 Q60 90 70 78 Q60 75 50 78Z" fill="#7a1f2b" stroke={stroke} strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M53 78.4 H67" stroke="#fff" strokeWidth="2.2" />
        </g>
      );
    case "smile":
      return <path d="M52 82 Q60 88 68 82" fill="none" stroke={stroke} strokeWidth="2.6" strokeLinecap="round" />;
    case "flat":
      return <path d="M53 84 H67" fill="none" stroke={stroke} strokeWidth="2.6" strokeLinecap="round" />;
    case "sad":
      return <path d="M52 87 Q60 80 68 87" fill="none" stroke={stroke} strokeWidth="2.6" strokeLinecap="round" />;
    case "smirk":
      return <path d="M52 84 Q61 88 69 79" fill="none" stroke={stroke} strokeWidth="2.6" strokeLinecap="round" />;
    case "o":
      return <ellipse cx="60" cy="84" rx="4.4" ry="5.4" fill="#7a1f2b" stroke={stroke} strokeWidth="1.4" />;
    default:
      return null; // "mood": sem boca, como o boneco de referência
  }
}

/* ---------- acessórios ---------- */
function accessory(id, accent) {
  const A = edge(accent);
  switch (id) {
    case "glasses":
      return (
        <g fill="none" stroke="#23232b" strokeWidth="2.6">
          <circle cx="40" cy="62" r="15.5" fill="rgba(190,225,255,0.16)" />
          <circle cx="80" cy="62" r="15.5" fill="rgba(190,225,255,0.16)" />
          <path d="M55.5 60 Q60 56 64.5 60 M24.6 58 L14 54 M95.4 58 L106 54" />
          <path d="M31 54 Q38 49 45 52" stroke="#fff" strokeWidth="1.8" opacity=".7" />
        </g>
      );
    case "shades":
      return (
        <g>
          <rect x="24" y="50" width="32" height="22" rx="9" fill="#14141a" />
          <rect x="64" y="50" width="32" height="22" rx="9" fill="#14141a" />
          <path d="M56 56 H64 M24 55 L14 52 M96 55 L106 52" stroke="#14141a" strokeWidth="3" />
          <path d="M30 57 H42 M70 57 H82" stroke="rgba(255,255,255,.4)" strokeWidth="2.4" strokeLinecap="round" />
        </g>
      );
    case "cap":
      return (
        <g>
          <path d="M15 40 Q14 -4 60 -4 Q106 -4 105 40Z" fill={accent} {...A} />
          <path d="M60 -3 V38" stroke={shade(accent, -0.3)} strokeWidth="1.6" />
          <path d="M12 42 Q60 56 116 44 Q112 34 102 36 Q60 42 16 36Z" fill={shade(accent, -0.22)} {...A} />
        </g>
      );
    case "beret":
      return (
        <g>
          <path d="M8 40 C0 -4 46 -18 80 -12 C116 -6 118 26 110 40 Q60 28 8 40Z" fill={accent} {...A} />
          <path d="M8 40 Q60 28 112 40 L112 47 Q60 35 8 47Z" fill="#23232a" />
          <path d="M34 2 C46 -8 72 -8 84 0 L64 22Z" fill={shade(accent, 0.3)} opacity=".35" />
          <path d="M42 4 L68 4 L55 26Z" fill="#c9a227" stroke="#6b5311" strokeWidth="1.2" strokeLinejoin="round" transform="translate(6 -1)" />
          <path d="M50 8 L66 8 L58 20Z" fill="none" stroke="#6b5311" strokeWidth="1.5" transform="translate(6 -1)" />
        </g>
      );
    case "hat":
      return (
        <g>
          <rect x="34" y="-26" width="52" height="42" rx="6" fill="#1a1a1e" {...edge("#1a1a1e")} />
          <rect x="34" y="2" width="52" height="8" fill={accent} />
          <ellipse cx="60" cy="18" rx="50" ry="8.5" fill="#1a1a1e" {...edge("#1a1a1e")} />
        </g>
      );
    case "crown":
      return (
        <g>
          <path d="M26 20 L30 -14 L46 2 L60 -22 L74 2 L90 -14 L94 20Z" fill="#facc15" stroke="#a16207" strokeWidth="1.6" strokeLinejoin="round" />
          <circle cx="60" cy="-4" r="3.4" fill="#ef4444" />
          <circle cx="40" cy="10" r="2.4" fill="#3b82f6" />
          <circle cx="80" cy="10" r="2.4" fill="#22c55e" />
        </g>
      );
    case "phones":
      return (
        <g>
          <path d="M14 56 Q10 -6 60 -6 Q110 -6 106 56" fill="none" stroke="#222" strokeWidth="6" strokeLinecap="round" />
          <rect x="3" y="48" width="15" height="28" rx="7.5" fill={accent} stroke="#222" strokeWidth="1.6" />
          <rect x="102" y="48" width="15" height="28" rx="7.5" fill={accent} stroke="#222" strokeWidth="1.6" />
        </g>
      );
    case "bandana":
      return (
        <g>
          <path d="M14 34 Q60 8 106 34 L106 46 Q60 22 14 46Z" fill={accent} {...A} />
          <path d="M106 36 L120 30 L116 48Z" fill={shade(accent, -0.2)} {...A} />
          {[38, 60, 82].map((x) => <circle key={x} cx={x} cy={x === 60 ? 22 : 26} r="1.7" fill="rgba(255,255,255,.75)" />)}
        </g>
      );
    case "headband":
      return (
        <g>
          <path d="M13 32 Q60 12 107 32 L107 46 Q60 26 13 46Z" fill="#1f2937" {...edge("#1f2937")} />
          <rect x="38" y="22" width="44" height="20" rx="3.5" fill="#cfd6e0" stroke="#1b1b24" strokeWidth="1.5" />
          <path d="M60 32 m-5.4 0 a5.4 5.4 0 1 1 5.4 5.4 q-2.6 -2.6 0 -5.4" fill="none" stroke="#1b1b24" strokeWidth="1.6" />
          <path d="M107 36 L122 42 L117 56 M107 40 L120 60" fill="none" stroke="#1f2937" strokeWidth="4.4" strokeLinecap="round" />
        </g>
      );
    case "mask":
      return (
        <g>
          <path d="M20 70 Q60 88 100 70 Q104 100 60 104 Q16 100 20 70Z" fill="#1f2937" {...edge("#1f2937")} />
          <path d="M20 72 L10 62 M100 72 L110 62" stroke="#1b1b24" strokeWidth="1.8" strokeLinecap="round" />
        </g>
      );
    default:
      return null;
  }
}

// O boneco como grupo SVG (dá para colocar dentro de outras cenas, como a cidade). Chão em y=166.
export function DollShape({ cfg, mood = 60, energy = 100, health = 100, tool }) {
  const uid = useId().replace(/:/g, "");
  const d = cleanDoll(cfg);
  const skin = SKINS[d.skin];
  const skinDark = shade(skin, -0.22);
  const skinLight = shade(skin, 0.16);
  const hair = HAIR_COLORS[d.hairColor];
  const accent = OUTFIT_COLORS[d.outfitColor];
  const accentDark = shade(accent, -0.3);
  const accentLight = shade(accent, 0.32);
  const pants = PANTS_COLORS[d.pants];
  const shoe = SHOE_COLORS[d.shoes];
  const id = (n) => `${n}${uid}`;
  const hp = hairParts(d.hair, hair, id("hg"));
  const brow = d.hair === "none" ? "#3b2417" : shade(hair, -0.3);
  const pale = health < 30;
  const tired = energy < 15;
  const dress = d.outfit === "dress";
  const longSleeve = ["hoodie", "jacket", "suit", "coat"].includes(d.outfit);
  const main = d.outfit === "coat" ? "#f1f5fb" : d.outfit === "suit" ? shade(accent, -0.38) : d.outfit === "jacket" ? "#2c313b" : accent;
  const sleeve = d.outfit === "jacket" ? accent : main;
  const gloves = d.outfit === "jacket";
  const handC = gloves ? "#25252b" : skin;
  const masked = d.acc === "mask";
  const earring = d.extra === "earring" || d.extra === "both";
  const necklace = d.extra === "necklace" || d.extra === "both";
  const beard = d.facial === "beard";
  const lin = (n, c, c2) => (
    <linearGradient id={id(n)} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor={c} />
      <stop offset="1" stopColor={c2} />
    </linearGradient>
  );

  const boot = (x) => (
    <g>
      <path d={`M${x} 152 Q${x} 146 ${x + 6} 146 H${x + 28} Q${x + 34} 146 ${x + 34} 152 V161 Q${x + 34} 166 ${x + 28} 166 H${x + 6} Q${x} 166 ${x} 161Z`} fill={`url(#${id("sh")})`} {...edge(shoe)} />
      <path d={`M${x} 159 H${x + 34} V161 Q${x + 34} 166 ${x + 28} 166 H${x + 6} Q${x} 166 ${x} 161Z`} fill={shade(shoe, -0.5)} />
      <path d={`M${x + 5} 151 Q${x + 17} 147 ${x + 29} 151`} fill="none" stroke={shade(shoe, 0.45)} strokeWidth="2.2" strokeLinecap="round" opacity=".7" />
      <path d={`M${x + 8} 148 v6 M${x + 15} 148 v6 M${x + 22} 148 v6`} stroke={shade(shoe, 0.5)} strokeWidth="1.2" opacity=".55" />
    </g>
  );
  const arm = (x, right) => {
    const sh = longSleeve ? 34 : 17;
    return (
      <g>
        <rect x={x} y="100" width="17" height="38" rx="8" fill={skin} />
        <rect x={x - 1} y="96" width="19" height={sh + 4} rx="9" fill={`url(#${id("sl")})`} {...edge(sleeve)} />
        {longSleeve && <rect x={x - 1} y={96 + sh - 4} width="19" height="8" rx="4" fill={d.outfit === "jacket" ? "#2c313b" : accentDark} opacity={d.outfit === "coat" ? 0.18 : 0.9} />}
        {d.outfit === "jacket" && <path d={`M${x + (right ? 4 : 13)} 100 V${96 + sh - 6}`} stroke="#2c313b" strokeWidth="3" strokeLinecap="round" opacity=".85" />}
        <circle cx={x + 8.5} cy="141" r="10" fill={handC} {...edge(handC)} />
        <ellipse cx={x + (right ? 14 : 3)} cy="143" rx="4" ry="5.2" fill={shade(handC, 0.12)} {...edge(handC)} />
        {gloves && <rect x={x - 1} y="128" width="19" height="6" rx="3" fill="#18181d" />}
      </g>
    );
  };

  return (
    <g className="doll-body">
      <defs>
        <linearGradient id={id("sg")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={skinLight} />
          <stop offset=".55" stopColor={skin} />
          <stop offset="1" stopColor={skinDark} />
        </linearGradient>
        <radialGradient id={id("vg")} cx=".42" cy=".38" r=".7">
          <stop offset=".55" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".2" />
        </radialGradient>
        <linearGradient id={id("hg")} x1="0" y1="0" x2=".4" y2="1">
          <stop offset="0" stopColor={shade(hair, 0.18)} />
          <stop offset="1" stopColor={shade(hair, -0.3)} />
        </linearGradient>
        <radialGradient id="eyeg" cx=".38" cy=".3" r=".9">
          <stop offset="0" stopColor="#3a3a46" />
          <stop offset=".5" stopColor="#0e0e14" />
          <stop offset="1" stopColor="#000" />
        </radialGradient>
        {lin(id("tg"), shade(main, 0.12), shade(main, -0.3))}
        {lin(id("sl"), shade(sleeve, 0.12), shade(sleeve, -0.28))}
        {lin(id("pg"), shade(pants, 0.14), shade(pants, -0.3))}
        {lin(id("sh"), shade(shoe, 0.15), shade(shoe, -0.25))}
      </defs>
      <ellipse cx="60" cy="166" rx="42" ry="6" fill="rgba(0,0,0,.27)" />
      {hp.back}

      {/* pernas + botas */}
      <g className="legL">
        <path d="M37 124 H58 V152 H37Z" fill={dress ? skin : `url(#${id("pg")})`} {...edge(dress ? skin : pants)} />
        {!dress && <rect x="36" y="142" width="23" height="8" rx="3" fill={shade(pants, -0.3)} />}
        {boot(29)}
      </g>
      <g className="legR">
        <path d="M62 124 H83 V152 H62Z" fill={dress ? skin : `url(#${id("pg")})`} {...edge(dress ? skin : pants)} />
        {!dress && <rect x="61" y="142" width="23" height="8" rx="3" fill={shade(pants, -0.3)} />}
        {!dress && <rect x="68" y="130" width="12" height="11" rx="2.5" fill={shade(pants, 0.1)} {...edge(pants)} />}
        {boot(58)}
      </g>

      <g className="armL">{arm(14, false)}</g>

      {/* tronco */}
      {dress && <path d="M34 112 L20 152 H100 L86 112Z" fill={`url(#${id("tg")})`} {...edge(main)} />}
      <rect x="31" y="90" width="58" height="42" rx="14" fill={`url(#${id("tg")})`} {...edge(main)} />
      {d.outfit === "tee" && <path d="M48 92 Q60 106 72 92Z" fill={skinDark} />}
      {d.outfit === "hoodie" && (
        <g>
          <path d="M34 94 Q60 78 86 94 Q84 108 60 110 Q36 108 34 94Z" fill={accentDark} {...edge(accentDark)} />
          <path d="M53 102 V120 M67 102 V120" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          <circle cx="53" cy="121" r="2" fill="#fff" />
          <circle cx="67" cy="121" r="2" fill="#fff" />
          <path d="M38 114 Q60 124 82 114 V126 Q60 134 38 126Z" fill={accentDark} opacity=".85" />
        </g>
      )}
      {d.outfit === "jacket" && (
        <g>
          <path d="M36 98 Q36 92 44 92 H76 Q84 92 84 98 V128 H36Z" fill="#7b8494" {...edge("#7b8494")} />
          <path d="M42 96 H78 V108 H42Z" fill="#9aa3b2" opacity=".55" />
          {[43, 54, 65].map((x) => <rect key={x} x={x} y="112" width="10" height="13" rx="2" fill={accentLight} stroke={accentDark} strokeWidth="1" />)}
          {[43, 54, 65].map((x) => <rect key={"b" + x} x={x} y="112" width="10" height="3.4" rx="1.4" fill={accent} />)}
          <path d="M34 92 Q26 94 24 104 L38 104 Z M86 92 Q94 94 96 104 L82 104Z" fill="#6b7280" {...edge("#6b7280")} />
          <path d="M60 92 V108" stroke="#2c313b" strokeWidth="2" />
          <path d="M47 100 l2 -4 l2 4 l4 .6 l-3 3 l.8 4 l-3.8 -2 l-3.8 2 l.8 -4 l-3 -3Z" fill="#e5e7eb" opacity=".9" transform="translate(2 -1) scale(.9)" />
        </g>
      )}
      {d.outfit === "suit" && (
        <g>
          <path d="M48 92 L60 118 L72 92Z" fill="#fff" />
          <path d="M57 96 H63 L64.8 114 L60 121 L55.2 114Z" fill="#dc2626" stroke="#7f1d1d" strokeWidth=".9" />
          <path d="M48 92 L56 128 M72 92 L64 128" stroke="rgba(0,0,0,.5)" strokeWidth="2.2" />
          <circle cx="60" cy="126" r="1.6" fill="#e5e7eb" />
        </g>
      )}
      {d.outfit === "coat" && (
        <g>
          <path d="M48 92 L60 116 L72 92Z" fill={accent} />
          <path d="M60 116 V132" stroke="#cbd5e1" strokeWidth="1.6" />
          <rect x="68" y="112" width="12" height="12" rx="2.4" fill="none" stroke="#cbd5e1" strokeWidth="1.5" />
          <path d="M74 112 V107" stroke="#ef4444" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M46 96 Q48 114 60 116 M74 96 Q72 114 60 116" fill="none" stroke="#2b6bff" strokeWidth="2.4" opacity=".85" />
          <circle cx="60" cy="121" r="1.5" fill="#94a3b8" />
          <circle cx="60" cy="127" r="1.5" fill="#94a3b8" />
        </g>
      )}
      {d.outfit === "apron" && (
        <g>
          <path d="M42 110 H78 L83 132 H37Z" fill="#f8fafc" {...edge("#f8fafc")} />
          <path d="M43 110 L49 94 M77 110 L71 94" stroke="#f1f5f9" strokeWidth="5" strokeLinecap="round" />
          <rect x="51" y="116" width="18" height="11" rx="2.4" fill="none" stroke="#cbd5e1" strokeWidth="1.4" />
        </g>
      )}
      {dress && <path d="M48 92 Q60 106 72 92Z" fill={skinDark} />}
      {/* cinto com bolsos */}
      {!dress && d.outfit !== "apron" && (
        <g>
          <rect x="31" y="124" width="58" height="8" rx="3" fill="#25252b" {...edge("#25252b")} />
          <rect x="53" y="124.8" width="14" height="6.4" rx="1.6" fill="#a3a9b5" stroke="#4b5563" strokeWidth=".9" />
          <rect x="31" y="122" width="10" height="13" rx="2.4" fill="#33333b" {...edge("#33333b")} />
          <rect x="79" y="122" width="10" height="13" rx="2.4" fill="#33333b" {...edge("#33333b")} />
        </g>
      )}
      {necklace && (
        <g>
          <path d="M48 94 Q60 114 72 94" fill="none" stroke="#e5e7eb" strokeWidth="1.8" />
          <circle cx="60" cy="110" r="3.2" fill="#9ca3af" stroke="#4b5563" strokeWidth="1" />
        </g>
      )}
      <g className="armR">
        {arm(89, true)}
        {tool && (
          <text x="99" y="158" fontSize="24" textAnchor="middle">
            {tool}
          </text>
        )}
      </g>

      {/* cabeça */}
      <ellipse cx="13" cy="64" rx="7" ry="10" fill={skin} {...edge(skin)} />
      <ellipse cx="107" cy="64" rx="7" ry="10" fill={skin} {...edge(skin)} />
      {earring && <circle cx="13" cy="77" r="3.2" fill="none" stroke="#facc15" strokeWidth="2.2" />}
      <path d="M18 32 Q18 8 44 8 H76 Q102 8 102 32 V60 Q102 94 60 95 Q18 94 18 60Z" fill={`url(#${id("sg")})`} {...edge(skin)} />
      <path d="M18 32 Q18 8 44 8 H76 Q102 8 102 32 V60 Q102 94 60 95 Q18 94 18 60Z" fill={`url(#${id("vg")})`} />
      {pale && <path d="M18 32 Q18 8 44 8 H76 Q102 8 102 32 V60 Q102 94 60 95 Q18 94 18 60Z" fill="#8fd3a4" opacity=".3" />}
      <ellipse cx="34" cy="78" rx="8" ry="4.4" fill="#ff7a8a" opacity=".22" />
      <ellipse cx="86" cy="78" rx="8" ry="4.4" fill="#ff7a8a" opacity=".22" />
      <ellipse cx="42" cy="20" rx="16" ry="6" fill="#fff" opacity=".16" transform="rotate(-14 42 20)" />
      {browsOf(mood, brow)}
      {tired ? (
        <g>
          {[40, 80].map((x) => <path key={x} d={`M${x - 9} 61 Q${x} 69 ${x + 9} 61`} fill="none" stroke={BLACK} strokeWidth="3.6" strokeLinecap="round" />)}
        </g>
      ) : (
        <g>
          <Eye x={40} flip={false} kind={d.eyes} />
          <Eye x={80} flip kind={d.eyes} />
        </g>
      )}
      <path d="M60 68 Q54.6 79 57 80.4 Q60 82 63 80.4 Q65.4 79 60 68Z" fill={skinDark} opacity=".7" />
      <path d="M62.4 70 Q65 77 63.6 79" fill="none" stroke={skinLight} strokeWidth="1.4" opacity=".7" strokeLinecap="round" />
      {d.facial === "mustache" && <path d="M38 82 Q50 68 60 78 Q70 68 82 82 Q76 92 60 85 Q44 92 38 82Z" fill={`url(#${id("hg")})`} {...edge(hair)} />}
      {beard && (
        <g>
          <path d="M14 56 Q10 108 60 108 Q110 108 106 56 Q102 76 90 82 Q76 72 60 76 Q44 72 30 82 Q18 76 14 56Z" fill={`url(#${id("hg")})`} {...edge(hair)} />
          <path d="M36 84 Q48 70 60 80 Q72 70 84 84 Q76 96 60 90 Q44 96 36 84Z" fill={shade(hair, -0.1)} {...edge(hair)} />
          <path d="M30 92 Q60 108 90 92" fill="none" stroke={shade(hair, 0.4)} strokeWidth="2.2" opacity=".35" strokeLinecap="round" />
        </g>
      )}
      {!masked && d.mouth !== "mood" && !beard && mouthOf(d.mouth, "#5a2a2a")}
      {hp.front}
      {accessory(d.acc, accent)}
      {pale && (
        <g transform="rotate(-14 84 30)">
          <rect x="72" y="24" width="22" height="10" rx="2.5" fill="#f3d9b1" stroke="#c9a679" strokeWidth=".8" />
          <path d="M83 25.5 V32.5 M79.5 29 H86.5" stroke="#d97373" strokeWidth="1.3" />
        </g>
      )}
      {tired && (
        <g fill="#9fb3ff" fontFamily="sans-serif" fontWeight="700">
          <text x="112" y="14" fontSize="16">z</text>
          <text x="121" y="0" fontSize="11">z</text>
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
      viewBox={portrait ? "2 -10 116 116" : "-8 -30 136 202"}
      width={portrait ? size : (size * 136) / 202}
      height={size}
      role="img"
      aria-label={title || "Boneco"}
    >
      {title && <title>{title}</title>}
      {portrait && <rect x="2" y="-10" width="116" height="116" fill={BG_COLORS[d.bg]} />}
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
