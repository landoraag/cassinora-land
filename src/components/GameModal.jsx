import { useState } from "react";
import { GAMES, useWallet } from "./Casino";
import { CreateTable } from "./Tables";
import Modal from "./Modal";
import { pvpKey } from "../lib/catalog";

// O jogo aberto por cima do lobby. Quem quiser jogar contra amigos cria uma mesa do mesmo jogo.
export default function GameModal({ gameId, onClose }) {
  const wallet = useWallet();
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const game = GAMES.find((g) => g.id === gameId);
  if (!game) return null;
  const pk = pvpKey(game.id);
  return (
    <Modal title={`${game.icon} ${game.name}`} balance={wallet ? wallet.balance : null} className={"g-" + game.id} onClose={onClose}>
      {error && <p className="auth-error">{error}</p>}
      {creating ? (
        <>
          <button type="button" className="btn-link game-back" onClick={() => setCreating(false)}>
            ‹ Voltar ao jogo solo
          </button>
          <CreateTable wallet={wallet} initialGame={pk} onDone={onClose} />
        </>
      ) : (
        <game.C wallet={wallet} onError={setError} />
      )}
      {pk && !creating && (
        <div className="game-multi">
          <button type="button" className="btn btn-ghost" onClick={() => setCreating(true)}>
            👥 Jogar contra amigos · criar mesa de {game.name}
          </button>
        </div>
      )}
    </Modal>
  );
}
