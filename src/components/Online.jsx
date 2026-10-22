import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { placeLabel, useOnline } from "../lib/presence";
import Avatar from "./Avatar";
import { PersonaAvatar, PersonaName } from "./Cosmetics";

function Face({ p, size = "sm" }) {
  return p.wallet?.persona ? <PersonaAvatar wallet={p.wallet} size={size} /> : <Avatar src={p.wallet?.photoURL} name={p.nickname} size={30} />;
}

export function OnlineList({ compact = false }) {
  const { user } = useAuth();
  const list = useOnline();
  if (!list.length) return <p className="muted">Ninguém online agora.</p>;
  return (
    <ul className={"online-list" + (compact ? " compact" : "")}>
      {list.map((p) => (
        <li key={p.id} className={p.id === user?.uid ? "me" : ""}>
          <Face p={p} />
          <span>
            <b>{p.wallet?.persona ? <PersonaName wallet={p.wallet} /> : p.nickname}</b>
            <small>{p.id === user?.uid ? "Você · " : ""}{placeLabel(p.path)}</small>
          </span>
          <i className="dot" aria-hidden="true" />
        </li>
      ))}
    </ul>
  );
}

// Botão no topo: bolinha verde + quantos estão online; abre a lista.
export function OnlinePill() {
  const list = useOnline();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);
  return (
    <div className="online-wrap" ref={ref}>
      <button type="button" className="online-pill" onClick={() => setOpen((v) => !v)} aria-expanded={open} title="Quem está online">
        <i className="dot" aria-hidden="true" />
        <b>{list.length}</b>
        <span className="hide-sm"> online</span>
      </button>
      {open && (
        <div className="online-pop">
          <h4>🟢 Online agora ({list.length})</h4>
          <OnlineList compact />
        </div>
      )}
    </div>
  );
}
