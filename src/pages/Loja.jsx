import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useWallet } from "../components/Casino";
import { DollShape } from "../components/Doll";
import { ItemOffer } from "../components/RPG";
import { SHOPS, hasPersona, isCosmetic, lockReason, priceOf, shopDiscount } from "../lib/rpg";
import { dollOf, shade } from "../lib/doll";
import { coins } from "../lib/casino";

// Loja "de verdade": você entra, anda entre as prateleiras e toca nos produtos para ver e comprar.
const THEMES = {
  mercado: { wall: "#f4e3c1", floor: ["#ece6d4", "#d9d2bd"], accent: "#2f9e5b", sign: "MERCADO", deco: "🛒" },
  lazer: { wall: "#f2c6e0", floor: ["#4a3a72", "#3a2a5a"], accent: "#d9548f", sign: "LAZER", deco: "🎡" },
  saude: { wall: "#e8f3f4", floor: ["#e6f1f2", "#cfe3e6"], accent: "#2aa0a8", sign: "SAÚDE", deco: "🏥" },
  faculdade: { wall: "#d8c7a6", floor: ["#b98a5a", "#a97a4a"], accent: "#8a6a2a", sign: "FACULDADE", deco: "🏛️" },
  escola: { wall: "#f5d9a8", floor: ["#c39a62", "#b38a52"], accent: "#2f5fa8", sign: "ESCOLA", deco: "🎓" },
  imoveis: { wall: "#cfe8e2", floor: ["#c9a06a", "#b9905a"], accent: "#0f766e", sign: "IMÓVEIS", deco: "🏠" },
  decoracao: { wall: "#e6d2b8", floor: ["#b98a5a", "#a97a4a"], accent: "#8b5e34", sign: "MÓVEIS", deco: "🛋️" },
  veiculos: { wall: "#d9dfe8", floor: ["#aab3c1", "#9aa3b2"], accent: "#e2a03c", sign: "AUTO CENTER", deco: "🚗" },
  utilidades: { wall: "#d6dbe3", floor: ["#c3cad5", "#b4bcc9"], accent: "#64748b", sign: "UTILIDADES", deco: "🔧" },
  visual: { wall: "#e6d4f5", floor: ["#f4eefc", "#e1d2f2"], accent: "#a855f7", sign: "VISUAL", deco: "✨" },
};
const COLS = 6;
const W = 1000;
const X0 = 105;
const DX = 158;
const ROW0 = 118; // linha das prateleiras da parede
const TOP0 = 250; // primeira mesa
const DROW = 124;

export default function Loja() {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const wallet = useWallet();
  const shop = SHOPS.find((s) => s.id === shopId);
  const th = THEMES[shopId] || THEMES.mercado;
  const items = shop?.items || [];
  const rows = Math.ceil(items.length / COLS);
  const H = Math.max(520, TOP0 + Math.max(0, rows - 1) * DROW + 190);
  const svgRef = useRef(null);
  const [pos, setPos] = useState({ x: W / 2, y: H - 36, dir: 1 });
  const target = useRef(null);
  const [moving, setMoving] = useState(false);
  const [sel, setSel] = useState(null);
  const [msg, setMsg] = useState({ t: "", err: false });
  const posRef = useRef(pos);
  posRef.current = pos;
  const after = useRef(null);

  useEffect(() => {
    let raf;
    let last = performance.now();
    const tick = (t) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      const tg = target.current;
      if (tg) {
        const p = posRef.current;
        const vx = tg.x - p.x;
        const vy = tg.y - p.y;
        const d = Math.hypot(vx, vy);
        const step = 260 * dt;
        if (d <= step) {
          setPos({ x: tg.x, y: tg.y, dir: p.dir });
          target.current = null;
          setMoving(false);
          const f = after.current;
          after.current = null;
          f?.();
        } else {
          setPos({ x: p.x + (vx / d) * step, y: p.y + (vy / d) * step, dir: Math.abs(vx) > 1 ? (vx > 0 ? 1 : -1) : p.dir });
          setMoving(true);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (!msg.t) return undefined;
    const t = setTimeout(() => setMsg({ t: "", err: false }), 4500);
    return () => clearTimeout(t);
  }, [msg.t]);

  const slots = useMemo(
    () =>
      items.map((item, i) => {
        const r = Math.floor(i / COLS);
        const c = i % COLS;
        const n = Math.min(COLS, items.length - r * COLS);
        const off = ((COLS - n) * DX) / 2; // centraliza a última fileira
        const x = X0 + c * DX + off;
        const baseY = r === 0 ? ROW0 : TOP0 + (r - 1) * DROW;
        return { item, x, y: r === 0 ? ROW0 : baseY + 28, r, base: r === 0 ? 0 : baseY + 44, stand: [x, (r === 0 ? 210 : baseY + 84)] };
      }),
    [items]
  );

  if (!shop) return <Navigate to="/cidade" replace />;
  if (!wallet) return <div className="page"><p className="muted">Entrando na loja…</p></div>;

  const go = (x, y, f) => {
    target.current = { x: Math.max(40, Math.min(W - 40, x)), y: Math.max(200, Math.min(H - 24, y)) };
    after.current = f || null;
  };
  const floorClick = (e) => {
    const r = svgRef.current.getBoundingClientRect();
    go(((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H);
  };
  const leave = () => go(W / 2, H - 24, () => navigate("/cidade"));
  const disc = shopDiscount(wallet);
  const hasP = hasPersona(wallet);

  // mesas (uma por linha de produtos) em ordem de profundidade, com o boneco no meio
  const tables = [];
  for (let r = 1; r < rows; r++) tables.push({ r, base: TOP0 + (r - 1) * DROW + 44 });
  const sorted = [...tables, { player: true, base: pos.y }].sort((a, b) => a.base - b.base);

  const tag = (s) => {
    const { item } = s;
    const have = isCosmetic(item) && wallet.cosmetics?.[item.id];
    const lock = have ? "" : lockReason(item, wallet);
    const price = priceOf(item, wallet);
    const active = sel?.id === item.id;
    return (
      <g key={item.id} className="loja-item" style={{ cursor: "pointer" }} onPointerDown={(e) => { e.stopPropagation(); go(s.stand[0], s.stand[1], () => setSel(item)); }}>
        {active && <ellipse cx={s.x} cy={s.y + 4} rx="38" ry="12" fill="none" stroke="#ffd34d" strokeWidth="3" />}
        <ellipse cx={s.x} cy={s.y + 4} rx="26" ry="7" fill="rgba(0,0,0,.2)" />
        <text x={s.x} y={s.y - 6} fontSize="46" textAnchor="middle" opacity={lock ? 0.45 : 1}>{item.icon}</text>
        <rect x={s.x - 34} y={s.y + 10} width="68" height="18" rx="4" fill={lock ? "#e5e7eb" : "#fffbe6"} stroke={lock ? "#9ca3af" : th.accent} strokeWidth="1.6" />
        <text x={s.x} y={s.y + 23} fontSize="11" fontWeight="800" textAnchor="middle" fill={lock ? "#6b7280" : "#14532d"}>{have ? "✓ seu" : lock ? "🔒 " + (lock.length > 9 ? lock.slice(0, 9) + "…" : lock) : price.toLocaleString("pt-BR")}</text>
      </g>
    );
  };

  return (
    <div className="page loja">
      <div className="page-head">
        <div>
          <h1>{shop.icon} {shop.name}</h1>
          <p className="muted">{shop.desc}{disc ? ` · ${disc > 0 ? "Seu desconto" : "Sua fama encarece"}: ${Math.round(Math.abs(disc) * 100)}%` : ""}</p>
        </div>
        <div className="city-hud">
          <span className="city-chip">{coins(wallet.balance || 0)}</span>
          <button type="button" className="btn btn-ghost" onClick={leave}>🚪 Sair da loja</button>
        </div>
      </div>
      {!hasP && <p className="game-hint">Crie sua persona na cidade para poder comprar.</p>}
      <svg ref={svgRef} className="loja-map" viewBox={`0 0 ${W} ${H}`} onPointerDown={floorClick} role="img" aria-label={`Interior da loja ${shop.name}`}>
        <defs>
          <pattern id="lj-floor" width="80" height="60" patternUnits="userSpaceOnUse"><rect width="80" height="60" fill={th.floor[0]} /><rect width="40" height="30" fill={th.floor[1]} /><rect x="40" y="30" width="40" height="30" fill={th.floor[1]} /></pattern>
          <linearGradient id="lj-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={shade(th.wall, 0.1)} /><stop offset="1" stopColor={shade(th.wall, -0.1)} /></linearGradient>
        </defs>
        <rect width={W} height="190" fill="url(#lj-wall)" />
        <rect y="186" width={W} height="10" fill={shade(th.wall, -0.35)} />
        <rect y="196" width={W} height={H - 196} fill="url(#lj-floor)" />
        <rect y="196" width={W} height={H - 196} fill="url(#lj-shade)" opacity="0" />
        {/* letreiro e janelas */}
        <rect x={W / 2 - 150} y="14" width="300" height="34" rx="8" fill={th.accent} stroke="rgba(0,0,0,.25)" strokeWidth="2" />
        <text x={W / 2} y="38" fontSize="22" fontWeight="900" textAnchor="middle" fill="#fff">{th.deco} {th.sign}</text>
        {[40, W - 150].map((x) => (
          <g key={x}>
            <rect x={x} y="22" width="110" height="64" rx="4" fill="#bfe8f5" stroke="#fff" strokeWidth="6" />
            <path d={`M${x + 55} 22 V86 M${x} 54 H${x + 110}`} stroke="#fff" strokeWidth="4" />
          </g>
        ))}
        {[260, 500, 740].map((x) => <g key={x}><rect x={x - 22} y="0" width="44" height="6" fill="#444" /><path d={`M${x - 22} 6 L${x - 60} 70 H${x + 60} L${x + 22} 6Z`} fill="rgba(255,244,180,.18)" /></g>)}
        {/* prateleiras da parede */}
        <rect x="52" y="60" width={W - 104} height="128" fill={shade(th.wall, -0.2)} opacity=".55" />
        {[ROW0 + 28].map((y) => <g key={y}><rect x="46" y={y} width={W - 92} height="12" fill="#8a5a2b" stroke="rgba(0,0,0,.35)" /><rect x="46" y={y + 12} width={W - 92} height="6" fill="rgba(0,0,0,.2)" /></g>)}
        <rect x="46" y="60" width="8" height="136" fill="#7a4a1b" /><rect x={W - 54} y="60" width="8" height="136" fill="#7a4a1b" />
        {slots.filter((s) => s.r === 0).map(tag)}
        {/* mesas, boneco e produtos em ordem de profundidade */}
        {sorted.map((o) =>
          o.player ? (
            <g key="me" style={{ pointerEvents: "none" }} transform={`translate(${pos.x} ${pos.y})`}>
              <ellipse rx="22" ry="6" fill="rgba(0,0,0,.3)" />
              <g transform={`scale(${pos.dir * 0.52} 0.52) translate(-60 -153)`} className={moving ? "doll-walk" : ""}>
                <DollShape cfg={dollOf(wallet)} mood={60} />
              </g>
            </g>
          ) : (
            <g key={"t" + o.r}>
              <rect x="70" y={TOP0 + (o.r - 1) * DROW + 18} width={W - 140} height="26" fill={shade(th.accent, 0.25)} stroke="rgba(0,0,0,.3)" strokeWidth="1.5" />
              <rect x="70" y={TOP0 + (o.r - 1) * DROW + 44} width={W - 140} height="30" fill={shade(th.accent, -0.15)} stroke="rgba(0,0,0,.3)" strokeWidth="1.5" />
              <rect x="86" y={TOP0 + (o.r - 1) * DROW + 74} width="10" height="16" fill="#5b3a1e" /><rect x={W - 96} y={TOP0 + (o.r - 1) * DROW + 74} width="10" height="16" fill="#5b3a1e" />
              {slots.filter((s) => s.r === o.r).map(tag)}
            </g>
          )
        )}
        {/* porta de saída */}
        <g style={{ cursor: "pointer" }} onPointerDown={(e) => { e.stopPropagation(); leave(); }}>
          <rect x={W / 2 - 60} y={H - 16} width="120" height="16" rx="4" fill={th.accent} />
          <text x={W / 2} y={H - 4} fontSize="11" fontWeight="800" textAnchor="middle" fill="#fff">🚪 SAÍDA</text>
        </g>
      </svg>
      {msg.t && <p className={"game-hint" + (msg.err ? " err" : "")}>{msg.t}</p>}
      {sel ? (
        <div className="offer-wrap">
          <ItemOffer key={sel.id} wallet={wallet} item={sel} onMsg={(t, err) => setMsg({ t, err: !!err })} />
          <button type="button" className="btn btn-ghost" onClick={() => setSel(null)}>Fechar</button>
        </div>
      ) : (
        <p className="game-hint">Toque no chão para andar pela loja e toque nos produtos para ver os detalhes e comprar.</p>
      )}
    </div>
  );
}
