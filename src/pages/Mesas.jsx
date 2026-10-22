import { useMemo, useState } from "react";
import { useCollection } from "../lib/useCollection";
import { CreateTable, TableCard } from "../components/Tables";
import { useWallet } from "../components/Casino";
import Modal from "../components/Modal";

const MAX_AGE = 3 * 60 * 60 * 1000; // mesa parada há mais de 3 h some da lista

export function useLiveTables() {
  // só as últimas 20 mesas (economiza leituras do Firestore)
  const { data, loading } = useCollection("casinoTables", "createdAt", "asc", 20);
  return { loading, tables: useMemo(() => [...data].reverse(), [data]) };
}

export const isLive = (t) => ["lobby", "playing"].includes(t.status) && Date.now() - (t.updatedAt || 0) < MAX_AGE;

function Group({ title, tables, empty }) {
  return (
    <section className="page-section">
      <h2>{title}</h2>
      {tables.length ? (
        <div className="table-grid">
          {tables.map((t) => (
            <TableCard key={t.id} id={t.id} />
          ))}
        </div>
      ) : (
        <p className="muted">{empty}</p>
      )}
    </section>
  );
}

export default function Mesas() {
  const wallet = useWallet();
  const { tables, loading } = useLiveTables();
  const [creating, setCreating] = useState(false);
  const waiting = tables.filter((t) => t.status === "lobby" && isLive(t));
  const playing = tables.filter((t) => t.status === "playing" && isLive(t));
  const done = tables.filter((t) => t.status === "done").slice(0, 6);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>👥 Mesas</h1>
          <p className="muted">Jogue contra seus amigos: todo mundo aposta o mesmo valor e quem vencer leva o pote.</p>
        </div>
        <button type="button" className="btn btn-gradient" onClick={() => setCreating(true)} disabled={!wallet}>
          ➕ Criar mesa
        </button>
      </div>

      {loading ? (
        <div className="spinner" />
      ) : (
        <>
          <Group title="Esperando jogadores" tables={waiting} empty="Nenhuma mesa aberta agora. Crie a primeira!" />
          <Group title="Em jogo" tables={playing} empty="Nenhuma partida acontecendo." />
          {done.length > 0 && <Group title="Terminaram agora há pouco" tables={done} empty="" />}
        </>
      )}

      {creating && (
        <Modal title="⚔️ Nova mesa" balance={wallet ? wallet.balance : null} onClose={() => setCreating(false)}>
          <CreateTable wallet={wallet} onDone={() => setCreating(false)} />
        </Modal>
      )}
    </div>
  );
}
