// Quem está online: cada aba aberta e visível grava presence/{uid} a cada 2 minutos; quem tem o
// registro mais novo que 5 minutos conta como online. Poucas escritas, para poupar leituras do Firestore.
import { useEffect, useMemo, useState } from "react";
import { deleteDoc, doc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { useCollection } from "./useCollection";

export const BEAT_MS = 120000;
export const ONLINE_MS = 300000;

export const placeLabel = (path = "/") => {
  if (path.startsWith("/cidade")) return "🏙️ Na cidade";
  if (path.startsWith("/casa")) return "🏠 Em casa";
  if (path.startsWith("/mesas")) return "👥 Nas mesas";
  if (path.startsWith("/economia")) return "💼 Na economia";
  if (path.startsWith("/ranking")) return "🏆 No ranking";
  if (path.startsWith("/perfil")) return "🧑 No perfil";
  return "🎰 No lobby";
};

// Chame uma vez, dentro do Shell.
export function useHeartbeat(user, profile, path) {
  useEffect(() => {
    if (!user) return undefined;
    const ref = doc(db, "presence", user.uid);
    const beat = () => {
      if (document.visibilityState === "hidden") return;
      setDoc(ref, { nickname: profile?.nickname || user.displayName || "Jogador", path, at: Date.now() }, { merge: true }).catch(() => {});
    };
    beat();
    const id = setInterval(beat, BEAT_MS);
    const vis = () => document.visibilityState === "visible" && beat();
    const bye = () => deleteDoc(ref).catch(() => {});
    document.addEventListener("visibilitychange", vis);
    window.addEventListener("pagehide", bye);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", vis);
      window.removeEventListener("pagehide", bye);
    };
  }, [user?.uid, profile?.nickname, path]); // eslint-disable-line react-hooks/exhaustive-deps
}

// Lista de quem está online agora, já com a carteira (boneco) de cada um.
export function useOnline() {
  const { data } = useCollection("presence", "at", "asc", 60);
  const { data: wallets } = useCollection("wallets");
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);
  return useMemo(() => {
    const byId = new Map(wallets.map((w) => [w.id, w]));
    return data
      .filter((p) => now - (p.at || 0) < ONLINE_MS)
      .sort((a, b) => (b.at || 0) - (a.at || 0))
      .map((p) => ({ ...p, wallet: byId.get(p.id) || null }));
  }, [data, wallets, now]);
}
