import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWallet } from "../components/Casino";
import Avatar from "../components/Avatar";
import { PersonaForm, PersonaSheet } from "../components/RPG";
import { hasPersona } from "../lib/rpg";

// Foto de perfil: reduz para 96px (JPEG) e guarda como texto no próprio perfil. Sem Firebase Storage.
function resizeToDataUrl(file, px = 96) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) return reject(new Error("Escolha uma imagem."));
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const side = Math.min(img.width, img.height);
      const c = document.createElement("canvas");
      c.width = px;
      c.height = px;
      c.getContext("2d").drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, px, px);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.75));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não consegui abrir essa imagem."));
    };
    img.src = url;
  });
}

function Account({ say }) {
  const { user, profile, updateNickname, updatePhoto } = useAuth();
  const [nick, setNick] = useState(profile?.nickname || "");
  const [busy, setBusy] = useState(false);
  const file = useRef(null);
  async function run(fn, ok) {
    setBusy(true);
    try {
      await fn();
      say(ok);
    } catch (e) {
      say(e.message, true);
    }
    setBusy(false);
  }
  return (
    <div className="game rpg-form">
      <div className="rpg-form-top">
        <Avatar src={profile?.photoURL} name={profile?.nickname} size={64} />
        <div className="profile-photo-actions">
          <input ref={file} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) run(async () => updatePhoto(await resizeToDataUrl(f)), "Foto atualizada."); }} />
          <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => file.current?.click()}>
            📷 Trocar foto
          </button>
          {profile?.photoURL && (
            <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => run(() => updatePhoto(""), "Foto removida.")}>
              Remover
            </button>
          )}
        </div>
      </div>
      <h4 className="eco-sub">Apelido</h4>
      <div className="work-row">
        <input className="eco-note" value={nick} onChange={(e) => setNick(e.target.value)} maxLength={24} placeholder="Seu apelido" />
        <button type="button" className="btn btn-gradient" disabled={busy || nick.trim() === (profile?.nickname || "") || nick.trim().length < 2} onClick={() => run(() => updateNickname(nick), "Apelido atualizado.")}>
          Salvar
        </button>
      </div>
      <p className="game-hint">E-mail da conta: {user?.email}. O apelido aparece nos jogos, mesas e no ranking.</p>
    </div>
  );
}

export default function Perfil() {
  const wallet = useWallet();
  const navigate = useNavigate();
  const [tab, setTab] = useState("ficha");
  const [msg, setMsg] = useState(null);
  const say = (text, err = false) => {
    setMsg({ text, err });
    setTimeout(() => setMsg(null), 3500);
  };
  const created = hasPersona(wallet);
  const cur = created ? tab : "editar";
  return (
    <div className="page profile-page">
      <h1>🧑 Meu perfil</h1>
      <div className="rpg-shop-tabs">
        {[
          ["ficha", "📋 Ficha"],
          ["editar", created ? "🎨 Editar boneco" : "🎨 Criar persona"],
          ["conta", "⚙️ Conta"],
        ]
          .filter(([id]) => created || id !== "ficha")
          .map(([id, l]) => (
            <button type="button" key={id} className={cur === id ? "on" : ""} onClick={() => setTab(id)}>
              {l}
            </button>
          ))}
      </div>
      {msg && <p className={msg.err ? "auth-error" : "game-hint"}>{msg.text}</p>}
      {!wallet && <p className="muted">Carregando…</p>}
      {wallet && cur === "ficha" && <PersonaSheet wallet={wallet} onMsg={say} onEdit={() => setTab("editar")} onShop={() => navigate("/economia?abrir=shops")} />}
      {wallet && cur === "editar" && <PersonaForm wallet={wallet} onMsg={say} onDone={() => setTab("ficha")} />}
      {wallet && cur === "conta" && <Account say={say} />}
    </div>
  );
}
