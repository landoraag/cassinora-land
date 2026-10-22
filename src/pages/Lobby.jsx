import { useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCollection } from "../lib/useCollection";
import { GAMES, GameResultCard, useWallet } from "../components/Casino";
import { CreateTable, TableCard } from "../components/Tables";
import GameModal from "../components/GameModal";
import Modal from "../components/Modal";
import Avatar from "../components/Avatar";
import { coins } from "../lib/casino";
import { ECONOMY_TILES, HUES, MULTI_IDS, ROWS, norm, pvpKey } from "../lib/catalog";
import { useStoredList } from "../lib/prefs";
import { isLive, useLiveTables } from "./Mesas";

const byId = Object.fromEntries(GAMES.map((g) => [g.id, g]));
const pick = (ids) => ids.map((id) => byId[id]).filter(Boolean);

/* ---------------- um jogo (cartão quadrado, como no Roblox) ---------------- */
function GameCard({ g, fav, onFav, onOpen }) {
  const multi = !!pvpKey(g.id);
  return (
    <div className="gcard" style={{ "--h": HUES[g.id] ?? 220 }}>
      <button type="button" className="gcard-main" onClick={() => onOpen(g.id)}>
        <div className="gthumb" data-game={g.id}>
          <span className="gthumb-icon">{g.icon}</span>
          {multi && <span className="gtag">👥 Multi</span>}
          <span className="gthumb-play">▶ Jogar</span>
        </div>
        <div className="gmeta">
          <b>{g.name}</b>
          <span>{g.desc}</span>
        </div>
      </button>
      <button type="button" className={"gfav" + (fav ? " on" : "")} onClick={() => onFav(g.id)} aria-pressed={fav} aria-label={fav ? `Tirar ${g.name} dos favoritos` : `Favoritar ${g.name}`}>
        {fav ? "★" : "☆"}
      </button>
    </div>
  );
}

function EcoCard({ t }) {
  const navigate = useNavigate();
  return (
    <div className="gcard" style={{ "--h": t.hue }}>
      <button type="button" className="gcard-main" onClick={() => navigate(`/economia?abrir=${t.id}`)}>
        <div className="gthumb" data-game={"eco-" + t.id}>
          <span className="gthumb-icon">{t.icon}</span>
          <span className="gthumb-play">Abrir</span>
        </div>
        <div className="gmeta">
          <b>{t.name}</b>
          <span>{t.desc}</span>
        </div>
      </button>
    </div>
  );
}

/* ---------------- uma linha que rola para o lado ---------------- */
function Row({ title, sub, children, expandable = true }) {
  const ref = useRef(null);
  const [grid, setGrid] = useState(false);
  const scroll = (dir) => ref.current?.scrollBy({ left: dir * Math.max(280, ref.current.clientWidth * 0.8), behavior: "smooth" });
  return (
    <section className="lrow">
      <header className="lrow-head">
        <div>
          <h2>{title}</h2>
          {sub && <p>{sub}</p>}
        </div>
        {expandable && (
          <button type="button" className="lrow-all" onClick={() => setGrid((v) => !v)}>
            {grid ? "Recolher" : "Ver tudo"} ›
          </button>
        )}
      </header>
      <div className="lrow-wrap">
        {!grid && (
          <button type="button" className="lrow-arrow left" onClick={() => scroll(-1)} aria-label="Voltar">
            ‹
          </button>
        )}
        <div ref={ref} className={"lrow-track" + (grid ? " grid" : "")}>
          {children}
        </div>
        {!grid && (
          <button type="button" className="lrow-arrow right" onClick={() => scroll(1)} aria-label="Avançar">
            ›
          </button>
        )}
      </div>
    </section>
  );
}

export default function Lobby() {
  const { profile } = useAuth();
  const wallet = useWallet();
  const [params, setParams] = useSearchParams();
  const [creating, setCreating] = useState(false);
  const [recent, recentOps] = useStoredList("cassinora:recent", 12);
  const [favs, favOps] = useStoredList("cassinora:fav", 40);
  const { tables } = useLiveTables();
  // só as últimas 20 do feed (economiza leituras do Firestore)
  const { data: feed } = useCollection("gameFeed", "createdAt", "asc", 20);

  const q = norm(params.get("q") || "").trim();
  const openId = params.get("jogo");

  function open(id) {
    recentOps.push(id);
    setParams((p) => {
      const n = new URLSearchParams(p);
      n.set("jogo", id);
      return n;
    });
  }
  function close() {
    setParams(
      (p) => {
        const n = new URLSearchParams(p);
        n.delete("jogo");
        return n;
      },
      { replace: true }
    );
  }

  const card = (g) => <GameCard key={g.id} g={g} fav={favs.includes(g.id)} onFav={favOps.toggle} onOpen={open} />;

  const liveTables = useMemo(() => tables.filter(isLive), [tables]);
  const liveFeed = useMemo(() => [...feed].reverse().slice(0, 12), [feed]);

  const results = useMemo(() => {
    if (!q) return null;
    return {
      games: GAMES.filter((g) => norm(g.name).includes(q) || norm(g.desc).includes(q)),
      eco: ECONOMY_TILES.filter((t) => norm(t.name).includes(q) || norm(t.desc).includes(q)),
    };
  }, [q]);

  const recentGames = pick(recent);
  const favGames = pick(favs);

  return (
    <div className="lobby">
      <div className="lobby-hello">
        <Avatar src={profile?.photoURL} name={profile?.nickname} size={58} />
        <div className="hello-text">
          <h1>Olá, {profile?.nickname || "jogador"} 👋</h1>
          <p>O que vamos jogar hoje?</p>
        </div>
        <div className="hello-stats">
          <div>
            <span>Carteira</span>
            <b>{wallet ? coins(wallet.balance) : "…"}</b>
          </div>
          <div>
            <span>Vitórias</span>
            <b>{wallet ? (wallet.wins || 0).toLocaleString("pt-BR") : "…"}</b>
          </div>
          <div>
            <span>Maior prêmio</span>
            <b>{wallet ? coins(wallet.biggestWin || 0) : "…"}</b>
          </div>
        </div>
      </div>

      {results ? (
        <section className="lrow">
          <header className="lrow-head">
            <div>
              <h2>Resultados para “{params.get("q")}”</h2>
            </div>
          </header>
          {results.games.length + results.eco.length ? (
            <div className="lrow-track grid">
              {results.games.map(card)}
              {results.eco.map((t) => (
                <EcoCard key={t.id} t={t} />
              ))}
            </div>
          ) : (
            <p className="muted empty-note">Nenhum jogo encontrado. Tente outro nome.</p>
          )}
        </section>
      ) : (
        <>
          {recentGames.length > 0 && (
            <Row title="🕑 Continuar jogando" sub="Os que você abriu por último">
              {recentGames.map(card)}
            </Row>
          )}
          {favGames.length > 0 && (
            <Row title="⭐ Seus favoritos" sub="Toque na estrela de qualquer jogo para guardar aqui">
              {favGames.map(card)}
            </Row>
          )}

          <Row title="👥 Mesas abertas" sub="Entre numa mesa ou crie a sua" expandable={false}>
            <div className="gcard create-card">
              <button type="button" className="gcard-main" onClick={() => setCreating(true)} disabled={!wallet}>
                <div className="gthumb create-thumb">
                  <span className="gthumb-icon">➕</span>
                </div>
                <div className="gmeta">
                  <b>Criar mesa</b>
                  <span>Desafie seus amigos</span>
                </div>
              </button>
            </div>
            {liveTables.map((t) => (
              <div className="tcard-wrap" key={t.id}>
                <TableCard id={t.id} />
              </div>
            ))}
            {liveTables.length === 0 && <p className="muted row-empty">Nenhuma mesa agora. Seja o primeiro!</p>}
          </Row>

          {ROWS.map((r) => (
            <Row key={r.id} title={r.title} sub={r.sub}>
              {pick(r.games).map(card)}
            </Row>
          ))}

          <Row title="🤝 Para jogar com amigos" sub="Todos estes também têm mesa multijogador">
            {pick(MULTI_IDS).map(card)}
          </Row>

          <Row title="💼 Economia & RPG" sub="Trabalhe, compre, ajude e evolua sua persona">
            {ECONOMY_TILES.map((t) => (
              <EcoCard key={t.id} t={t} />
            ))}
          </Row>

          <Row title="📣 Ao vivo" sub="O que está rolando agora" expandable={false}>
            {liveFeed.map((f) => (
              <div className="feed-item" key={f.id}>
                <div className="feed-who">
                  <Avatar src={f.senderPhoto} name={f.senderNickname} size={22} />
                  <b>{f.senderNickname}</b>
                </div>
                <GameResultCard game={f.game} />
              </div>
            ))}
            {liveFeed.length === 0 && <p className="muted row-empty">Ninguém jogou ainda. Que tal abrir o primeiro jogo?</p>}
          </Row>
        </>
      )}

      {openId && <GameModal gameId={openId} onClose={close} />}
      {creating && (
        <Modal title="⚔️ Nova mesa" balance={wallet ? wallet.balance : null} onClose={() => setCreating(false)}>
          <CreateTable wallet={wallet} onDone={() => setCreating(false)} />
        </Modal>
      )}
    </div>
  );
}
