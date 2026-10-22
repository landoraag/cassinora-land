import { useState } from "react";
import { Ranking } from "../components/Casino";
import { EcoRanking } from "../components/RPG";

export default function RankingPage() {
  const [tab, setTab] = useState("money");
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>🏆 Ranking</h1>
          <p className="muted">Quem tem mais moedas e quem mais evoluiu.</p>
        </div>
        <div className="tabs" role="tablist">
          <button type="button" role="tab" aria-selected={tab === "money"} className={tab === "money" ? "on" : ""} onClick={() => setTab("money")}>
            💰 Riqueza
          </button>
          <button type="button" role="tab" aria-selected={tab === "persona"} className={tab === "persona" ? "on" : ""} onClick={() => setTab("persona")}>
            ⭐ Personas
          </button>
        </div>
      </div>
      <div className="rank-box">{tab === "money" ? <Ranking /> : <EcoRanking />}</div>
    </div>
  );
}
