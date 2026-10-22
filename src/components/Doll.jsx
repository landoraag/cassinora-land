import { useState } from "react";
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

// Boneco 2D estilo "chibi" (cabeção, olhos grandes de anime, contorno escuro), todo em SVG.
// Medidas: cabeça centro (60,50) 68x62; tronco y80–122; pernas até y150; tênis até y160.
//  - mode "full": corpo inteiro · "portrait": rosto e ombros com fundo (avatar).
//  - mood / energy / health mudam a carinha (boca, olhos caídos com "z", pálido com curativo).

const INK = "#1b1b1f";
const LINE = { stroke: INK, strokeWidth: 1.6, strokeLinejoin: "round", strokeLinecap: "round" };

// mechas claras por cima do cabelo (dá o brilho de desenho)
const Shine = ({ d, c }) => <path d={d} fill="none" stroke={shade(c, 0.38)} strokeWidth="2.4" strokeLinecap="round" opacity="0.55" />;

function hairParts(id, c) {
  const dark = shade(c, -0.28);
  const L = (d, fill = c) => <path d={d} fill={fill} {...LINE} />;
  switch (id) {
    case "short": // lateral, franja varrida
      return {
        front: (
          <g>
            {L("M25 54 Q17 10 60 9 Q103 10 95 54 Q94 38 82 30 Q70 46 46 32 Q34 38 30 56Z")}
            <Shine d="M44 17 Q58 11 74 17" c={c} />
          </g>
        ),
      };
    case "messy": // bagunçado
      return {
        front: (
          <g>
            {L("M24 56 L18 40 L28 40 L22 22 L36 28 L38 8 L50 22 L60 4 L70 22 L82 8 L84 28 L98 22 L92 40 L102 40 L96 56 Q94 40 82 36 L74 48 L62 34 L50 48 L42 36 Q30 40 24 56Z")}
            <Shine d="M42 20 Q50 14 56 20 M66 18 Q74 12 80 20" c={c} />
          </g>
        ),
      };
    case "spiky": // espetado de anime
      return {
        front: (
          <g>
            {L("M22 58 L12 38 L26 42 L14 16 L34 28 L34 2 L48 22 L60 -4 L72 22 L86 2 L86 28 L106 16 L94 42 L108 38 L98 58 Q95 40 82 36 L74 50 L64 36 L56 36 L46 50 L38 36 Q25 40 22 58Z")}
            <Shine d="M36 14 L42 24 M62 6 L64 18 M84 14 L80 24" c={c} />
          </g>
        ),
      };
    case "wild": // rebelde, mechas na frente do rosto
      return {
        front: (
          <g>
            {L("M23 58 L14 42 L26 44 L18 24 L34 30 L36 10 L48 24 L58 6 L68 22 L82 10 L84 30 L100 24 L94 44 L106 42 L97 58 Q95 42 84 38 L76 54 L68 38 L60 50 L52 38 L44 56 L38 40 Q27 44 23 58Z")}
            {L("M30 46 Q32 64 40 72 Q42 58 44 46Z")}
            {L("M76 44 Q80 62 90 68 Q88 56 86 44Z")}
          </g>
        ),
      };
    case "fluffy": // cacheado/fofo
      return {
        back: (
          <g fill={dark} {...LINE}>
            <circle cx="26" cy="46" r="11" />
            <circle cx="94" cy="46" r="11" />
          </g>
        ),
        front: (
          <g fill={c} {...LINE}>
            <circle cx="28" cy="34" r="14" />
            <circle cx="42" cy="20" r="15" />
            <circle cx="60" cy="14" r="16" />
            <circle cx="78" cy="20" r="15" />
            <circle cx="92" cy="34" r="14" />
            <circle cx="44" cy="36" r="10" />
            <circle cx="60" cy="34" r="10" />
            <circle cx="76" cy="36" r="10" />
          </g>
        ),
      };
    case "bowl": // tigela / franja reta
      return {
        back: <path d="M22 44 Q18 76 36 78 L40 52Z M98 44 Q102 76 84 78 L80 52Z" fill={c} {...LINE} />,
        front: (
          <g>
            {L("M24 52 Q20 8 60 8 Q100 8 96 52 Q88 34 74 32 Q62 42 50 32 Q34 34 24 52Z")}
            <Shine d="M42 16 Q60 9 78 16" c={c} />
          </g>
        ),
      };
    case "buzz":
      return { front: <path d="M29 46 Q31 15 60 15 Q89 15 91 46 Q80 28 60 28 Q40 28 29 46Z" fill={c} opacity="0.8" /> };
    case "long":
      return {
        back: <path d="M24 44 Q18 8 60 8 Q102 8 96 44 L100 100 Q60 112 20 100Z" fill={c} {...LINE} />,
        front: (
          <g>
            {L("M25 54 Q17 10 60 9 Q103 10 95 54 Q92 34 76 28 Q66 42 48 30 Q34 38 25 54Z")}
            <Shine d="M42 17 Q58 11 76 17" c={c} />
          </g>
        ),
      };
    case "pony":
      return {
        back: <path d="M90 24 Q124 24 112 70 Q108 92 96 100 Q102 66 86 46Z" fill={c} {...LINE} />,
        front: <g>{L("M25 54 Q17 10 60 9 Q103 10 95 54 Q94 38 82 30 Q70 46 46 32 Q34 38 30 56Z")}</g>,
      };
    case "bun":
      return {
        front: (
          <g>
            <circle cx="60" cy="4" r="12" fill={c} {...LINE} />
            {L("M25 54 Q17 12 60 11 Q103 12 95 54 Q94 38 82 30 Q70 46 46 32 Q34 38 30 56Z")}
          </g>
        ),
      };
    case "bob":
      return {
        back: <path d="M22 40 Q18 8 60 8 Q102 8 98 40 L100 78 Q96 86 84 80 L36 80 Q24 86 20 78Z" fill={c} {...LINE} />,
        front: <g>{L("M23 52 Q19 12 60 11 Q101 12 97 52 L92 36 Q60 24 28 36Z")}</g>,
      };
    case "mohawk":
      return {
        front: (
          <g>
            <path d="M28 46 Q30 18 60 18 Q90 18 92 46 Q80 28 60 28 Q40 28 28 46Z" fill={c} opacity="0.3" />
            {L("M50 30 Q44 -2 60 -8 Q76 -2 70 30 Q65 34 60 34 Q55 34 50 30Z")}
          </g>
        ),
      };
    case "afro":
      return {
        back: <circle cx="60" cy="34" r="42" fill={c} {...LINE} />,
        front: <path d="M28 44 Q28 22 60 22 Q92 22 92 44 Q82 32 60 32 Q38 32 28 44Z" fill={dark} />,
      };
    case "curly":
      return hairParts("fluffy", c);
    default:
      return {};
  }
}

function eyesOf(kind, energyLow, color) {
  const k = energyLow ? "sleepy" : kind;
  const spots = [47, 73];
  if (k === "sleepy")
    return spots.map((x) => <path key={x} d={`M${x - 8} 55 Q${x} 62 ${x + 8} 55`} fill="none" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />);
  if (k === "dot")
    return spots.map((x) => (
      <g key={x}>
        <ellipse cx={x} cy="55" rx="4" ry="5.2" fill={INK} />
        <circle cx={x + 1.3} cy="53" r="1.5" fill="#fff" />
      </g>
    ));
  const sharp = k === "sharp";
  return spots.map((x, i) => {
    const dir = i === 0 ? -1 : 1;
    return (
      <g key={x}>
        <ellipse cx={x} cy="55" rx="8.6" ry={sharp ? 8 : 10} fill="#fff" stroke={INK} strokeWidth="1.3" />
        <ellipse cx={x} cy="56" rx="6.6" ry={sharp ? 6.6 : 8.4} fill={color} />
        <ellipse cx={x} cy="56.5" rx="3.4" ry={sharp ? 4 : 5} fill={INK} />
        <circle cx={x - 2.2} cy="52" r="2.4" fill="#fff" />
        <circle cx={x + 2.4} cy="59" r="1.2" fill="#fff" opacity="0.85" />
        {/* pálpebra de cima grossa */}
        <path d={`M${x - 9.5} ${sharp ? 51 : 49} Q${x} ${sharp ? 46 : 44} ${x + 9.5} ${sharp ? 51 : 49}`} fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
        {k === "lash" && <path d={`M${x + dir * 9.5} 50 l${dir * 4} -3 M${x + dir * 9.8} 54 l${dir * 4.2} -1`} stroke={INK} strokeWidth="1.8" strokeLinecap="round" />}
      </g>
    );
  });
}

function browsOf(mood, color) {
  // humor baixo = sobrancelha brava/triste; alto = levantada
  const a = mood < 25 ? 4 : mood > 75 ? -3 : 0;
  return (
    <g fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round">
      <path d={`M38 ${42 + a} Q47 ${38} 55 ${42 - a * 0.5}`} />
      <path d={`M65 ${42 - a * 0.5} Q73 ${38} 82 ${42 + a}`} />
    </g>
  );
}

function mouthOf(kind, mood, stroke) {
  let k = kind;
  if (k === "mood") k = mood >= 75 ? "grin" : mood >= 40 ? "smile" : mood >= 20 ? "flat" : "sad";
  switch (k) {
    case "grin":
      return (
        <g>
          <path d="M51 68 Q60 82 69 68 Z" fill="#7a1f1f" stroke={stroke} strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M54 76 Q60 80 66 76 Q60 72 54 76Z" fill="#ff7a8a" />
        </g>
      );
    case "smile":
      return <path d="M53 70 Q60 76 67 70" fill="none" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" />;
    case "flat":
      return <path d="M54 72 L66 72" fill="none" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" />;
    case "sad":
      return <path d="M53 75 Q60 68 67 75" fill="none" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" />;
    case "smirk":
      return <path d="M53 71 Q61 75 69 67" fill="none" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" />;
    case "o":
      return <ellipse cx="60" cy="72" rx="4.2" ry="5.2" fill="#7a1f1f" stroke={stroke} strokeWidth="1.6" />;
    default:
      return null;
  }
}

function accessory(id, accent) {
  switch (id) {
    case "glasses":
      return (
        <g fill="none" stroke="#2b2b30" strokeWidth="2.2">
          <circle cx="47" cy="55" r="11.5" fill="rgba(190,225,255,0.18)" />
          <circle cx="73" cy="55" r="11.5" fill="rgba(190,225,255,0.18)" />
          <path d="M58.5 53 Q60 51 61.5 53 M35.5 52 L28 48 M84.5 52 L92 48" />
        </g>
      );
    case "shades":
      return (
        <g>
          <rect x="34" y="46" width="24" height="16" rx="7" fill="#141414" />
          <rect x="62" y="46" width="24" height="16" rx="7" fill="#141414" />
          <path d="M57 51 L63 51 M34 50 L28 47 M86 50 L92 47" stroke="#141414" strokeWidth="2.6" />
          <path d="M39 51 L46 51 M67 51 L74 51" stroke="rgba(255,255,255,0.35)" strokeWidth="2" strokeLinecap="round" />
        </g>
      );
    case "cap":
      return (
        <g>
          <path d="M27 34 Q27 4 60 4 Q93 4 93 34 Z" fill={accent} {...LINE} />
          <path d="M60 5 L60 33" stroke={shade(accent, -0.25)} strokeWidth="1.6" />
          <ellipse cx="60" cy="35" rx="35" ry="6" fill={shade(accent, -0.3)} {...LINE} />
        </g>
      );
    case "hat":
      return (
        <g>
          <rect x="42" y="-8" width="36" height="28" rx="4" fill="#1a1a1a" {...LINE} />
          <rect x="42" y="10" width="36" height="6" fill={accent} />
          <ellipse cx="60" cy="21" rx="36" ry="6.5" fill="#1a1a1a" {...LINE} />
        </g>
      );
    case "crown":
      return (
        <g>
          <path d="M34 24 L38 0 L49 12 L60 -6 L71 12 L82 0 L86 24Z" fill="#facc15" stroke="#a16207" strokeWidth="1.6" strokeLinejoin="round" />
          <circle cx="60" cy="8" r="2.4" fill="#ef4444" />
          <circle cx="44" cy="15" r="1.8" fill="#3b82f6" />
          <circle cx="76" cy="15" r="1.8" fill="#22c55e" />
        </g>
      );
    case "phones":
      return (
        <g>
          <path d="M26 46 Q24 4 60 4 Q96 4 94 46" fill="none" stroke="#222" strokeWidth="5" strokeLinecap="round" />
          <rect x="18" y="40" width="11" height="20" rx="5.5" fill={accent} stroke="#222" strokeWidth="1.6" />
          <rect x="91" y="40" width="11" height="20" rx="5.5" fill={accent} stroke="#222" strokeWidth="1.6" />
        </g>
      );
    case "bandana":
      return (
        <g>
          <path d="M26 34 Q60 16 94 34 L94 42 Q60 28 26 42Z" fill={accent} {...LINE} />
          <path d="M94 36 L106 30 L103 44Z" fill={shade(accent, -0.2)} {...LINE} />
          {[44, 58, 72].map((x) => <circle key={x} cx={x} cy={28 + (x === 58 ? -1 : 1)} r="1.4" fill="rgba(255,255,255,0.7)" />)}
        </g>
      );
    case "headband": // bandana ninja com placa de metal
      return (
        <g>
          <path d="M25 33 Q60 22 95 33 L95 43 Q60 32 25 43Z" fill="#1f2937" {...LINE} />
          <rect x="42" y="27" width="36" height="14" rx="3" fill="#cbd5e1" stroke={INK} strokeWidth="1.4" />
          <path d="M60 34 m-4 0 a4 4 0 1 1 4 4 q-2 -2 0 -4" fill="none" stroke={INK} strokeWidth="1.4" />
          <path d="M95 36 L108 40 L104 48 M95 40 L106 52" fill="none" stroke="#1f2937" strokeWidth="4" strokeLinecap="round" />
        </g>
      );
    case "mask": // máscara de pano (rosto de baixo)
      return (
        <g>
          <path d="M30 60 Q60 72 90 60 Q92 80 60 84 Q28 80 30 60Z" fill="#1f2937" {...LINE} />
          <path d="M30 62 L24 56 M90 62 L96 56" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
        </g>
      );
    default:
      return null;
  }
}

// O boneco como grupo SVG (dá para colocar dentro de outras cenas, como a cidade).
export function DollShape({ cfg, mood = 60, energy = 100, health = 100, tool }) {
  const d = cleanDoll(cfg);
  const skin = SKINS[d.skin];
  const skinDark = shade(skin, -0.14);
  const hair = HAIR_COLORS[d.hairColor];
  const accent = OUTFIT_COLORS[d.outfitColor];
  const accentDark = shade(accent, -0.25);
  const pants = PANTS_COLORS[d.pants];
  const shoe = SHOE_COLORS[d.shoes];
  const hp = hairParts(d.hair, hair);
  const brow = d.hair === "none" ? "#3b2417" : shade(hair, -0.25);
  const pale = health < 30;
  const tired = energy < 15;
  const dress = d.outfit === "dress";
  const longSleeve = ["hoodie", "jacket", "suit", "coat"].includes(d.outfit);
  const main = d.outfit === "coat" ? "#f7f9ff" : d.outfit === "suit" ? shade(accent, -0.3) : accent;
  const sleeve = main;
  const masked = d.acc === "mask";
  const earring = d.extra === "earring" || d.extra === "both";
  const necklace = d.extra === "necklace" || d.extra === "both";

  return (
    <g className="doll-body">
      <ellipse cx="60" cy="163" rx="30" ry="5" fill="rgba(0,0,0,0.28)" />
      {hp.back}

      {/* pernas e tênis */}
      <g className="legL">
        <rect x="44" y="118" width="15" height="36" rx="6" fill={dress ? skin : pants} {...LINE} />
        <path d="M40 150 Q40 146 46 146 L58 146 Q62 146 62 152 L62 160 L40 160Z" fill="#fff" {...LINE} />
        <path d="M40 154 L62 154 L62 160 L40 160Z" fill={shoe} {...LINE} />
      </g>
      <g className="legR">
        <rect x="61" y="118" width="15" height="36" rx="6" fill={dress ? skin : pants} {...LINE} />
        <path d="M58 150 Q58 146 64 146 L76 146 Q80 146 80 152 L80 160 L58 160Z" fill="#fff" {...LINE} />
        <path d="M58 154 L80 154 L80 160 L58 160Z" fill={shoe} {...LINE} />
      </g>

      {/* braços */}
      <g className="armL">
        <rect x="31" y="84" width="14" height={longSleeve ? 36 : 22} rx="7" fill={sleeve} {...LINE} />
        {d.outfit === "jacket" && <path d="M34 90 L34 114" stroke="#fff" strokeWidth="2" opacity="0.8" />}
        {!longSleeve && <rect x="31" y="100" width="14" height="18" rx="7" fill={skin} {...LINE} />}
        <circle cx="38" cy="121" r="6" fill={skin} {...LINE} />
      </g>
      <g className="armR">
        <rect x="75" y="84" width="14" height={longSleeve ? 36 : 22} rx="7" fill={sleeve} {...LINE} />
        {d.outfit === "jacket" && <path d="M86 90 L86 114" stroke="#fff" strokeWidth="2" opacity="0.8" />}
        {!longSleeve && <rect x="75" y="100" width="14" height="18" rx="7" fill={skin} {...LINE} />}
        <circle cx="82" cy="121" r="6" fill={skin} {...LINE} />
        {tool && (
          <text x="84" y="130" fontSize="22" textAnchor="middle">
            {tool}
          </text>
        )}
      </g>

      {/* pescoço e tronco */}
      <rect x="52" y="76" width="16" height="14" rx="4" fill={skinDark} />
      {dress && <path d="M42 108 L30 146 L90 146 L78 108Z" fill={accent} {...LINE} />}
      <rect x="42" y="82" width="36" height="42" rx="10" fill={d.outfit === "jacket" ? "#f8fafc" : main} {...LINE} />
      {d.outfit === "tee" && <path d="M51 82 Q60 94 69 82Z" fill={skinDark} />}
      {d.outfit === "hoodie" && (
        <g>
          <path d="M44 84 Q60 70 76 84 Q76 94 60 98 Q44 94 44 84Z" fill={accentDark} {...LINE} />
          <path d="M55 92 L55 106 M65 92 L65 106" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
          <rect x="49" y="108" width="22" height="12" rx="5" fill={accentDark} />
        </g>
      )}
      {d.outfit === "jacket" && (
        <g>
          <path d="M42 82 L42 124 L56 124 L56 88 Q48 88 42 82Z" fill={accent} {...LINE} />
          <path d="M78 82 L78 124 L64 124 L64 88 Q72 88 78 82Z" fill={accent} {...LINE} />
          <path d="M56 88 Q60 96 64 88" fill="none" stroke={INK} strokeWidth="1.4" />
          <path d="M42 120 L56 120 M64 120 L78 120" stroke="#fff" strokeWidth="3" opacity="0.85" />
          <path d="M56 90 L56 124 M64 90 L64 124" stroke="#fff" strokeWidth="1.6" />
        </g>
      )}
      {d.outfit === "suit" && (
        <g>
          <path d="M51 82 L60 106 L69 82Z" fill="#fff" />
          <path d="M57.5 86 L62.5 86 L63.5 104 L60 109 L56.5 104Z" fill="#dc2626" />
          <path d="M51 82 L58 108 M69 82 L62 108" stroke="rgba(0,0,0,0.4)" strokeWidth="1.6" />
        </g>
      )}
      {dress && <path d="M51 82 Q60 92 69 82Z" fill={skinDark} />}
      {d.outfit === "coat" && (
        <g>
          <path d="M51 82 L60 104 L69 82Z" fill={accent} />
          <path d="M60 104 L60 124" stroke="#cbd5e1" strokeWidth="1.6" />
          <rect x="66" y="104" width="9" height="9" rx="2" fill="none" stroke="#cbd5e1" strokeWidth="1.4" />
          <path d="M70 104 L70 100" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
          <circle cx="60" cy="110" r="1.4" fill="#94a3b8" />
          <circle cx="60" cy="118" r="1.4" fill="#94a3b8" />
        </g>
      )}
      {d.outfit === "apron" && (
        <g>
          <path d="M47 98 L73 98 L76 124 L44 124Z" fill="#f8fafc" {...LINE} />
          <path d="M48 98 L54 82 M72 98 L66 82" stroke="#f8fafc" strokeWidth="3" strokeLinecap="round" />
          <rect x="54" y="108" width="12" height="8" rx="2" fill="none" stroke="#cbd5e1" strokeWidth="1.3" />
        </g>
      )}
      {necklace && (
        <g>
          <path d="M50 84 Q60 108 70 84" fill="none" stroke="#d1d5db" strokeWidth="1.4" />
          <circle cx="60" cy="101" r="2.4" fill="#9ca3af" stroke={INK} strokeWidth="0.8" />
        </g>
      )}

      {/* cabeça */}
      <ellipse cx="26" cy="56" rx="5.5" ry="6.5" fill={skin} {...LINE} />
      <ellipse cx="94" cy="56" rx="5.5" ry="6.5" fill={skin} {...LINE} />
      {earring && <path d="M24 61 L24 69 M20 65 L28 65" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />}
      <ellipse cx="60" cy="50" rx="34" ry="31" fill={skin} {...LINE} />
      {pale && <ellipse cx="60" cy="50" rx="34" ry="31" fill="#8fd3a4" opacity="0.28" />}
      <ellipse cx="38" cy="64" rx="5.5" ry="3.4" fill="#ff6b6b" opacity="0.28" />
      <ellipse cx="82" cy="64" rx="5.5" ry="3.4" fill="#ff6b6b" opacity="0.28" />
      {browsOf(mood, brow)}
      {eyesOf(d.eyes, tired, EYE_COLORS[d.eyeColor])}
      <path d="M60 62 Q58.4 65 61 65" fill="none" stroke={skinDark} strokeWidth="1.4" strokeLinecap="round" />
      {d.facial === "mustache" && <path d="M50 67 Q55 63 60 66 Q65 63 70 67 Q64 71 60 68.5 Q56 71 50 67Z" fill={hair} />}
      {d.facial === "beard" && <path d="M30 60 Q32 84 60 84 Q88 84 90 60 Q82 74 60 74 Q38 74 30 60Z" fill={hair} {...LINE} />}
      {!masked && mouthOf(d.mouth, mood, d.facial === "beard" ? "#f5e6da" : "#3a1f1a")}
      {hp.front}
      {accessory(d.acc, accent)}
      {pale && (
        <g transform="rotate(-14 70 30)">
          <rect x="60" y="26" width="18" height="8" rx="2.5" fill="#f3d9b1" stroke="#c9a679" strokeWidth="0.8" />
          <path d="M69 27.5 L69 32.5 M66.5 30 L71.5 30" stroke="#d97373" strokeWidth="1.2" />
        </g>
      )}
      {tired && (
        <g fill="#9fb3ff" fontFamily="sans-serif" fontWeight="700">
          <text x="100" y="22" fontSize="14">
            z
          </text>
          <text x="108" y="10" fontSize="10">
            z
          </text>
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
      viewBox={portrait ? "12 -4 96 96" : "-4 -14 132 182"}
      width={portrait ? size : (size * 132) / 182}
      height={size}
      role="img"
      aria-label={title || "Boneco"}
    >
      {title && <title>{title}</title>}
      {portrait && <rect x="12" y="-4" width="96" height="96" fill={BG_COLORS[d.bg]} />}
      <DollShape cfg={d} mood={mood} energy={energy} health={health} />
    </svg>
  );
}

/* ---------------- editor ---------------- */
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
