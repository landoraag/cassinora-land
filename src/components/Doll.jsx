import { useId, useState } from "react";
import {
  ACCESSORIES, BG_COLORS, BOTTOMS, EXTRAS, EYES, EYE_COLORS, FACIALS, FURS, HAIRS, HAIR_COLORS, MOUTHS,
  OUTFITS, OUTFIT_COLORS, PANTS_COLORS, SHOE_COLORS, SKINS, SPECIES, cleanDoll, randomDoll, shade,
} from "../lib/doll";

// Boneco 2D estilo cartum: contorno preto grosso, cores chapadas com uma faixa de sombra, roupa folgada
// (moletom, camiseta larga, calça cargo, tênis grandão), olhos com pálpebra "de tédio" e, se quiser,
// vira bicho (lobo, coelho, gato) com patas enormes. Tudo SVG; pés em y=153, centro em x=60.
//  - mode "full": corpo inteiro · "portrait": rosto e ombros com fundo (avatar).

const INK = "#17110d";
const L = (w = 3.2) => ({ stroke: INK, strokeWidth: w, strokeLinejoin: "round", strokeLinecap: "round" });
const thin = { stroke: INK, strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round", fill: "none" };
const HEAD_D = "M29 36 C29 14 43 7 60 7 C77 7 91 14 91 36 C91 54 80 68 60 68 C40 68 29 54 29 36Z";
const mirror = "translate(120 0) scale(-1 1)";
const isDark = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) * 0.3 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11) < 110;
};

/* ---------- cabelo ---------- */
function hairParts(id, c) {
  const dark = shade(c, -0.28);
  const hl = shade(c, 0.42);
  const P = (d, extra) => <path d={d} fill={c} {...L()} {...extra} />;
  const shine = (d) => <path d={d} fill="none" stroke={hl} strokeWidth="3.2" strokeLinecap="round" opacity=".55" />;
  const strand = (d) => <path d={d} {...thin} stroke={dark} strokeWidth="1.5" />;
  const shadeBand = (d) => <path d={d} fill={dark} opacity=".45" />;
  switch (id) {
    case "short":
      return { front: <g>{P("M27 40 C21 12 40 -3 62 0 C84 0 99 14 93 42 C90 28 84 20 74 17 C62 23 42 21 34 29 C30 33 28 37 27 40Z")}{shadeBand("M70 3 C86 6 96 18 93 40 C90 28 84 20 74 17Z")}{shine("M40 8 Q52 1 66 4")}{strand("M52 6 Q58 12 58 19 M64 5 Q70 10 72 16")}</g> };
    case "messy":
      return { front: <g>{P("M27 42 L21 30 L30 28 L26 12 L38 19 L40 4 L50 14 L58 -2 L66 13 L78 3 L80 18 L92 11 L89 28 L99 29 L93 42 C90 32 84 25 76 23 L67 31 L59 23 L50 31 L41 23 C33 27 29 34 27 42Z")}{shine("M38 14 Q46 8 52 12 M68 11 Q78 7 84 14")}{strand("M58 4 L58 14 M44 12 L48 20")}</g> };
    case "spiky":
      return { front: <g>{P("M27 44 L18 32 L29 31 L21 14 L36 22 L36 2 L47 15 L57 -10 L67 15 L80 2 L82 22 L98 14 L91 31 L102 32 L93 44 C90 33 84 27 76 25 L68 34 L60 25 L51 34 L43 25 C34 29 29 36 27 44Z")}{shine("M40 14 L44 22 M60 -2 L60 12 M80 14 L76 22")}</g> };
    case "wild":
      return {
        front: (
          <g>
            {P("M26 46 L19 32 L30 31 L22 14 L36 21 L37 3 L48 15 L58 -8 L68 15 L81 3 L82 21 L97 14 L91 31 L102 32 L94 46 C91 34 85 27 77 25 L69 35 L60 25 L51 36 L43 26 C34 30 29 38 26 46Z")}
            {P("M31 28 C28 44 30 58 36 66 C40 54 40 38 38 28Z")}
            {P("M82 28 C86 44 84 56 78 62 C76 52 78 38 80 28Z")}
            {shine("M42 12 Q54 4 66 12")}
          </g>
        ),
      };
    case "fluffy":
    case "curly": {
      const cs = [[30, 28, 13], [40, 12, 14], [58, 6, 15], [77, 12, 14], [90, 28, 13], [46, 24, 11], [70, 24, 11]];
      return {
        back: <g>{cs.slice(0, 5).map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill={dark} {...L()} />)}</g>,
        front: <g>{cs.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill={c} {...L()} />)}{cs.map(([x, y, r], i) => <circle key={"f" + i} cx={x} cy={y} r={r - 1.6} fill={c} />)}{shine("M36 8 Q48 2 58 4 M70 10 Q80 8 86 16")}</g>,
      };
    }
    case "bowl":
      return { back: <path d="M26 40 C20 4 100 4 94 40 L96 62 Q90 68 86 62 L34 62 Q30 68 24 62Z" fill={dark} {...L()} />, front: <g>{P("M26 46 C18 -2 102 -2 94 46 L91 31 C76 28 44 28 29 31Z")}{shine("M38 8 Q60 0 82 8")}{strand("M44 16 L44 27 M60 14 L60 27 M76 16 L76 27")}</g> };
    case "buzz":
      return { front: <path d="M30 32 C28 12 44 8 60 8 C76 8 92 12 90 32 C84 22 72 17 60 17 C48 17 36 22 30 32Z" fill={c} opacity=".9" stroke={INK} strokeWidth="2" /> };
    case "long":
      return { back: <path d="M25 40 C18 2 102 2 95 40 L102 98 Q60 110 18 98Z" fill={dark} {...L()} />, front: <g>{P("M26 46 C20 10 40 -2 62 0 C84 0 100 12 94 46 C92 32 86 22 74 18 C62 26 42 22 34 30 C30 36 27 40 26 46Z")}{shine("M40 8 Q54 1 68 4")}{strand("M30 44 Q28 70 32 90 M90 44 Q92 70 88 90")}</g> };
    case "pony":
      return { back: <path d="M84 14 C120 6 118 58 102 80 C100 64 100 44 90 32Z" fill={dark} {...L()} />, front: <g>{P("M27 40 C21 12 40 -3 62 0 C84 0 99 14 93 42 C90 28 84 20 74 17 C62 23 42 21 34 29 C30 33 28 37 27 40Z")}{shine("M40 8 Q52 1 66 4")}</g> };
    case "bun":
      return { front: <g><circle cx="60" cy="-4" r="13" fill={c} {...L()} />{P("M27 40 C21 12 40 2 62 3 C84 3 99 14 93 42 C90 28 84 20 74 17 C62 23 42 21 34 29 C30 33 28 37 27 40Z")}{shine("M40 10 Q52 4 66 6")}</g> };
    case "bob":
      return { back: <path d="M25 38 C18 0 102 0 95 38 L98 78 Q88 86 80 76 L40 76 Q32 86 22 78Z" fill={dark} {...L()} />, front: <g>{P("M26 46 C18 4 102 4 94 46 C92 30 80 22 60 22 C40 22 28 30 26 46Z")}{shine("M38 10 Q60 2 82 10")}</g> };
    case "mohawk":
      return { front: <g><path d="M30 34 C30 14 90 14 90 34 C82 24 38 24 30 34Z" fill={dark} opacity=".6" /><path d="M48 24 L43 -4 L53 6 L60 -16 L67 6 L77 -4 L72 24Z" fill={c} {...L()} />{shine("M60 -6 L60 14")}</g> };
    case "dreads":
      return { back: <g>{[30, 38, 82, 90].map((x, i) => <path key={i} d={`M${x - 4} 30 L${x - 4} ${70 + (i % 2) * 8} Q${x} ${78 + (i % 2) * 8} ${x + 4} ${70 + (i % 2) * 8} L${x + 4} 30Z`} fill={dark} {...L()} />)}</g>, front: <g>{P("M27 40 C21 12 40 -3 62 0 C84 0 99 14 93 42 C90 28 84 20 74 17 C62 23 42 21 34 29 C30 33 28 37 27 40Z")}{shine("M40 8 Q52 1 66 4")}{strand("M36 12 L40 22 M50 6 L52 18 M66 6 L66 18 M80 12 L76 22")}</g> };
    case "twintails":
      return { back: <g><path d="M32 22 C4 16 2 66 18 90 C22 70 28 52 34 40Z" fill={dark} {...L()} /><path d="M88 22 C116 16 118 66 102 90 C98 70 92 52 86 40Z" fill={dark} {...L()} /></g>, front: <g>{P("M27 40 C21 12 40 -3 62 0 C84 0 99 14 93 42 C90 28 84 20 74 17 C62 23 42 21 34 29 C30 33 28 37 27 40Z")}{shine("M40 8 Q52 1 66 4")}<circle cx="31" cy="26" r="4.5" fill="#ef4444" {...L(2.2)} /><circle cx="89" cy="26" r="4.5" fill="#ef4444" {...L(2.2)} /></g> };
    case "undercut":
      return { front: <g>{P("M29 38 C24 8 52 -12 82 -4 C100 2 98 24 91 38 C89 26 81 17 70 14 C56 12 40 18 34 30Z")}<path d="M29 38 C28 28 31 20 36 16 C34 24 34 32 36 40Z" fill={dark} opacity=".5" />{shine("M44 4 Q62 -4 84 2")}{strand("M54 6 Q66 4 78 8 M48 12 Q60 8 72 12")}</g> };
    case "braid":
      return { back: <g>{[0, 1, 2, 3, 4].map((i) => <ellipse key={i} cx={88 + i * 2.5} cy={56 + i * 10} rx="6.5" ry="6" fill={dark} {...L(2.6)} />)}<circle cx="97" cy="104" r="3.4" fill="#ef4444" {...L(2)} /></g>, front: <g>{P("M27 40 C21 12 40 -3 62 0 C84 0 99 14 93 42 C90 28 84 20 74 17 C62 23 42 21 34 29 C30 33 28 37 27 40Z")}{shine("M40 8 Q52 1 66 4")}</g> };

    case "afro":
      return { back: <circle cx="60" cy="26" r="46" fill={dark} {...L()} />, front: <g><path d="M28 40 C26 10 94 10 92 40 C84 24 36 24 28 40Z" fill={c} {...L(2.4)} />{shine("M38 12 Q60 4 82 12")}</g> };
    default:
      return {};
  }
}

/* ---------- olhos, sobrancelhas, boca ---------- */
function Eyes({ kind, skin, mood, tired, brow, animal }) {
  const a = mood < 25 ? 3 : mood > 75 ? -1.5 : 0.5;
  return (
    <g>
      {[47, 73].map((x, i) => {
        const flip = i === 1;
        const d = flip ? -1 : 1;
        const px = x + d * 1.8;
        if (tired)
          return <path key={x} d={`M${x - 8} 38 Q${x} 45 ${x + 8} 38`} fill="none" {...L(3)} />;
        if (kind === "dot")
          return (
            <g key={x}>
              <ellipse cx={x} cy="38" rx="4" ry="5" fill="#111" />
              <circle cx={x - 1.2} cy="36" r="1.4" fill="#fff" />
            </g>
          );
        const lid = kind === "sharp" ? 37 : kind === "sleepy" ? 41 : 0;
        return (
          <g key={x}>
            <ellipse cx={x} cy="38" rx="8.6" ry="9" fill="#fff" {...L(2.8)} />
            <circle cx={px} cy="39" r="4.8" fill="#111" />
            <circle cx={px - 1.5} cy="37" r="1.7" fill="#fff" />
            {lid > 0 && (
              <g>
                <path d={`M${x - 8.6} 38 A8.6 9 0 0 1 ${x + 8.6} 38 L${x + 8.6} ${lid + d * 1.2} L${x - 8.6} ${lid - d * 1.2}Z`} fill={skin} />
                <path d={`M${x - 8.8} ${lid - d * 1.2} L${x + 8.8} ${lid + d * 1.2}`} {...L(2.8)} />
                <path d={`M${x - 8.6} 38 A8.6 9 0 0 1 ${x + 8.6} 38`} fill="none" {...L(2.8)} />
              </g>
            )}
            {kind === "lash" && <path d={`M${x + d * 8} 32 l${d * 5} -3 M${x + d * 9} 36 l${d * 5} -1`} {...thin} strokeWidth="2.2" />}
          </g>
        );
      })}
      {!animal && (
        <g stroke={brow} strokeWidth="3.8" strokeLinecap="round" fill="none">
          <path d={`M38 ${25 + a} L55 ${27 - a}`} transform={`rotate(${mood < 25 ? 6 : mood > 75 ? -4 : 0} 47 26)`} />
          <path d={`M65 ${27 - a} L82 ${25 + a}`} transform={`rotate(${mood < 25 ? -6 : mood > 75 ? 4 : 0} 73 26)`} />
        </g>
      )}
    </g>
  );
}

function mouthOf(kind, mood) {
  let k = kind;
  if (k === "mood") k = mood >= 75 ? "grin" : mood >= 40 ? "smile" : mood >= 20 ? "flat" : "sad";
  switch (k) {
    case "grin":
      return <g><path d="M49 53 Q60 66 71 53 Q60 51 49 53Z" fill="#fff" {...L(2.6)} /><path d="M49 53 Q60 66 71 53" fill="none" {...L(2.6)} /><path d="M54 59 Q60 63 66 59" fill="#e86b7c" stroke="none" /></g>;
    case "smile":
      return <path d="M51 54 Q60 61 69 54" fill="none" {...L(2.8)} />;
    case "flat":
      return <path d="M53 57 L67 57" fill="none" {...L(2.8)} />;
    case "sad":
      return <path d="M52 59 Q60 52 68 59" fill="none" {...L(2.8)} />;
    case "smirk":
      return <path d="M51 56 Q61 61 70 52" fill="none" {...L(2.8)} />;
    case "o":
      return <ellipse cx="60" cy="57" rx="4.4" ry="5.6" fill="#7a1f2b" {...L(2.6)} />;
    default:
      return null;
  }
}

/* ---------- acessórios (na cabeça nova: topo y=7, olhos y=38) ---------- */
function accessory(id, accent) {
  const A = (c) => ({ fill: c, ...L() });
  switch (id) {
    case "glasses":
      return (
        <g fill="none" {...L(2.8)}>
          <rect x="35" y="29" width="22" height="18" rx="6" fill="rgba(190,225,255,.25)" />
          <rect x="63" y="29" width="22" height="18" rx="6" fill="rgba(190,225,255,.25)" />
          <path d="M57 36 Q60 33 63 36 M35 34 L29 32 M85 34 L91 32" />
        </g>
      );
    case "shades":
      return (
        <g>
          <path d="M33 29 H87 L84 42 Q82 47 76 47 H68 Q62 47 61 40 H59 Q58 47 52 47 H44 Q38 47 36 42Z" fill="#1a1a1f" {...L(3)} />
          <path d="M38 33 L49 33 L45 42 L38 42Z M69 33 L80 33 L76 42 L69 42Z" fill="rgba(255,255,255,.28)" />
          <path d="M33 31 L26 28 M87 31 L94 28" {...thin} strokeWidth="3" />
        </g>
      );
    case "cap":
      return (
        <g>
          <path d="M28 28 C26 2 94 2 92 28Z" {...A(accent)} />
          <path d="M60 4 V27" {...thin} />
          <path d="M24 29 Q60 36 100 30 Q98 20 88 24 Q60 28 30 24Z" {...A(shade(accent, -0.25))} />
        </g>
      );
    case "hat":
      return (
        <g>
          <rect x="39" y="-18" width="42" height="34" rx="5" {...A("#1c1c20")} />
          <rect x="39" y="4" width="42" height="7" fill={accent} stroke={INK} strokeWidth="2" />
          <ellipse cx="60" cy="16" rx="40" ry="7" {...A("#1c1c20")} />
        </g>
      );
    case "crown":
      return (
        <g>
          <path d="M33 14 L34 -10 L47 2 L60 -14 L73 2 L86 -10 L87 14Z" {...A("#facc15")} />
          <circle cx="60" cy="1" r="3" fill="#ef4444" stroke={INK} strokeWidth="1.5" />
        </g>
      );
    case "phones":
      return (
        <g>
          <path d="M29 36 C26 -4 94 -4 91 36" fill="none" {...L(5)} />
          <rect x="21" y="30" width="13" height="22" rx="6" {...A(accent)} />
          <rect x="86" y="30" width="13" height="22" rx="6" {...A(accent)} />
        </g>
      );
    case "bandana":
      return (
        <g>
          <path d="M28 24 Q60 10 92 24 L92 34 Q60 20 28 34Z" {...A(accent)} />
          <path d="M92 26 L108 20 L104 38Z" {...A(shade(accent, -0.2))} />
          {[42, 58, 74].map((x) => <circle key={x} cx={x} cy="21" r="1.8" fill="#fff" opacity=".8" />)}
        </g>
      );
    case "headband":
      return (
        <g>
          <path d="M28 22 Q60 10 92 22 L92 32 Q60 20 28 32Z" {...A("#1f2937")} />
          <rect x="44" y="16" width="32" height="14" rx="3" fill="#cfd6e0" {...L(2.4)} />
          <path d="M60 23 m-4 0 a4 4 0 1 1 4 4 q-2 -2 0 -4" fill="none" {...thin} />
          <path d="M92 26 L106 34 L102 46 M92 30 L104 50" fill="none" {...L(4)} />
        </g>
      );
    case "beret":
      return (
        <g>
          <path d="M22 28 C14 -6 52 -18 80 -10 C108 -4 104 20 98 28 Q60 20 22 28Z" {...A(accent)} />
          <path d="M22 28 Q60 18 98 28 L98 33 Q60 24 22 33Z" {...A("#26262c")} />
          <path d="M50 -2 L70 -2 L60 14Z" fill="#c9a227" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
        </g>
      );
    case "scarf":
      return (
        <g>
          <path d="M42 70 Q60 82 78 70 L81 82 Q60 94 39 82Z" fill={accent} {...L()} />
          <path d="M66 86 L74 112 L62 114 L58 90Z" fill={accent} {...L()} />
          <path d="M44 76 Q60 88 76 76 M64 98 L68 98 M62 104 L70 104" {...thin} stroke={shade(accent, -0.4)} strokeWidth="1.6" />
        </g>
      );
    case "backpack":
      return <path d="M43 76 L40 100 M77 76 L80 100" fill="none" stroke={INK} strokeWidth="8" strokeLinecap="round" />;
    case "flower":
      return (
        <g transform="translate(84 16)">
          {[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx="0" cy="-6.5" rx="4.6" ry="6.6" fill="#f472b6" {...L(1.8)} transform={`rotate(${a})`} />)}
          <circle r="3.6" fill="#facc15" {...L(1.6)} />
        </g>
      );
    case "eyepatch":
      return (
        <g>
          <path d="M30 28 L90 24" fill="none" {...L(3)} />
          <ellipse cx="47" cy="38" rx="11" ry="10.5" fill="#1a1a1f" {...L(2.6)} />
          <path d="M42 33 L50 34" stroke="#fff" strokeWidth="1.6" opacity=".35" strokeLinecap="round" />
        </g>
      );
    case "mask":
      return <path d="M32 44 Q60 60 88 44 Q92 70 60 74 Q28 70 32 44Z" {...A("#2b3a4d")} />;
    default:
      return null;
  }
}

/* ---------- bichos: orelhas, focinho, rabo ---------- */
function animalEars(sp, fur, inner) {
  if (sp === "fox")
    return (
      <g>
        <path d="M32 26 L24 -16 L54 10Z" fill={fur} {...L()} />
        <path d="M35 18 L31 -2 L47 11Z" fill="#2b2420" />
        <path d="M88 26 L96 -16 L66 10Z" fill={fur} {...L()} />
        <path d="M85 18 L89 -2 L73 11Z" fill="#2b2420" />
      </g>
    );
  if (sp === "bear" || sp === "panda")
    return (
      <g>
        <circle cx="35" cy="14" r="10.5" fill={sp === "panda" ? "#26262b" : fur} {...L()} />
        <circle cx="35" cy="15" r="5" fill={sp === "panda" ? "#3a3a42" : inner} />
        <circle cx="85" cy="14" r="10.5" fill={sp === "panda" ? "#26262b" : fur} {...L()} />
        <circle cx="85" cy="15" r="5" fill={sp === "panda" ? "#3a3a42" : inner} />
      </g>
    );
  if (sp === "dog")
    return (
      <g>
        <path d="M31 20 C10 18 8 54 24 62 C34 52 34 34 33 22Z" fill={shade(fur, -0.25)} {...L()} />
        <path d="M89 20 C110 18 112 54 96 62 C86 52 86 34 87 22Z" fill={shade(fur, -0.25)} {...L()} />
      </g>
    );
  if (sp === "wolf")
    return (
      <g>
        <path d="M33 26 L28 -8 L52 12Z" fill={fur} {...L()} />
        <path d="M35 18 L33 2 L46 12Z" fill={inner} />
        <path d="M87 26 L92 -8 L68 12Z" fill={fur} {...L()} />
        <path d="M85 18 L87 2 L74 12Z" fill={inner} />
      </g>
    );
  if (sp === "rabbit")
    return (
      <g>
        <g transform="rotate(-8 42 14)"><path d="M36 16 C24 -6 28 -34 40 -38 C52 -34 52 -6 48 16Z" fill={fur} {...L()} /><path d="M39 12 C33 -4 34 -26 40 -31 C46 -26 46 -4 44 12Z" fill={inner} /></g>
        <g transform="rotate(14 80 14)"><path d="M72 16 C68 -6 68 -34 80 -38 C92 -34 96 -6 84 16Z" fill={fur} {...L()} /><path d="M75 12 C73 -4 74 -26 80 -31 C86 -26 87 -4 82 12Z" fill={inner} /></g>
      </g>
    );
  return (
    <g>
      <path d="M31 28 L29 -2 L54 12Z" fill={fur} {...L()} />
      <path d="M34 20 L33 4 L46 12Z" fill={inner} />
      <path d="M89 28 L91 -2 L66 12Z" fill={fur} {...L()} />
      <path d="M86 20 L87 4 L74 12Z" fill={inner} />
    </g>
  );
}
function animalTail(sp, fur, light) {
  if (sp === "fox")
    return <g><path d="M42 108 C16 114 -2 94 4 60 C12 78 24 80 32 76 C30 92 38 98 46 100Z" fill={fur} {...L()} /><path d="M4 60 C8 72 14 78 22 80 C14 74 10 68 4 60Z" fill="#fff" {...L(1.6)} /></g>;
  if (sp === "dog")
    return <path d="M44 108 C22 110 12 94 18 76 C24 84 34 90 46 96Z" fill={fur} {...L()} />;
  if (sp === "bear" || sp === "panda") return <circle cx="36" cy="112" r="8" fill={sp === "panda" ? "#f6f3ec" : fur} {...L()} />;
  if (sp === "wolf")
    return <g><path d="M42 108 C20 112 2 98 6 66 C12 80 22 82 30 78 C30 92 38 98 46 100Z" fill={fur} {...L()} /><path d="M6 66 C10 76 16 80 22 81 C16 76 12 72 6 66Z" fill={light} /></g>;
  if (sp === "rabbit") return <circle cx="34" cy="110" r="10" fill="#f6f3ec" {...L()} />;
  return <g><path d="M44 106 C20 110 6 96 14 70" fill="none" stroke={INK} strokeWidth="13" strokeLinecap="round" /><path d="M44 106 C20 110 6 96 14 70" fill="none" stroke={fur} strokeWidth="7" strokeLinecap="round" /></g>;
}
function animalFace(sp, fur, light) {
  return (
    <g>
      {sp === "panda" && <g fill="#26262b"><ellipse cx="46" cy="38" rx="11" ry="13" transform="rotate(25 46 38)" /><ellipse cx="74" cy="38" rx="11" ry="13" transform="rotate(-25 74 38)" /></g>}
      <ellipse cx="60" cy="56" rx="18" ry="12" fill={light} {...L(2.4)} />
      <path d="M52 47 Q60 43 68 47 Q66 54 60 55 Q54 54 52 47Z" fill="#1c1c22" {...L(2.2)} />
      <path d="M56 47 Q58 45.5 61 46" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity=".6" fill="none" />
      <path d="M60 55 V58 M60 58 Q54 64 48 59 M60 58 Q66 64 72 59" {...thin} strokeWidth="2.2" />
      {sp === "rabbit" && <rect x="57" y="59" width="6" height="7" rx="1.5" fill="#fff" {...L(1.8)} />}
      {sp !== "bear" && sp !== "panda" && <path d="M44 54 L24 50 M44 58 L24 60 M76 54 L96 50 M76 58 L96 60" {...thin} strokeWidth="1.3" />}
      {sp === "dog" && <path d="M57 60 Q60 72 63 60Z" fill="#f06a7c" {...L(1.8)} />}
      {sp === "fox" && <path d="M29 44 L19 50 L30 54 L23 61 L36 60 M91 44 L101 50 L90 54 L97 61 L84 60" fill="#fff" {...L(2.4)} />}
      {sp === "cat" && <path d="M52 14 V22 M60 12 V21 M68 14 V22" {...thin} stroke={shade(fur, -0.4)} strokeWidth="2.4" />}
      {sp === "wolf" && <path d="M29 44 L21 48 L30 52 L23 58 L33 58 M91 44 L99 48 L90 52 L97 58 L87 58" fill={fur} {...L(2.4)} />}
    </g>
  );
}

/* ---------- o boneco ---------- */
export function DollShape({ cfg, mood = 60, energy = 100, health = 100, tool }) {
  const uid = useId().replace(/:/g, "");
  const d = cleanDoll(cfg);
  const animal = d.species !== "human";
  const skin = animal ? (d.species === "panda" ? "#f6f3ec" : FURS[d.skin]) : SKINS[d.skin];
  const limb = d.species === "panda" ? "#26262b" : skin;
  const skinDark = shade(skin, -0.22);
  const light = animal ? (d.species === "rabbit" || d.species === "panda" ? "#f6f3ec" : shade(skin, 0.55)) : skin;
  const hair = HAIR_COLORS[d.hairColor];
  const accent = OUTFIT_COLORS[d.outfitColor];
  const pants = PANTS_COLORS[d.pants];
  const shoe = SHOE_COLORS[d.shoes];
  const hp = animal ? {} : hairParts(d.hair, hair);
  const brow = animal ? skinDark : shade(hair, -0.2);
  const pale = health < 30;
  const tired = energy < 15;
  const hooded = d.acc === "hood" && !animal;
  const ninja = d.acc === "ninja" && !animal;
  const outfit = d.outfit;
  const dress = outfit === "dress";
  const longSleeve = ["hoodie", "jacket", "suit", "coat", "varsity", "track"].includes(outfit);
  const noSleeve = outfit === "tank";
  const main = outfit === "coat" ? "#f4f7ff" : outfit === "suit" ? shade(accent, -0.4) : accent;
  const mainDark = shade(main, -0.2);
  const sleeveC = outfit === "varsity" ? "#f3f1ea" : main;
  const earring = d.extra === "earring" || d.extra === "both";
  const necklace = d.extra === "necklace" || d.extra === "both";
  const pantsC = pants;
  const lace = isDark(shoe) ? "#e5e7eb" : "#6b7280";
  const sole = "#f3f1ea";
  const id = (n) => `${n}${uid}`;

  // meio corpo (lado esquerdo); o direito é o espelho dele
  const leg = (
    <g>
      {d.bottom === "shorts" || dress ? (
        <g>
          <path d="M42 124 L53 124 L52 144 L43 144Z" fill={skin} {...L(2.8)} />
          {!dress && <path d="M33 108 L59 108 L58 130 Q46 134 34 130Z" fill={pantsC} {...L()} />}
        </g>
      ) : (
        <g>
          <path d="M34 108 L59 108 L58 134 L55 143 L33 143 L31 134Z" fill={pantsC} {...L()} />
          <path d="M52 112 Q56 124 54 138" {...thin} stroke={shade(pantsC, -0.35)} strokeWidth="1.4" opacity=".7" />
          <path d="M31 134 L58 134" {...thin} stroke={shade(pantsC, -0.4)} />
          {d.bottom === "cargo" && (
            <g>
              <rect x="31" y="114" width="12" height="15" rx="2" fill={shade(pantsC, 0.1)} {...L(2.2)} />
              <path d="M31 119 L43 119" {...thin} strokeWidth="1.3" />
            </g>
          )}
          {d.bottom === "jeans" && <path d="M36 116 L36 140 M56 116 L56 140" {...thin} stroke={shade(pantsC, 0.35)} strokeWidth="1.2" strokeDasharray="3 3" />}
        </g>
      )}
      {animal ? (
        <g>
          <ellipse cx="38" cy="148" rx="21" ry="8" fill={d.species === "panda" ? "#26262b" : light} {...L()} />
          <path d="M26 144 Q26 149 28 152 M33 142 Q33 148 34 153 M41 142 Q41 148 41 153" {...thin} strokeWidth="1.6" />
        </g>
      ) : (
        <g>
          <path d="M22 142 Q22 133 33 133 L50 133 Q60 133 61 142 L62 148 L22 148Z" fill={shoe} {...L()} />
          <rect x="35" y="130" width="12" height="5" rx="2" fill={shade(shoe, 0.18)} {...L(1.8)} /><path d="M24 143 Q30 137 38 141" {...thin} stroke={shade(shoe, -0.45)} strokeWidth="1.4" /><path d="M34 136 L46 136 M34 139.5 L46 139.5 M35 143 L45 143" {...thin} stroke={lace} strokeWidth="1.7" />
          <path d="M26 146 Q38 138 56 144" fill="none" stroke={isDark(shoe) ? "#9ca3af" : shade(shoe, -0.3)} strokeWidth="2.2" strokeLinecap="round" />
          <rect x="19" y="146" width="45" height="8" rx="4" fill={sole} {...L(3)} />
          <path d="M26 151 H58" {...thin} stroke="#c9c5b8" strokeWidth="1.2" />
        </g>
      )}
    </g>
  );

  const arm = (
    <g>
      <path d="M22 90 Q16 106 19 118 Q26 124 33 118 Q35 104 37 90Z" fill={limb} {...L(2.8)} />
      {animal ? <circle cx="26" cy="121" r="7.5" fill={d.species === "panda" ? limb : light} {...L(2.8)} /> : <g><circle cx="26" cy="121" r="7.5" fill={skin} {...L(2.8)} /><path d="M22 124 v3.4 M26 125 v3.6 M30 124 v3.4" {...thin} stroke={shade(skin, -0.4)} strokeWidth="1.2" /></g>}
      {longSleeve ? (
        <g>
          <path d="M37 76 Q20 78 17 100 L16 112 Q26 119 36 113 L39 96 Q42 84 41 77Z" fill={sleeveC} {...L()} />
          <path d="M16 106 Q26 113 36 107 L36 113 Q26 120 16 112Z" fill={mainDark} {...L(2.4)} />
          {outfit === "jacket" && <path d="M22 80 Q19 96 19 105" {...thin} stroke="#f3f1ea" strokeWidth="3" />}
          {outfit === "track" && <path d="M22 80 Q19 96 19 106 M26 80 Q23 96 23 108" {...thin} stroke="#f3f1ea" strokeWidth="2.4" />}
          {outfit === "varsity" && <path d="M18 98 Q26 105 36 99" {...thin} stroke={main} strokeWidth="3" />}
        </g>
      ) : noSleeve ? null : (
        <path d="M37 75 Q20 76 15 94 L28 100 Q36 90 41 88Z" fill={main} {...L()} />
      )}
    </g>
  );

  const hoodBack = hooded ? <path d="M22 62 C14 20 36 -14 60 -14 C84 -14 106 20 98 62 L90 80 L30 80Z" fill={main} {...L()} /> : null;

  return (
    <g className="doll-body">
      <ellipse cx="60" cy="154" rx="40" ry="5.5" fill="rgba(0,0,0,.25)" />
      {animal && animalTail(d.species, skin, light)}
      {animal && animalEars(d.species, skin, d.species === "rabbit" ? "#f3a6a6" : "#e8a3a3")}
      {hp.back}
      {hoodBack}
      {d.acc === "backpack" && true && <g><rect x="29" y="72" width="62" height="44" rx="10" fill="#d97706" {...L()} /><rect x="40" y="96" width="40" height="16" rx="4" fill="#b45309" {...L(2.2)} /><path d="M60 72 V96" {...thin} /></g>}

      <g className="legL">{leg}</g>
      <g className="legR"><g transform={mirror}>{leg}</g></g>

      {/* pescoço e tronco */}
      <rect x="51" y="62" width="18" height="16" rx="5" fill={skin} {...L(2.6)} />
      {dress ? (
        <path d="M36 74 Q60 66 84 74 Q90 100 96 132 Q60 140 24 132 Q30 100 36 74Z" fill={main} {...L()} />
      ) : (
        <path d="M34 75 Q60 66 86 75 Q94 92 92 114 L28 114 Q26 92 34 75Z" fill={main} {...L()} />
      )}
      <path d="M78 78 Q90 94 88 112 L70 112 Q82 96 76 78Z" fill="#000" opacity=".14" />
      {outfit === "tee" && <path d="M47 71 Q60 82 73 71" fill="none" stroke={mainDark} strokeWidth="4" strokeLinecap="round" />}
      {outfit === "tee" && <path d="M30 108 H90" {...thin} stroke={mainDark} />}
      {outfit === "hoodie" && (
        <g>
          <path d="M38 71 Q60 62 82 71 Q88 88 60 92 Q32 88 38 71Z" fill={mainDark} {...L()} />
          <path d="M47 71 Q60 66 73 71 Q70 82 60 84 Q50 82 47 71Z" fill={skin} {...L(2.4)} />
          <path d="M54 82 L52 94 M66 82 L68 94" {...thin} stroke="#f3f1ea" strokeWidth="2.4" />
          <path d="M43 93 L77 93 L82 110 L38 110Z" fill={shade(main, -0.08)} {...L(2.6)} />
          <rect x="28" y="106" width="64" height="9" rx="3" fill={mainDark} {...L(2.6)} />
          <path d="M36 107 V114 M44 107 V114 M52 107 V114 M60 107 V114 M68 107 V114 M76 107 V114 M84 107 V114" {...thin} stroke={shade(main, -0.4)} strokeWidth="1" />
        </g>
      )}
      {outfit === "jacket" && (
        <g>
          <path d="M60 74 V114" {...thin} strokeWidth="2.4" />
          <path d="M44 72 Q60 80 76 72 L76 80 Q60 88 44 80Z" fill="#f3f1ea" {...L(2.4)} />
          <path d="M38 96 L46 96 M74 96 L82 96" {...thin} strokeWidth="2.6" />
          <rect x="28" y="106" width="64" height="9" rx="3" fill="#f3f1ea" {...L(2.6)} />
        </g>
      )}
      {outfit === "suit" && (
        <g>
          <path d="M50 72 L60 98 L70 72Z" fill="#fff" {...L(2.4)} />
          <path d="M57 78 L63 78 L64.6 96 L60 102 L55.4 96Z" fill="#dc2626" {...L(1.8)} />
          <path d="M44 74 L58 112 M76 74 L62 112" {...thin} strokeWidth="2.6" />
        </g>
      )}
      {outfit === "coat" && (
        <g>
          <path d="M48 72 L60 100 L72 72Z" fill={accent} {...L(2.4)} />
          <path d="M60 100 V130" {...thin} stroke="#94a3b8" />
          <path d="M70 100 V96" {...thin} stroke="#ef4444" strokeWidth="3" />
          <path d="M46 74 Q48 96 60 100 M74 74 Q72 96 60 100" fill="none" stroke="#2b6bff" strokeWidth="2.6" />
          <path d="M28 112 L92 112" {...thin} stroke="#cbd5e1" />
        </g>
      )}
      {outfit === "apron" && (
        <g>
          <path d="M44 92 L76 92 L82 116 L38 116Z" fill="#f8fafc" {...L()} />
          <path d="M44 92 L48 76 M76 92 L72 76" {...thin} stroke={INK} strokeWidth="3" />
          <rect x="52" y="100" width="16" height="10" rx="2" fill="none" {...L(2)} />
        </g>
      )}
      {outfit === "tank" && (
        <g>
          <path d="M33 76 L45 71 L45 90 Q36 92 29 88Z M87 76 L75 71 L75 90 Q84 92 91 88Z" fill={skin} {...L(2.4)} />
          <path d="M46 72 Q60 94 74 72 L74 76 Q60 98 46 76Z" fill={skin} {...L(2.4)} />
          <path d="M30 108 H90" {...thin} stroke={mainDark} />
        </g>
      )}
      {outfit === "varsity" && (
        <g>
          <path d="M60 76 V114" {...thin} strokeWidth="2.4" />
          <path d="M44 72 Q60 80 76 72 L76 80 Q60 88 44 80Z" fill={accent} {...L(2.4)} />
          <rect x="28" y="106" width="64" height="9" rx="3" fill={mainDark} {...L(2.6)} />
          <text x="72" y="98" fontSize="17" fontWeight="900" textAnchor="middle" fill="#f3f1ea" stroke={INK} strokeWidth="1.4" paintOrder="stroke">L</text>
        </g>
      )}
      {outfit === "track" && (
        <g>
          <rect x="46" y="68" width="28" height="9" rx="4" fill={mainDark} {...L(2.4)} />
          <path d="M60 77 V114" {...thin} strokeWidth="2.6" />
          <path d="M36 82 L33 112 M84 82 L87 112" {...thin} stroke="#f3f1ea" strokeWidth="3" />
          <rect x="28" y="106" width="64" height="9" rx="3" fill={mainDark} {...L(2.6)} />
          <path d="M65 80 v5" {...thin} stroke="#f3f1ea" strokeWidth="2.4" />
        </g>
      )}
      {outfit === "overalls" && (
        <g>
          <path d="M43 86 L77 86 L80 114 L40 114Z" fill={pantsC} {...L()} />
          <path d="M43 86 L47 72 M77 86 L73 72" fill="none" stroke={INK} strokeWidth="9" strokeLinecap="round" />
          <path d="M43 86 L47 72 M77 86 L73 72" fill="none" stroke={pantsC} strokeWidth="5" strokeLinecap="round" />
          <rect x="50" y="94" width="20" height="12" rx="2" fill={shade(pantsC, 0.1)} {...L(2)} />
          <circle cx="45" cy="84" r="2.2" fill="#facc15" {...L(1.2)} />
          <circle cx="75" cy="84" r="2.2" fill="#facc15" {...L(1.2)} />
        </g>
      )}
      {/* dobras da roupa */}
      {!dress && outfit !== "tank" && <path d="M40 92 Q44 98 41 106 M80 90 Q77 98 80 106 M54 96 Q56 102 54 108" {...thin} stroke={mainDark} strokeWidth="1.4" opacity=".7" />}
      {necklace && (
        <g>
          <path d="M50 76 Q60 94 70 76" fill="none" stroke="#e5e7eb" strokeWidth="2.4" />
          <circle cx="60" cy="90" r="3.4" fill="#facc15" {...L(1.8)} />
        </g>
      )}

      <g className="armL">{arm}</g>
      <g className="armR">
        <g transform={mirror}>{arm}</g>
        {tool && <text x="98" y="134" fontSize="22" textAnchor="middle">{tool}</text>}
      </g>

      {/* cabeça */}
      {!animal && (
        <g>
          <ellipse cx="29" cy="40" rx="5.5" ry="8" fill={skin} {...L(2.6)} />
          <ellipse cx="91" cy="40" rx="5.5" ry="8" fill={skin} {...L(2.6)} />
          {earring && <circle cx="29" cy="50" r="3.2" fill="none" stroke="#facc15" strokeWidth="2.2" />}
        </g>
      )}
      <path d={HEAD_D} fill={skin} {...L()} />
      {pale && <path d={HEAD_D} fill="#8fd3a4" opacity=".35" />}
      <path d="M78 14 C90 20 92 40 86 56 C86 40 84 26 78 14Z" fill="#000" opacity=".1" />
      {!animal && <g fill="#ff6b81" opacity=".22"><ellipse cx="38" cy="53" rx="6" ry="3.4" /><ellipse cx="82" cy="53" rx="6" ry="3.4" /></g>}
      {animal && animalFace(d.species, skin, light)}
      {ninja && (
        <g>
          <path d="M29 36 C29 14 43 7 60 7 C77 7 91 14 91 36 C91 54 80 68 60 68 C40 68 29 54 29 36Z M36 31 Q47 24 60 28 Q73 24 84 31 Q86 44 76 46 Q60 50 44 46 Q34 44 36 31Z" fillRule="evenodd" fill="#5b6068" {...L()} />
          {[18, 24, 30].map((y) => <path key={y} d={`M${34 + (y - 18) * 0.5} ${y} H${86 - (y - 18) * 0.5}`} {...thin} stroke="#3f4349" strokeWidth="1.2" />)}
          {[52, 58, 64].map((y) => <path key={y} d={`M${36 + (y - 52) * 0.4} ${y} H${84 - (y - 52) * 0.4}`} {...thin} stroke="#3f4349" strokeWidth="1.2" />)}
        </g>
      )}
      {!animal && !ninja && <path d="M59 43 Q56 50 61 51" {...thin} stroke={shade(skin, -0.5)} strokeWidth="2.2" />}
      {!animal && d.facial === "mustache" && <path d="M44 53 Q52 46 60 51 Q68 46 76 53 Q68 59 60 55 Q52 59 44 53Z" fill={hair} {...L(2.4)} />}
      {!animal && d.facial === "beard" && (
        <g>
          <path d="M29 42 Q27 74 60 76 Q93 74 91 42 Q88 56 78 58 Q70 52 60 54 Q50 52 42 58 Q32 56 29 42Z" fill={hair} {...L()} />
          <path d="M44 53 Q52 46 60 51 Q68 46 76 53 Q68 59 60 55 Q52 59 44 53Z" fill={shade(hair, -0.15)} {...L(2.2)} />
        </g>
      )}
      {!animal && d.facial === "freckles" && <g fill={shade(skin, -0.35)}>{[[38, 50], [42, 53], [37, 54], [82, 50], [78, 53], [83, 54]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.3" />)}</g>}
      {!animal && d.facial === "scar" && <path d="M77 25 L85 47 M75 32 L81 30 M78 40 L84 38" fill="none" stroke="#b4535c" strokeWidth="2.2" strokeLinecap="round" />}
      {!animal && d.facial === "goatee" && <path d="M51 61 Q60 78 69 61 Q60 66 51 61Z" fill={hair} {...L(2.4)} />}
      <Eyes kind={d.eyes} skin={skin} mood={mood} tired={tired} brow={brow} animal={animal} />
      {!animal && d.acc !== "mask" && !ninja && !(d.facial === "beard") && mouthOf(d.mouth, mood)}
      {!animal && d.facial === "beard" && <g transform="translate(0 6)">{mouthOf(d.mouth === "mood" && mood >= 75 ? "smile" : d.mouth, mood)}</g>}
      {!hooded && hp.front}
      {hooded && (
        <path d="M18 70 C6 14 32 -22 60 -22 C88 -22 114 14 102 70 L94 82 L26 82Z M31 38 C31 18 44 9 60 9 C76 9 89 18 89 38 C89 54 78 66 60 66 C42 66 31 54 31 38Z" fillRule="evenodd" fill={main} {...L()} />
      )}
      {accessory(d.acc === "hood" || d.acc === "ninja" ? "none" : d.acc, accent)}
      {pale && <path d="M72 6 l9 -2 l2 8 l-9 2Z" fill="#f3d9b1" {...L(1.4)} />}
      {tired && (
        <g fill="#9fb3ff" fontFamily="sans-serif" fontWeight="800">
          <text x="100" y="14" fontSize="15">z</text>
          <text x="110" y="0" fontSize="10">z</text>
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
      viewBox={portrait ? "8 -14 104 104" : "-10 -34 140 194"}
      width={portrait ? size : (size * 140) / 194}
      height={size}
      role="img"
      aria-label={title || "Boneco"}
    >
      {title && <title>{title}</title>}
      {portrait && <rect x="8" y="-14" width="104" height="104" fill={BG_COLORS[d.bg]} />}
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
            <Options options={SPECIES} field="species" value={cfg.species} cfg={cfg} onChange={set("species")} label="Quem é você?" />
            <Swatches list={cfg.species === "human" ? SKINS : FURS} value={cfg.skin} onChange={set("skin")} label={cfg.species === "human" ? "Pele" : "Pelo"} />
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
            <Options options={BOTTOMS} field="bottom" value={cfg.bottom} cfg={cfg} onChange={set("bottom")} label="Parte de baixo" />
            <Swatches list={PANTS_COLORS} value={cfg.pants} onChange={set("pants")} label="Cor da calça" />
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
