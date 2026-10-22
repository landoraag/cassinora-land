import { useEffect } from "react";
import { createPortal } from "react-dom";
import { coins } from "../lib/casino";

// Janela por cima da tela (a mesma "casino-modal" dos jogos). Esc e clique fora fecham.
export default function Modal({ title, balance, className = "", onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return createPortal(
    <div className="modal-backdrop casino-backdrop" onClick={onClose}>
      <div className={"casino-modal " + className} onClick={(e) => e.stopPropagation()}>
        <header className="casino-modal-head">
          <h3>{title}</h3>
          {balance != null && <span className="casino-modal-bal">{coins(balance)}</span>}
          <button type="button" className="modal-close" onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </header>
        {children}
      </div>
    </div>,
    document.body
  );
}
