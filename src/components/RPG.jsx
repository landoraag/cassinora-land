import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useCollection } from "../lib/useCollection";
import { coins, postResult } from "../lib/casino";
import {
  CAUSES,
  CHARITY_MIN,
  CLASSES,
  CLASS_CHANGE_COST,
  COSMETIC_LABELS,
  COSMETIC_TYPES,
  ITEMS,
  SHOPS,
  TITLES,
  buyItem,
  charityPoints,
  createPersona,
  donate,
  editPersona,
  equipCosmetic,
  equippedOf,
  hasPersona,
  isCosmetic,
  MAX_HEALTH,
  accLock,
  cargoOf,
  careerLevel,
  outfitLock,
  fameTitle,
  nextFame,
  levelInfo,
  liveStats,
  lockReason,
  nextTitle,
  payMultiplier,
  priceOf,
  shopDiscount,
  statBar,
  titleOf,
  unequipCosmetic,
  useItem as consumeItem,
} from "../lib/rpg";
import { DollEditor } from "./Doll";
import Doll from "./Doll";
import { ACCESSORIES, OUTFITS, cleanDoll, defaultDoll, dollOf } from "../lib/doll";
import { CAREERS, CAREER_XP, rankName } from "../lib/jobs";
import { CosmeticPreview, PersonaAvatar, PersonaName, frameClass } from "./Cosmetics";
import { Ranking } from "./Casino";

const post = (user, profile, g) => postResult(user, profile, g, "economy").catch(() => {});
const pct = (x) => `${Math.round(x * 100)}%`;

export function useNow(ms = 15000) {
  const [n, setN] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setN(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return n;
}

export function announceLevelUp(user, profile, up) {
  if (!up) return;
  post(user, profile, { type: "levelup", bet: 0, payout: up.bonus, text: `subiu para o nível ${up.to}! ⭐`, detail: `Nível ${up.to} · prêmio de ${coins(up.bonus)} e energia cheia` });
}

/* ---------------- barrinhas ---------------- */
export function Meter({ label, value, max, kind }) {
  return (
    <div className={"rpg-meter m-" + kind} title={`${label}: ${value}/${max}`}>
      <span>{label}</span>
      <div>
        <i style={{ width: statBar(value, max) }} />
      </div>
      <b>{value}</b>
    </div>
  );
}

export function Hearts({ n, max = 5 }) {
  return (
    <span className="hearts" title={`Vidas: ${n}/${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <i key={i} className={i < n ? "on" : ""}>
          {i < n ? "❤️" : "🖤"}
        </i>
      ))}
    </span>
  );
}

/* ---------------- faixa da persona no topo do #economia ---------------- */
export function PersonaStrip({ wallet, onOpen, onCreate }) {
  const now = useNow();
  if (!wallet) return null;
  if (!hasPersona(wallet)) {
    return (
      <button type="button" className="rpg-cta" onClick={onCreate}>
        <span className="rpg-cta-ico">🧑‍🎤</span>
        <span>
          <b>Crie sua persona</b>
          <span>Escolha um personagem e uma classe. O dinheiro passa a valer para comida, lazer, casa, carro, cursos e caridade.</span>
        </span>
      </button>
    );
  }
  const s = liveStats(wallet, now);
  const t = titleOf(wallet.social);
  const c = CLASSES[wallet.persona.cls];
  return (
    <button type="button" className="rpg-strip" onClick={onOpen} title="Abrir a ficha da persona">
      <PersonaAvatar wallet={wallet} />
      <span className="rpg-who">
        <b>
          <PersonaName wallet={wallet} />
        </b>
        <span>
          {c?.icon} {c?.name} · Nv {s.level} · {t.icon} {t.name}
        </span>
        <span className="rpg-xp">
          <i style={{ width: statBar(s.into, s.need) }} />
        </span>
      </span>
      <span className="rpg-meters">
        <Meter label="⚡" value={s.energy} max={s.maxEnergy} kind="energy" />
        <Meter label="😊" value={s.mood} max={100} kind="mood" />
        <Meter label="❤️‍🩹" value={s.health} max={MAX_HEALTH} kind="health" />
      </span>
      <span className="rpg-social" title="Vidas · fama · pontos sociais">
        <Hearts n={s.lives} /> · 🌟 {s.fame} · 🤝 {s.social}
      </span>
    </button>
  );
}

/* ---------------- criar / editar persona ---------------- */
export function PersonaForm({ wallet, onDone, onMsg }) {
  const { user, profile } = useAuth();
  const editing = hasPersona(wallet);
  const [name, setName] = useState(wallet?.persona?.name || profile?.nickname || "");
  const [doll, setDoll] = useState(() => (wallet?.persona?.doll ? cleanDoll(wallet.persona.doll) : defaultDoll(wallet?.persona?.name || profile?.nickname || user?.uid)));
  const emoji = wallet?.persona?.emoji || "😎";
  const [cls, setCls] = useState(wallet?.persona?.cls || "");
  const [bio, setBio] = useState(wallet?.persona?.bio || "");
  const [busy, setBusy] = useState(false);
  const changingClass = editing && cls !== wallet.persona.cls;

  async function save() {
    setBusy(true);
    try {
      if (editing) {
        await editPersona(user.uid, { name, emoji, cls, bio, doll });
        onMsg(changingClass ? `Agora você é ${CLASSES[cls].name}.` : "Persona atualizada.");
        if (changingClass)
          post(user, profile, { type: "persona", bet: 0, payout: 0, text: `virou ${CLASSES[cls].icon} ${CLASSES[cls].name}`, detail: `${emoji} ${name} mudou de carreira` });
      } else {
        await createPersona(user.uid, { name, emoji, cls, bio, doll });
        onMsg(`${emoji} ${name} chegou na cidade!`);
        post(user, profile, { type: "persona", bet: 0, payout: 0, text: `criou a persona ${emoji} ${name}`, detail: `${CLASSES[cls].icon} ${CLASSES[cls].name}${bio ? ` · “${bio}”` : ""}` });
      }
      onDone();
    } catch (e) {
      onMsg(e.message, true);
    }
    setBusy(false);
  }

  return (
    <div className="game rpg-form">
      <input className="eco-note" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da persona" maxLength={32} />
      <h4 className="eco-sub">Seu boneco</h4>
      <DollEditor value={doll} onChange={setDoll} outfitLocks={Object.fromEntries(Object.keys(OUTFITS).map((o) => [o, outfitLock(wallet, o)]).filter(([, l]) => l))} accLocks={Object.fromEntries(Object.keys(ACCESSORIES).map((a) => [a, accLock(wallet, a)]).filter(([, l]) => l))} />
      <h4 className="eco-sub">Classe</h4>
      <div className="rpg-classes">
        {Object.entries(CLASSES).map(([id, c]) => (
          <button type="button" key={id} className={"rpg-class" + (cls === id ? " sel" : "")} onClick={() => setCls(id)}>
            <span className="rpg-class-ico">{c.icon}</span>
            <b>{c.name}</b>
            <span>{c.desc}</span>
          </button>
        ))}
      </div>
      <input className="eco-note" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Uma frase sobre sua persona (opcional)" maxLength={140} />
      <button type="button" className="btn btn-gradient game-go" disabled={busy || !name.trim() || !cls} onClick={save}>
        {editing ? (changingClass ? `Salvar e trocar de classe (${coins(CLASS_CHANGE_COST)})` : "Salvar") : "Começar a vida na cidade"}
      </button>
      {editing && <p className="game-hint">Nome, boneco e frase mudam de graça. Trocar de classe custa {coins(CLASS_CHANGE_COST)}.</p>}
    </div>
  );
}

/* ---------------- ficha ---------------- */
export function PersonaSheet({ wallet, onMsg, onEdit, onShop }) {
  const { user, profile } = useAuth();
  const now = useNow(10000);
  const [busy, setBusy] = useState(false);
  if (!hasPersona(wallet)) return null;
  const s = liveStats(wallet, now);
  const t = titleOf(wallet.social);
  const nt = nextTitle(wallet.social);
  const c = CLASSES[wallet.persona.cls];
  const house = ITEMS[wallet.assets?.house];
  const vehicle = ITEMS[wallet.assets?.vehicle];
  const pets = Object.keys(wallet.pets || {}).map((id) => ITEMS[id]).filter(Boolean);
  const courses = Object.keys(wallet.courses || {}).map((id) => ITEMS[id]).filter(Boolean);
  const inv = Object.entries(wallet.inv || {}).filter(([, q]) => q > 0).map(([id, q]) => [ITEMS[id], q]).filter(([i]) => i);

  async function use(item) {
    setBusy(true);
    try {
      const r = await consumeItem(user.uid, item.id);
      onMsg(`${item.icon} ${item.name}: ${effectText(r.effect)}`);
      announceLevelUp(user, profile, r.levelUp);
    } catch (e) {
      onMsg(e.message, true);
    }
    setBusy(false);
  }

  return (
    <div className="game rpg-sheet">
      <div className="rpg-sheet-head">
        <Doll cfg={dollOf(wallet)} size={150} mood={s.mood} energy={s.energy} health={s.health} className="sheet-doll" />
        <div>
          <h3>
            <PersonaName wallet={wallet} />
          </h3>
          <span>
            {c?.icon} {c?.name} · {t.icon} {t.name}
          </span>
          {cargoOf(wallet) && (
            <span>
              {cargoOf(wallet).career.icon} {cargoOf(wallet).rank} · carreira de {cargoOf(wallet).career.name}
            </span>
          )}
          <span>
            {fameTitle(s.fame).icon} {fameTitle(s.fame).name} · 🌟 {s.fame} de fama
          </span>
          {wallet.persona.bio && <em>“{wallet.persona.bio}”</em>}
        </div>
        <button type="button" className="btn btn-ghost" onClick={onEdit}>
          Editar
        </button>
      </div>

      <div className="rpg-level">
        <div>
          <b>Nível {s.level}</b>
          <span>
            {s.into}/{s.need} XP
          </span>
        </div>
        <div className="rpg-xp big">
          <i style={{ width: statBar(s.into, s.need) }} />
        </div>
      </div>

      <div className="rpg-stats">
        <Meter label="⚡ Energia" value={s.energy} max={s.maxEnergy} kind="energy" />
        <Meter label="😊 Humor" value={s.mood} max={100} kind="mood" />
        <Meter label="❤️‍🩹 Saúde" value={s.health} max={MAX_HEALTH} kind="health" />
        <div className="rpg-meter m-life" title="Vidas">
          <span>Vida</span>
          <Hearts n={s.lives} />
          <b>{s.lives}/5</b>
        </div>
      </div>

      <div className="rpg-facts">
        <div>
          <span>Salário</span>
          <b>{pct(payMultiplier(wallet, now))}</b>
        </div>
        <div>
          <span>Turno de trabalho</span>
          <b>sem espera</b>
        </div>
        <div>
          <span>Pontos sociais</span>
          <b>{s.social}</b>
        </div>
        <div>
          <span>Doou</span>
          <b>{coins(wallet.donated || 0)}</b>
        </div>
        <div>
          <span>Desconto nas lojas</span>
          <b>{shopDiscount(wallet) >= 0 ? pct(shopDiscount(wallet)) : `+${pct(-shopDiscount(wallet))} mais caro`}</b>
        </div>
        <div>
          <span>Próxima fama</span>
          <b>{nextFame(s.fame) ? `${nextFame(s.fame).icon} em ${nextFame(s.fame).min - s.fame}` : "o máximo!"}</b>
        </div>
        <div>
          <span>Próximo título</span>
          <b>{nt ? `${nt.icon} em ${nt.min - s.social} pts` : "o máximo!"}</b>
        </div>
      </div>

      <h4 className="eco-sub">Carreiras</h4>
      <div className="rpg-assets">
        {CAREERS.map((c) => {
          const lv = careerLevel(wallet, c.id);
          const xp = Number(wallet.careers?.[c.id]) || 0;
          if (!xp && !lv) return null;
          return (
            <span key={c.id} title={`${xp} pontos`}>
              {c.icon} {rankName(c.id, lv)} {CAREER_XP[lv + 1] ? `(${xp}/${CAREER_XP[lv + 1]})` : "(topo)"}
            </span>
          );
        })}
        {!Object.keys(wallet.careers || {}).length && <span className="muted">Trabalhe para começar uma carreira.</span>}
      </div>

      <h4 className="eco-sub">Patrimônio</h4>
      <div className="rpg-assets">
        <span>{house ? `${house.icon} ${house.name}` : "🛋️ Mora com os pais"}</span>
        <span>{vehicle ? `${vehicle.icon} ${vehicle.name}` : "🚶 Anda a pé"}</span>
        {pets.map((p) => (
          <span key={p.id}>
            {p.icon} {p.name}
          </span>
        ))}
        {courses.map((p) => (
          <span key={p.id}>
            {p.icon} {p.name.replace(/^Curso de /, "")}
          </span>
        ))}
      </div>

      <h4 className="eco-sub">Visual</h4>
      <div className="rpg-assets">
        {COSMETIC_TYPES.map((type) => {
          const it = equippedOf(wallet, type);
          return (
            <span key={type}>
              {it ? `${it.icon} ${it.name}` : `Sem ${COSMETIC_LABELS[type].toLowerCase().replace(/s$/, "")}`}
            </span>
          );
        })}
        <button type="button" className="btn-link" onClick={onShop}>
          Ver loja Visual
        </button>
      </div>

      <h4 className="eco-sub">Mochila</h4>
      {inv.length === 0 ? (
        <p className="muted">
          Vazia.{" "}
          <button type="button" className="btn-link" onClick={onShop}>
            Ir às lojas
          </button>
        </p>
      ) : (
        <div className="rpg-inv">
          {inv.map(([item, q]) => (
            <div key={item.id} className="rpg-inv-item">
              <span className="rpg-inv-ico">{item.icon}</span>
              <span className="rpg-inv-name">
                <b>
                  {item.name} ×{q}
                </b>
                <span>{item.type === "item" ? item.desc : effectText(item)}</span>
              </span>
              {["food", "fun", "care"].includes(item.type) && (
                <button type="button" className="btn btn-cash" disabled={busy} onClick={() => use(item)}>
                  Usar
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function effectText(e) {
  const parts = [];
  if (e.energy) parts.push(`${e.energy > 0 ? "+" : ""}${e.energy} ⚡`);
  if (e.mood) parts.push(`${e.mood > 0 ? "+" : ""}${e.mood} 😊`);
  if (e.health) parts.push(`${e.health > 0 ? "+" : ""}${e.health} ❤️‍🩹`);
  if (e.lives) parts.push(`+${e.lives} vida`);
  if (e.xp) parts.push(`+${e.xp} XP`);
  return parts.join(" · ") || "—";
}
function itemText(i) {
  if (i.desc) return i.desc;
  if (i.type === "course") return `+10% de salário para sempre · +${i.xp} XP`;
  if (i.type === "house") return `+${i.maxEnergy} de energia máxima · humor nunca abaixo de ${i.moodFloor}`;
  if (i.type === "vehicle") return `+${pct(i.pay)} de salário em cada turno`;
  if (i.type === "formation") return `Leva você direto ao degrau de ${rankName(i.career, i.level)} (exige o degrau anterior)`;
  if (i.type === "decor") return "Aparece dentro da sua casa · soneca melhor";
  if (i.type === "care") return effectText(i);
  if (i.type === "frame") return "Moldura no seu avatar";
  if (i.type === "tag") return `Tag “${i.label}” junto ao seu nome`;
  if (i.type === "color") return "Seu nome aparece colorido";
  return effectText(i);
}

/* ---------------- lojas ---------------- */
export function Shops({ wallet, onMsg, initialShop }) {
  const { user, profile } = useAuth();
  const [shop, setShop] = useState(initialShop || SHOPS[0].id);
  const [busy, setBusy] = useState(false);
  const s = SHOPS.find((x) => x.id === shop);
  const disc = shopDiscount(wallet);

  async function equip(item) {
    setBusy(true);
    try {
      await equipCosmetic(user.uid, item.id);
      onMsg(`${item.icon} ${item.name} equipado.`);
    } catch (e) {
      onMsg(e.message, true);
    }
    setBusy(false);
  }
  async function unequip(item) {
    setBusy(true);
    try {
      await unequipCosmetic(user.uid, item.type);
      onMsg(`${item.icon} ${item.name} guardado.`);
    } catch (e) {
      onMsg(e.message, true);
    }
    setBusy(false);
  }

  async function buy(item, use) {
    setBusy(true);
    try {
      const r = await buyItem(user.uid, item.id, { use });
      const extra = r.refund ? ` (vendeu ${r.old.name} por ${coins(r.refund)})` : "";
      onMsg(`${item.icon} ${r.used ? `${item.name}: ${effectText(r.effect)}` : `Comprou ${item.name}`}${extra}`);
      if (["course", "house", "vehicle", "pet", ...COSMETIC_TYPES].includes(item.type) || r.price >= 400)
        post(user, profile, { type: "shop", bet: 0, payout: -r.price, text: `comprou ${item.icon} ${item.name}`, detail: `${item.icon} ${item.name} por ${coins(r.price)}${extra}` });
      announceLevelUp(user, profile, r.levelUp);
    } catch (e) {
      onMsg(e.message, true);
    }
    setBusy(false);
  }

  if (!hasPersona(wallet)) return <p className="muted">Crie sua persona para fazer compras.</p>;
  return (
    <div className="game rpg-shops">
      <div className="rpg-shop-tabs">
        {SHOPS.map((x) => (
          <button type="button" key={x.id} className={x.id === shop ? "on" : ""} onClick={() => setShop(x.id)}>
            {x.icon} {x.name}
          </button>
        ))}
      </div>
      <p className="game-hint">
        {s.desc}
        {disc ? ` · ${disc > 0 ? `Seu desconto: ${pct(disc)}` : `Sua fama faz tudo custar ${pct(-disc)} a mais`}` : ""}
      </p>
      <div className="rpg-items">
        {s.items.map((item, i) => {
          const cosmetic = isCosmetic(item);
          const heading = cosmetic && item.type !== s.items[i - 1]?.type ? <h4 key={"h-" + item.type} className="eco-sub">{COSMETIC_LABELS[item.type]}</h4> : null;
          const have = cosmetic && !!wallet.cosmetics?.[item.id];
          const on = have && wallet.equipped?.[item.type] === item.id;
          const lock = have ? "" : lockReason(item, wallet);
          const price = priceOf(item, wallet);
          const consumable = ["food", "fun", "care"].includes(item.type);
          const poor = (wallet.balance || 0) < price && !(item.type === "house" || item.type === "vehicle");
          return (
            <div key={item.id} style={{ display: "contents" }}>
              {heading}
              <div className={"rpg-item" + (lock ? " locked" : "") + (on ? " equipped" : "")}>
                <span className="rpg-item-ico">{cosmetic ? <CosmeticPreview item={item} wallet={wallet} /> : item.icon}</span>
                <div className="rpg-item-info">
                  <b>{item.name}</b>
                  <span>{itemText(item)}</span>
                  <em>
                    {have ? "Seu" : coins(price)}
                    {!have && price !== item.price && <s>{item.price.toLocaleString("pt-BR")}</s>}
                  </em>
                </div>
                <div className="rpg-item-act">
                  {have ? (
                    on ? (
                      <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => unequip(item)}>
                        ✓ Equipado
                      </button>
                    ) : (
                      <button type="button" className="btn btn-cash" disabled={busy} onClick={() => equip(item)}>
                        Equipar
                      </button>
                    )
                  ) : lock ? (
                    <span className="rpg-lock">🔒 {lock}</span>
                  ) : consumable ? (
                    <>
                      <button type="button" className="btn btn-cash" disabled={busy || poor} onClick={() => buy(item, true)}>
                        {item.type === "food" ? "Comer" : item.type === "care" ? "Usar" : "Ir"}
                      </button>
                      <button type="button" className="btn btn-ghost" disabled={busy || poor} onClick={() => buy(item, false)} title="Guardar na mochila">
                        🎒
                      </button>
                    </>
                  ) : (
                    <button type="button" className="btn btn-gradient" disabled={busy || poor} onClick={() => buy(item, false)}>
                      Comprar
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- caridade ---------------- */
export function Charity({ wallet, onMsg }) {
  const { user, profile } = useAuth();
  const { data } = useCollection("charity");
  const totals = useMemo(() => Object.fromEntries(data.map((d) => [d.id, d])), [data]);
  const [cause, setCause] = useState(CAUSES[0].id);
  const [v, setV] = useState(100);
  const [busy, setBusy] = useState(false);
  const cityTotal = data.reduce((a, d) => a + (d.total || 0), 0);

  async function give() {
    setBusy(true);
    try {
      const r = await donate(user.uid, cause, v);
      onMsg(`💝 Doou ${coins(r.amount)} para ${r.cause.name}: +${r.points} pontos sociais${r.newTitle ? ` · novo título: ${r.newTitle.icon} ${r.newTitle.name}!` : ""}`);
      post(user, profile, {
        type: "charity",
        bet: 0,
        payout: -r.amount,
        text: `doou ${coins(r.amount)} para ${r.cause.icon} ${r.cause.name}`,
        detail: `+${r.points} pontos sociais${r.newTitle ? ` · virou ${r.newTitle.icon} ${r.newTitle.name}` : ""}`,
      });
      announceLevelUp(user, profile, r.levelUp);
    } catch (e) {
      onMsg(e.message, true);
    }
    setBusy(false);
  }

  if (!hasPersona(wallet)) return <p className="muted">Crie sua persona para doar.</p>;
  return (
    <div className="game rpg-charity">
      <p className="game-hint">A cidade já arrecadou {coins(cityTotal)}. Doar dá pontos sociais (1 a cada 💰 10), XP e humor.</p>
      <div className="rpg-causes">
        {CAUSES.map((c) => (
          <button type="button" key={c.id} className={"rpg-cause" + (cause === c.id ? " sel" : "")} onClick={() => setCause(c.id)}>
            <span className="rpg-cause-ico">{c.icon}</span>
            <b>{c.name}</b>
            <span>{c.desc}</span>
            <em>{coins(totals[c.id]?.total || 0)} arrecadados</em>
          </button>
        ))}
      </div>
      <div className="bet-picker">
        <label className="bet-input">
          <span>Doar</span>
          <input type="number" inputMode="numeric" min={CHARITY_MIN} value={v} onChange={(e) => setV(Math.max(0, Math.floor(Number(e.target.value) || 0)))} />
        </label>
        <div className="bet-chips">
          {[50, 100, 500, 1000].map((x) => (
            <button type="button" key={x} onClick={() => setV(x)}>
              {x}
            </button>
          ))}
        </div>
      </div>
      <button type="button" className="btn btn-gradient game-go" disabled={busy || v < CHARITY_MIN} onClick={give}>
        Doar {coins(v)} · +{charityPoints(wallet, v)} pontos sociais
      </button>
      <div className="rpg-titles">
        {[...TITLES].reverse().filter((x) => x.min > -Infinity).map((x) => (
          <span key={x.name} className={titleOf(wallet.social).name === x.name ? "on" : (wallet.social || 0) >= x.min ? "got" : ""}>
            {x.icon} {x.name} <small>{x.min} pts{x.discount > 0 ? ` · −${pct(x.discount)} nas lojas` : x.discount < 0 ? ` · +${pct(-x.discount)} nas lojas` : ""}</small>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------------- ranking ---------------- */
export function EcoRanking() {
  const { user } = useAuth();
  const { data } = useCollection("wallets");
  const [mode, setMode] = useState("money");
  const list = useMemo(() => {
    const withP = data.filter((w) => hasPersona(w));
    if (mode === "level") return [...withP].sort((a, b) => (b.xp || 0) - (a.xp || 0));
    if (mode === "fame") return [...withP].sort((a, b) => (b.fame || 0) - (a.fame || 0));
    if (mode === "social") return [...withP].sort((a, b) => (b.social || 0) - (a.social || 0));
    return [];
  }, [data, mode]);
  return (
    <div>
      <div className="rpg-shop-tabs">
        {[
          ["money", "💰 Riqueza"],
          ["level", "⭐ Nível"],
          ["fame", "🌟 Fama"],
          ["social", "🤝 Social"],
        ].map(([id, l]) => (
          <button type="button" key={id} className={mode === id ? "on" : ""} onClick={() => setMode(id)}>
            {l}
          </button>
        ))}
      </div>
      {mode === "money" ? (
        <Ranking />
      ) : (
        <div className="ranking">
          {list.map((w, i) => {
            const t = titleOf(w.social);
            return (
              <div key={w.id} className={"rank-row" + (w.id === user.uid ? " me" : "")}>
                <span className="rank-pos">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}º`}</span>
                <PersonaAvatar wallet={w} size="sm" />
                <div className="rank-name">
                  <b>
                    <PersonaName wallet={w} /> <small className="muted">({w.nickname})</small>
                  </b>
                  <span>
                    {CLASSES[w.persona.cls]?.icon} {CLASSES[w.persona.cls]?.name} · {mode === "fame" ? `${fameTitle(w.fame).icon} ${fameTitle(w.fame).name}` : `${t.icon} ${t.name}`}
                  </span>
                </div>
                <b className="rank-bal">{mode === "level" ? `Nv ${levelInfo(w.xp).level}` : mode === "fame" ? `🌟 ${w.fame || 0}` : `${w.social || 0} pts`}</b>
              </div>
            );
          })}
          {list.length === 0 && <p className="muted">Ninguém criou persona ainda.</p>}
        </div>
      )}
    </div>
  );
}

/* ---------------- um item numa loja física (cartão ao tocar na prateleira) ---------------- */
export function ItemOffer({ wallet, item, onMsg }) {
  const { user, profile } = useAuth();
  const [busy, setBusy] = useState(false);
  const cosmetic = isCosmetic(item);
  const have = cosmetic && !!wallet.cosmetics?.[item.id];
  const on = have && wallet.equipped?.[item.type] === item.id;
  const lock = have ? "" : lockReason(item, wallet);
  const price = priceOf(item, wallet);
  const consumable = ["food", "fun", "care"].includes(item.type);
  const poor = (wallet.balance || 0) < price && !(item.type === "house" || item.type === "vehicle");
  async function run(fn) {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      onMsg(e.message, true);
    }
    setBusy(false);
  }
  const buy = (use) =>
    run(async () => {
      const r = await buyItem(user.uid, item.id, { use });
      const extra = r.refund ? ` (vendeu ${r.old.name} por ${coins(r.refund)})` : "";
      onMsg(`${item.icon} ${r.used ? `${item.name}: ${effectText(r.effect)}` : `Comprou ${item.name}`}${extra}`);
      if (["course", "house", "vehicle", "pet", ...COSMETIC_TYPES].includes(item.type) || r.price >= 400)
        post(user, profile, { type: "shop", bet: 0, payout: -r.price, text: `comprou ${item.icon} ${item.name}`, detail: `${item.icon} ${item.name} por ${coins(r.price)}${extra}` });
      announceLevelUp(user, profile, r.levelUp);
    });
  return (
    <div className="offer">
      <span className="offer-ico">{cosmetic ? <CosmeticPreview item={item} wallet={wallet} /> : item.icon}</span>
      <div className="offer-info">
        <b>{item.name}</b>
        <span>{itemText(item)}</span>
        <em>{have ? "Seu" : coins(price)}{!have && price !== item.price && <s>{item.price.toLocaleString("pt-BR")}</s>}</em>
      </div>
      <div className="offer-act">
        {have ? (
          on ? (
            <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => run(async () => { await unequipCosmetic(user.uid, item.type); onMsg(`${item.icon} ${item.name} guardado.`); })}>✓ Equipado</button>
          ) : (
            <button type="button" className="btn btn-cash" disabled={busy} onClick={() => run(async () => { await equipCosmetic(user.uid, item.id); onMsg(`${item.icon} ${item.name} equipado.`); })}>Equipar</button>
          )
        ) : lock ? (
          <span className="rpg-lock">🔒 {lock}</span>
        ) : consumable ? (
          <>
            <button type="button" className="btn btn-cash" disabled={busy || poor} onClick={() => buy(true)}>{item.type === "food" ? "Comer" : item.type === "care" ? "Usar" : "Ir"}</button>
            <button type="button" className="btn btn-ghost" disabled={busy || poor} onClick={() => buy(false)} title="Guardar na mochila">🎒</button>
          </>
        ) : (
          <button type="button" className="btn btn-gradient" disabled={busy || poor} onClick={() => buy(false)}>Comprar</button>
        )}
      </div>
    </div>
  );
}
