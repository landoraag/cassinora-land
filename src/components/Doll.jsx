import { useState } from "react";
import {
  ACCESSORIES,
  BG_COLORS,
  EYES,
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

// Boneco 2D em SVG. O desenho é todo feito aqui (nada de imagem pronta):
// - mode "full": corpo inteiro (cidade, casa, ficha); "portrait": rosto e ombros, com fundo (avatar).
// - mood / energy / health mudam a carinha: humor muda a boca, pouca energia deixa os olhos
//   caídos (com "z"), saúde baixa deixa pálido e com curativo.

const INK = "#1b1b1f";

function hairParts(id, c) {
  const dark = shade(c, -0.28);
  switch (id) {
    case "short":
      return { front: <path d="M37 40 Q34 11 60 12 Q86 11 83 40 Q78 26 60 26 Q42 26 37 40Z" fill={c} /> };
    case "buzz":
      return { front: <path d="M39 36 Q41 17 60 17 Q79 17 81 36 Q72 25 60 25 Q48 25 39 36Z" fill={c} opacity="0.75" /> };
    case "long":
      return {
        back: <path d="M33 36 Q31 8 60 9 Q89 8 87 36 L90 86 Q60 96 30 86Z" fill={c} />,
        front: <path d="M37 40 Q35 12 60 12 Q85 12 83 40 Q76 24 62 22 Q48 26 37 40Z" fill={c} />,
      };
    case "bun":
      return {
        front: (
          <g>
            <circle cx="60" cy="8" r="10" fill={c} />
            <path d="M37 40 Q34 12 60 13 Q86 12 83 40 Q78 26 60 26 Q42 26 37 40Z" fill={c} />
          </g>
        ),
      };
    case "mohawk":
      return {
        front: (
          <g>
            <path d="M39 36 Q41 18 60 18 Q79 18 81 36 Q72 26 60 26 Q48 26 39 36Z" fill={c} opacity="0.3" />
            <path d="M51 26 Q48 2 60 -2 Q72 2 69 26 Q65 30 60 30 Q55 30 51 26Z" fill={c} />
          </g>
        ),
      };
    case "afro":
      return {
        back: <circle cx="60" cy="28" r="32" fill={c} />,
        front: <path d="M39 38 Q38 18 60 18 Q82 18 81 38 Q74 29 60 29 Q46 29 39 38Z" fill={dark} />,
      };
    case "pony":
      return {
        back: <path d="M80 24 Q108 26 100 62 Q97 78 88 88 Q92 62 78 44Z" fill={c} />,
        front: <path d="M37 40 Q34 11 60 12 Q86 11 83 40 Q78 26 60 26 Q42 26 37 40Z" fill={c} />,
      };
    case "bob":
      return {
        back: <path d="M33 32 Q31 8 60 9 Q89 8 87 32 L87 64 Q85 72 73 68 L47 68 Q35 72 33 64Z" fill={c} />,
        front: <path d="M35 38 Q33 11 60 11 Q87 11 85 38 L80 28 Q60 21 40 28Z" fill={c} />,
      };
    case "curly":
      return {
        back: (
          <g fill={c}>
            <circle cx="38" cy="38" r="9" />
            <circle cx="82" cy="38" r="9" />
          </g>
        ),
        front: (
          <g fill={c}>
            <circle cx="40" cy="24" r="11" />
            <circle cx="52" cy="15" r="11" />
            <circle cx="65" cy="14" r="11" />
            <circle cx="78" cy="22" r="11" />
            <circle cx="60" cy="24" r="10" />
          </g>
        ),
      };
    default:
      return {};
  }
}

function eyesOf(kind, energyLow) {
  const k = energyLow ? "sleepy" : kind;
  const lx = 51;
  const rx = 69;
  if (k === "big")
    return [lx, rx].map((x) => (
      <g key={x}>
        <ellipse cx={x} cy="42" rx="4.8" ry="5.6" fill="#fff" stroke={INK} strokeWidth="0.8" />
        <circle cx={x + 0.6} cy="42.6" r="3" fill={INK} />
        <circle cx={x + 1.6} cy="41" r="1.1" fill="#fff" />
      </g>
    ));
  if (k === "sleepy")
    return [lx, rx].map((x) => <path key={x} d={`M${x - 4.5} 42.5 Q${x} 47 ${x + 4.5} 42.5`} fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />);
  if (k === "lash")
    return [lx, rx].map((x, i) => (
      <g key={x}>
        <circle cx={x} cy="42.5" r="2.9" fill={INK} />
        <path d={i === 0 ? `M${x - 4} 40 L${x - 6.5} 37.5 M${x - 4.5} 42.5 L${x - 7.5} 42` : `M${x + 4} 40 L${x + 6.5} 37.5 M${x + 4.5} 42.5 L${x + 7.5} 42`} stroke={INK} strokeWidth="1.5" strokeLinecap="round" />
      </g>
    ));
  return [lx, rx].map((x) => <circle key={x} cx={x} cy="42.5" r="2.7" fill={INK} />);
}

function mouthOf(kind, mood, stroke) {
  let k = kind;
  if (k === "mood") k = mood >= 75 ? "grin" : mood >= 40 ? "smile" : mood >= 20 ? "flat" : "sad";
  switch (k) {
    case "grin":
      return <path d="M51 53 Q60 66 69 53 Z" fill="#fff" stroke={stroke} strokeWidth="1.8" strokeLinejoin="round" />;
    case "smile":
      return <path d="M53 55 Q60 61 67 55" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" />;
    case "flat":
      return <path d="M54 57 L66 57" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" />;
    case "sad":
      return <path d="M53 60 Q60 53 67 60" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" />;
    case "smirk":
      return <path d="M53 56 Q61 60 69 52" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" />;
    case "o":
      return <ellipse cx="60" cy="57" rx="3.4" ry="4.2" fill="#5b1d1d" stroke={stroke} strokeWidth="1.2" />;
    default:
      return null;
  }
}

function accessory(id, accent) {
  switch (id) {
    case "glasses":
      return (
        <g fill="none" stroke="#222" strokeWidth="2">
          <circle cx="51" cy="42.5" r="7.6" fill="rgba(180,220,255,0.18)" />
          <circle cx="69" cy="42.5" r="7.6" fill="rgba(180,220,255,0.18)" />
          <path d="M58.6 41.5 Q60 40 61.4 41.5" />
          <path d="M43.4 41 L38.5 39.5 M76.6 41 L81.5 39.5" />
        </g>
      );
    case "shades":
      return (
        <g>
          <rect x="42.5" y="37" width="17" height="11.5" rx="4.5" fill="#141414" />
          <rect x="60.5" y="37" width="17" height="11.5" rx="4.5" fill="#141414" />
          <path d="M59.5 41 L60.5 41" stroke="#141414" strokeWidth="2.5" />
          <path d="M42.5 40 L38 38.5 M77.5 40 L82 38.5" stroke="#141414" strokeWidth="2" />
          <path d="M46 40 L50 40 M64 40 L68 40" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      );
    case "cap":
      return (
        <g>
          <path d="M37 30 Q37 7 60 7 Q83 7 83 30 Z" fill={accent} />
          <path d="M60 8 L60 29" stroke={shade(accent, -0.25)} strokeWidth="1.5" />
          <ellipse cx="60" cy="30" rx="27" ry="4.8" fill={shade(accent, -0.3)} />
        </g>
      );
    case "hat":
      return (
        <g>
          <rect x="44" y="0" width="32" height="22" rx="3" fill="#1a1a1a" />
          <rect x="44" y="14" width="32" height="5" fill={accent} />
          <ellipse cx="60" cy="22" rx="30" ry="5.5" fill="#1a1a1a" />
        </g>
      );
    case "crown":
      return (
        <g>
          <path d="M41 24 L44 5 L53 15 L60 1 L67 15 L76 5 L79 24Z" fill="#facc15" stroke="#ca8a04" strokeWidth="1.4" strokeLinejoin="round" />
          <circle cx="60" cy="10" r="2" fill="#ef4444" />
          <circle cx="47" cy="16" r="1.5" fill="#3b82f6" />
          <circle cx="73" cy="16" r="1.5" fill="#22c55e" />
        </g>
      );
    case "phones":
      return (
        <g>
          <path d="M37 40 Q37 7 60 7 Q83 7 83 40" fill="none" stroke="#222" strokeWidth="4.5" strokeLinecap="round" />
          <rect x="30.5" y="34" width="9" height="16" rx="4.5" fill={accent} stroke="#222" strokeWidth="1.5" />
          <rect x="80.5" y="34" width="9" height="16" rx="4.5" fill={accent} stroke="#222" strokeWidth="1.5" />
        </g>
      );
    case "bandana":
      return (
        <g>
          <path d="M37 29 Q60 17 83 29 L83 36 Q60 26 37 36Z" fill={accent} />
          <path d="M83 30 L92 26 L90 36Z" fill={shade(accent, -0.2)} />
          <circle cx="52" cy="29" r="1.2" fill="rgba(255,255,255,0.7)" />
          <circle cx="62" cy="27.5" r="1.2" fill="rgba(255,255,255,0.7)" />
          <circle cx="72" cy="29" r="1.2" fill="rgba(255,255,255,0.7)" />
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
  const HAIR_ALIAS = { messy: "short", spiky: "short", wild: "short", fluffy: "curly", bowl: "bob" };
  const hp = hairParts(HAIR_ALIAS[d.hair] || d.hair, hair);
  const brow = d.hair === "none" ? "#3b2417" : shade(hair, -0.2);
  const pale = health < 30;
  const tired = energy < 15;
  const beard = d.facial === "beard";
  const dress = d.outfit === "dress";
  const longSleeve = ["hoodie", "jacket", "suit", "coat"].includes(d.outfit);
  const sleeve = d.outfit === "coat" ? "#f7f9ff" : d.outfit === "suit" ? shade(accent, -0.3) : accent;

  return (
    <g className="doll-body">
      <ellipse cx="60" cy="163" rx="27" ry="5" fill="rgba(0,0,0,0.28)" />

      {hp.back}

      {/* pernas e sapatos */}
      <g className="legL">
        <rect x="45" y="110" width="13" height="42" rx="5.5" fill={dress ? skin : pants} />
        <rect x="42" y="150" width="19" height="10" rx="5" fill={shoe} />
      </g>
      <g className="legR">
        <rect x="62" y="110" width="13" height="42" rx="5.5" fill={dress ? skin : pants} />
        <rect x="59" y="150" width="19" height="10" rx="5" fill={shoe} />
      </g>

      {/* braços */}
      <g className="armL">
        <rect x="28.5" y="72" width="12" height={longSleeve ? 36 : 22} rx="6" fill={sleeve} />
        {!longSleeve && <rect x="28.5" y="88" width="12" height="18" rx="6" fill={skin} />}
        <circle cx="34.5" cy="108.5" r="6" fill={skin} />
      </g>
      <g className="armR">
        <rect x="79.5" y="72" width="12" height={longSleeve ? 36 : 22} rx="6" fill={sleeve} />
        {!longSleeve && <rect x="79.5" y="88" width="12" height="18" rx="6" fill={skin} />}
        <circle cx="85.5" cy="108.5" r="6" fill={skin} />
        {tool && (
          <text x="86" y="116" fontSize="22" textAnchor="middle">
            {tool}
          </text>
        )}
      </g>

      {/* pescoço e tronco */}
      <rect x="53" y="60" width="14" height="16" rx="4" fill={skinDark} />
      {d.outfit === "hoodie" && <path d="M42 72 Q60 56 78 72 Q78 82 60 86 Q42 82 42 72Z" fill={accentDark} />}
      {d.outfit === "dress" && <path d="M38 100 L28 140 L92 140 L82 100Z" fill={accent} />}
      <rect x="38" y="70" width="44" height="46" rx="9" fill={d.outfit === "coat" ? "#f7f9ff" : d.outfit === "suit" ? shade(accent, -0.3) : accent} />
      {d.outfit === "tee" && <path d="M51 70 Q60 82 69 70Z" fill={skinDark} />}
      {d.outfit === "hoodie" && (
        <g>
          <rect x="48" y="98" width="24" height="12" rx="5" fill={accentDark} />
          <path d="M55 78 L55 92 M65 78 L65 92" stroke="rgba(255,255,255,0.8)" strokeWidth="1.6" strokeLinecap="round" />
        </g>
      )}
      {d.outfit === "suit" && (
        <g>
          <path d="M50 70 L60 94 L70 70Z" fill="#fff" />
          <path d="M57.5 74 L62.5 74 L63.5 92 L60 97 L56.5 92Z" fill="#dc2626" />
          <path d="M50 70 L58 94 M70 70 L62 94" stroke="rgba(0,0,0,0.35)" strokeWidth="1.6" />
          <circle cx="60" cy="104" r="1.4" fill="rgba(255,255,255,0.7)" />
        </g>
      )}
      {d.outfit === "dress" && (
        <g>
          <path d="M51 70 Q60 80 69 70Z" fill={skinDark} />
          <rect x="38" y="96" width="44" height="5" fill={accentDark} />
        </g>
      )}
      {d.outfit === "coat" && (
        <g>
          <path d="M51 70 L60 92 L69 70Z" fill={accent} />
          <path d="M60 92 L60 116" stroke="#cbd5e1" strokeWidth="1.6" />
          <rect x="66" y="94" width="10" height="9" rx="2" fill="none" stroke="#cbd5e1" strokeWidth="1.4" />
          <path d="M70 94 L70 90" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
          <circle cx="60" cy="100" r="1.3" fill="#94a3b8" />
          <circle cx="60" cy="108" r="1.3" fill="#94a3b8" />
        </g>
      )}
      {d.outfit === "apron" && (
        <g>
          <path d="M45 86 L75 86 L78 116 L42 116Z" fill="#f8fafc" />
          <path d="M46 86 L53 70 M74 86 L67 70" stroke="#f8fafc" strokeWidth="3" strokeLinecap="round" />
          <rect x="53" y="98" width="14" height="8" rx="2" fill="none" stroke="#cbd5e1" strokeWidth="1.3" />
        </g>
      )}

      {/* cabeça */}
      <circle cx="38" cy="43" r="4.8" fill={skin} />
      <circle cx="82" cy="43" r="4.8" fill={skin} />
      <ellipse cx="60" cy="40" rx="22" ry="24" fill={skin} />
      {pale && <ellipse cx="60" cy="40" rx="22" ry="24" fill="#8fd3a4" opacity="0.28" />}
      {hp.front}
      <path d="M45 35 Q51 31.5 57 34.5 M63 34.5 Q69 31.5 75 35" fill="none" stroke={brow} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M60 44 Q57.5 51 61.5 51" fill="none" stroke={skinDark} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="44.5" cy="51" r="3.6" fill="#ff6b6b" opacity="0.2" />
      <circle cx="75.5" cy="51" r="3.6" fill="#ff6b6b" opacity="0.2" />
      {eyesOf(d.eyes === "sharp" ? "dot" : d.eyes, tired)}
      {d.facial === "mustache" && <path d="M51 53 Q55.5 49.5 60 52.5 Q64.5 49.5 69 53 Q64 57 60 54.5 Q56 57 51 53Z" fill={hair} />}
      {beard && <path d="M39 46 Q39 70 60 72 Q81 70 81 46 Q75 60 60 60 Q45 60 39 46Z" fill={hair} />}
      {mouthOf(d.mouth, mood, beard ? "#f5e6da" : "#3a1f1a")}
      {accessory(d.acc, accent)}
      {pale && (
        <g transform="rotate(-14 66 24)">
          <rect x="58" y="20" width="16" height="7" rx="2.5" fill="#f3d9b1" stroke="#c9a679" strokeWidth="0.8" />
          <path d="M66 21.5 L66 25.5 M64 23.5 L68 23.5" stroke="#d97373" strokeWidth="1.2" />
        </g>
      )}
      {tired && (
        <g fill="#9fb3ff" fontFamily="sans-serif" fontWeight="700">
          <text x="86" y="16" fontSize="14">
            z
          </text>
          <text x="95" y="6" fontSize="10">
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
      viewBox={portrait ? "18 -2 84 84" : "0 -14 120 180"}
      width={portrait ? size : (size * 120) / 180}
      height={size}
      role="img"
      aria-label={title || "Boneco"}
    >
      {title && <title>{title}</title>}
      {portrait && <rect x="18" y="-2" width="84" height="84" fill={BG_COLORS[d.bg]} />}
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
            <Options options={ACCESSORIES} field="acc" value={cfg.acc} cfg={cfg} onChange={set("acc")} label="Acessório" locks={accLocks} />
            <Swatches list={BG_COLORS} value={cfg.bg} onChange={set("bg")} label="Fundo do avatar" />
          </>
        )}
      </div>
    </div>
  );
}
