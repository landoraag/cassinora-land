import { useEffect, useMemo, useRef, useState } from "react";
import { coins } from "../lib/casino";
import { dollOf } from "../lib/doll";
import { liveStats } from "../lib/rpg";
import { useWallet } from "./Casino";
import Doll from "./Doll";
import { play } from "../lib/sound";

// Animação no fim de cada jogo: confete e troféu para quem ganhou, chuva e carinha triste para quem
// perdeu. Ganho grande (>= 5x a aposta ou 1000+) ganha uma versão mais exuberante.
const WIN_EMOJI = ["🎉", "✨", "💰", "🪙", "⭐", "🎊"];
const LOSE_EMOJI = ["💸", "🌧️", "💔", "🥀"];

export default function ResultOverlay() {
  const wallet = useWallet();
  const [r, setR] = useState(null);
  const timer = useRef(null);

  useEffect(() => {
    const on = (e) => {
      clearTimeout(timer.current);
      setR({ ...e.detail, id: Date.now() });
      play(e.detail.net > 0 ? (e.detail.net >= 1000 ? "bigwin" : "win") : e.detail.net < 0 ? (e.detail.game === "crash" ? "boom" : "lose") : "push");
      timer.current = setTimeout(() => setR(null), e.detail.net > 0 ? 3200 : 2600);
    };
    window.addEventListener("cassinora:result", on);
    return () => {
      window.removeEventListener("cassinora:result", on);
      clearTimeout(timer.current);
    };
  }, []);

  const bits = useMemo(() => {
    if (!r) return [];
    const list = r.net > 0 ? WIN_EMOJI : LOSE_EMOJI;
    const n = r.net > 0 ? (r.net >= 1000 ? 46 : 28) : 14;
    return Array.from({ length: n }, (_, i) => ({
      e: list[i % list.length],
      left: Math.random() * 100,
      delay: Math.random() * 0.9,
      dur: 1.6 + Math.random() * 1.6,
      size: 14 + Math.random() * 22,
    }));
  }, [r?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!r) return null;
  const kind = r.net > 0 ? "win" : r.net < 0 ? "lose" : "push";
  const st = wallet ? liveStats(wallet) : { mood: 60, energy: 100, health: 100 };
  const mood = kind === "win" ? 100 : kind === "lose" ? 5 : 50;
  return (
    <div className={"result-overlay " + kind + (r.net >= 1000 ? " big" : "")} onClick={() => setR(null)} role="status" aria-live="polite">
      {kind !== "push" && (
        <div className="ro-rain" aria-hidden="true">
          {bits.map((b, i) => (
            <i key={i} style={{ left: `${b.left}%`, animationDelay: `${b.delay}s`, animationDuration: `${b.dur}s`, fontSize: b.size }}>
              {b.e}
            </i>
          ))}
        </div>
      )}
      <div className="ro-card">
        {wallet?.persona && (
          <Doll cfg={dollOf(wallet)} size={120} mood={mood} energy={st.energy} health={st.health} className={"ro-doll " + kind} />
        )}
        <div className="ro-trophy">{kind === "win" ? "🏆" : kind === "lose" ? "😢" : "🤝"}</div>
        <b className="ro-title">{kind === "win" ? (r.net >= 1000 ? "VITÓRIA ÉPICA!" : "VOCÊ GANHOU!") : kind === "lose" ? "Você perdeu…" : "Empate"}</b>
        <span className="ro-amount">{kind === "win" ? `+${coins(r.net)}` : kind === "lose" ? `-${coins(-r.net)}` : "Aposta devolvida"}</span>
        {r.text && <small>{r.text}</small>}
      </div>
    </div>
  );
}
