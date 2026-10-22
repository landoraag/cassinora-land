import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { coins, randInt } from "../lib/casino";
import { work } from "../lib/economy";
import { careerLevel, hasPersona, jobLock, liveStats, workPreview } from "../lib/rpg";
import { CAREERS, CAREER_XP, DIFF_LABEL, jobQuality, jobsOf, rankName } from "../lib/jobs";

// Trabalhar é um minigame: escolha um trabalho (lib/jobs.js) e faça 5 tarefas. Cada uma vale
//   1 = certo · 0.5 = meio errado · 0 = errado
// Trabalho difícil paga mais, mas as tarefas são mais duras e a curva de pagamento cobra mais
// acerto. Cada tarefa recebe `diff` (1..5). O pagamento é calculado em lib/rpg.js (workShift).

const SHIFT_TASKS = 5;
const pickTypes = (job) => Array.from({ length: SHIFT_TASKS }, (_, i) => job.tasks[i % job.tasks.length]);

const shuffled = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
function lev(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}

// Contagem regressiva da tarefa. `onEnd` é sempre a versão mais recente (vê o que já foi digitado).
function useCountdown(seconds, onEnd, paused = false) {
  const [left, setLeft] = useState(seconds);
  const endRef = useRef(onEnd);
  endRef.current = onEnd;
  useEffect(() => {
    if (paused) return undefined;
    const t0 = Date.now();
    const id = setInterval(() => {
      const l = Math.max(0, seconds - (Date.now() - t0) / 1000);
      setLeft(l);
      if (l <= 0) {
        clearInterval(id);
        endRef.current();
      }
    }, 200);
    return () => clearInterval(id);
  }, [seconds, paused]);
  return left;
}

// Garante que a tarefa entrega a nota uma vez só (clique + tempo acabando ao mesmo tempo).
function useOnce(fn) {
  const done = useRef(false);
  return (v) => {
    if (done.current) return;
    done.current = true;
    fn(v);
  };
}

function TaskShell({ n, title, hint, seconds, paused, onTimeout, children }) {
  const left = useCountdown(seconds, onTimeout, paused);
  return (
    <div className="work-task">
      <div className="work-task-top">
        <span>
          Tarefa {n}/{SHIFT_TASKS}
        </span>
        <b>{title}</b>
        <em>{paused ? "…" : `${Math.ceil(left)}s`}</em>
      </div>
      <div className="work-timer">
        <i style={{ width: `${(left / seconds) * 100}%` }} />
      </div>
      {hint && <p className="game-hint">{hint}</p>}
      {children}
    </div>
  );
}

/* ---------- 1. Caixa: dar o troco ---------- */
function TrocoTask({ n, onDone, diff }) {
  const t = useMemo(() => {
    const items = Array.from({ length: 3 }, () => 3 + randInt(18 + diff * 6));
    const total = items.reduce((a, b) => a + b, 0);
    const paid = [50, 100, 200].find((p) => p > total) || 200;
    return { items, total, paid, change: paid - total };
  }, []);
  const [v, setV] = useState("");
  const vRef = useRef("");
  vRef.current = v;
  const finish = useOnce(onDone);
  const grade = () => {
    if (vRef.current === "") return 0;
    const d = Math.abs(Number(vRef.current) - t.change);
    return d === 0 ? 1 : d <= 2 && diff <= 3 ? 0.5 : 0;
  };
  return (
    <TaskShell n={n} title="💵 Caixa" seconds={Math.max(12, 28 - diff * 3)} hint="Calcule o troco do cliente." onTimeout={() => finish(grade())}>
      <div className="work-card">
        <p>
          O cliente levou 3 itens: <b>R$ {t.items[0]}</b>, <b>R$ {t.items[1]}</b> e <b>R$ {t.items[2]}</b>.
        </p>
        <p>
          Ele pagou com <b>R$ {t.paid}</b>. Qual é o troco?
        </p>
        <div className="work-row">
          <input
            className="eco-note"
            type="number"
            inputMode="numeric"
            autoFocus
            value={v}
            onChange={(e) => setV(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && finish(grade())}
            placeholder="R$"
          />
          <button type="button" className="btn btn-gradient" onClick={() => finish(grade())}>
            Entregar
          </button>
        </div>
      </div>
    </TaskShell>
  );
}

/* ---------- 2. Atendimento: digitar a mensagem ---------- */
const PHRASES = [
  "pedido confirmado e saindo para entrega",
  "obrigado pela preferencia volte sempre",
  "sua landing page esta no ar e funcionando",
  "o orcamento foi enviado para o seu email",
  "atendimento rapido e cliente satisfeito",
  "reuniao marcada para amanha as dez horas",
];
function DigitarTask({ n, onDone, diff }) {
  const phrase = useMemo(() => {
    const a = PHRASES[randInt(PHRASES.length)];
    return diff >= 4 ? `${a} ${PHRASES[randInt(PHRASES.length)]}` : a;
  }, [diff]);
  const [v, setV] = useState("");
  const vRef = useRef("");
  vRef.current = v;
  const finish = useOnce(onDone);
  const grade = () => {
    const typed = vRef.current.trim().toLowerCase();
    if (!typed) return 0;
    const sim = 1 - lev(typed, phrase) / Math.max(phrase.length, typed.length);
    return sim >= (diff >= 4 ? 0.98 : 0.95) ? 1 : sim >= 0.8 ? 0.5 : 0;
  };
  return (
    <TaskShell n={n} title="💬 Mensagem" seconds={diff >= 4 ? 34 : 28} hint="Digite a mensagem exatamente como está (sem colar)." onTimeout={() => finish(grade())}>
      <div className="work-card">
        <p className="work-phrase">{phrase}</p>
        <div className="work-row">
          <input
            className="eco-note"
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            value={v}
            onChange={(e) => setV(e.target.value)}
            onPaste={(e) => e.preventDefault()}
            onKeyDown={(e) => e.key === "Enter" && finish(grade())}
            placeholder="Digite aqui"
          />
          <button type="button" className="btn btn-gradient" onClick={() => finish(grade())}>
            Enviar
          </button>
        </div>
      </div>
    </TaskShell>
  );
}

/* ---------- 3. Estoque: lembrar a ordem ---------- */
const STOCK = ["🍎", "🍌", "🍇", "🍒", "🥕", "🍋", "🍉", "🥑"];
function MemoriaTask({ n, onDone, diff }) {
  const SEQ_LEN = Math.min(7, 3 + diff);
  const { seq, grid } = useMemo(() => {
    const s = shuffled(STOCK).slice(0, SEQ_LEN);
    return { seq: s, grid: shuffled(STOCK) };
  }, []);
  const [phase, setPhase] = useState("show");
  const [picks, setPicks] = useState([]);
  const picksRef = useRef([]);
  picksRef.current = picks;
  const finish = useOnce(onDone);
  useEffect(() => {
    const t = setTimeout(() => setPhase("pick"), Math.max(1800, 3600 - diff * 300));
    return () => clearTimeout(t);
  }, []);
  const grade = (list) => {
    const right = list.filter((e, i) => e === seq[i]).length;
    return right === SEQ_LEN ? 1 : right >= Math.ceil(SEQ_LEN / 2) ? 0.5 : 0;
  };
  function pick(e) {
    if (phase !== "pick" || picks.includes(e)) return;
    const next = [...picks, e];
    setPicks(next);
    if (next.length === SEQ_LEN) finish(grade(next));
  }
  return (
    <TaskShell
      n={n}
      title="📦 Memória"
      seconds={20}
      paused={phase === "show"}
      hint={phase === "show" ? "Memorize a ordem dos produtos que o fornecedor entregou…" : "Agora toque nos produtos na mesma ordem."}
      onTimeout={() => finish(grade(picksRef.current))}
    >
      <div className="work-card">
        {phase === "show" ? (
          <div className="work-seq">
            {seq.map((e, i) => (
              <span key={i}>{e}</span>
            ))}
          </div>
        ) : (
          <>
            <div className="work-seq picked">
              {Array.from({ length: SEQ_LEN }, (_, i) => (
                <span key={i}>{picks[i] || "❔"}</span>
              ))}
            </div>
            <div className="work-grid">
              {grid.map((e) => (
                <button type="button" key={e} disabled={picks.includes(e)} onClick={() => pick(e)}>
                  {e}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </TaskShell>
  );
}

/* ---------- 4. Prateleira: ordenar os preços ---------- */
function OrdemTask({ n, onDone, diff }) {
  const COUNT = 4 + Math.min(4, diff);
  const nums = useMemo(() => {
    const s = new Set();
    while (s.size < COUNT) s.add(5 + randInt(95));
    return shuffled([...s]);
  }, []);
  const sorted = useMemo(() => [...nums].sort((a, b) => a - b), [nums]);
  const [picked, setPicked] = useState([]);
  const [mistakes, setMistakes] = useState(0);
  const [flash, setFlash] = useState(null);
  const stateRef = useRef({ picked: [], mistakes: 0 });
  stateRef.current = { picked, mistakes };
  const finish = useOnce(onDone);
  const grade = ({ picked: p, mistakes: m }) => {
    if (p.length === sorted.length) return m === 0 ? 1 : m <= 2 ? 0.5 : 0;
    return p.length >= 3 && m <= 2 ? 0.5 : 0;
  };
  function tap(v) {
    if (picked.includes(v)) return;
    if (v === sorted[picked.length]) {
      const next = [...picked, v];
      setPicked(next);
      if (next.length === sorted.length) finish(grade({ picked: next, mistakes }));
    } else {
      setMistakes((m) => m + 1);
      setFlash(v);
      setTimeout(() => setFlash(null), 350);
    }
  }
  return (
    <TaskShell n={n} title="🏷️ Prateleira" seconds={Math.max(12, 24 - diff * 2)} hint="Toque nos preços do MENOR para o MAIOR." onTimeout={() => finish(grade(stateRef.current))}>
      <div className="work-card">
        <div className="work-grid prices">
          {nums.map((v) => (
            <button type="button" key={v} className={picked.includes(v) ? "ok" : flash === v ? "bad" : ""} disabled={picked.includes(v)} onClick={() => tap(v)}>
              R$ {v}
            </button>
          ))}
        </div>
        <small className="muted">Erros: {mistakes}</small>
      </div>
    </TaskShell>
  );
}

/* ---------- 5. Conta: cálculo de cabeça (cresce com a dificuldade) ---------- */
function ContaTask({ n, onDone, diff }) {
  const t = useMemo(() => {
    const a = 6 + randInt(10 * diff);
    const b = 3 + randInt(8 * diff);
    const c = 2 + randInt(9);
    const x = 2 + randInt(8);
    const y = 3 + randInt(9);
    const m = 11 + randInt(14);
    const k = 3 + randInt(7);
    if (diff <= 1) return { q: `${a} + ${b}`, ans: a + b };
    if (diff === 2) return { q: `${a + 10} − ${b} + ${c}`, ans: a + 10 - b + c };
    if (diff === 3) return { q: `${x} × ${y} + ${c}`, ans: x * y + c };
    if (diff === 4) return { q: `${m} × ${k} − ${a}`, ans: m * k - a };
    return { q: `(${a + 9} + ${b}) × ${k} − ${c}`, ans: (a + 9 + b) * k - c };
  }, [diff]);
  const ans = t.ans;
  const [v, setV] = useState("");
  const vRef = useRef("");
  vRef.current = v;
  const finish = useOnce(onDone);
  const grade = () => {
    if (vRef.current === "") return 0;
    const d = Math.abs(Number(vRef.current) - ans);
    return d === 0 ? 1 : d <= Math.max(1, diff - 2) && diff <= 3 ? 0.5 : 0;
  };
  return (
    <TaskShell n={n} title="🧮 Conta" seconds={Math.max(10, 22 - diff * 2)} hint="Resolva de cabeça." onTimeout={() => finish(grade())}>
      <div className="work-card">
        <p className="work-phrase">{t.q} = ?</p>
        <div className="work-row">
          <input className="eco-note" type="number" inputMode="numeric" autoFocus value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => e.key === "Enter" && finish(grade())} placeholder="Resposta" />
          <button type="button" className="btn btn-gradient" onClick={() => finish(grade())}>
            Entregar
          </button>
        </div>
      </div>
    </TaskShell>
  );
}

/* ---------- 6. Sequência: qual é o próximo número? ---------- */
function SequenciaTask({ n, onDone, diff }) {
  const t = useMemo(() => {
    const a = 1 + randInt(6);
    const d = 2 + randInt(4);
    let list;
    if (diff <= 2) list = Array.from({ length: 5 }, (_, i) => a + d * i);
    else if (diff === 3) list = Array.from({ length: 5 }, (_, i) => a * Math.pow(2, i));
    else if (diff === 4) list = Array.from({ length: 6 }, (_, i) => (i + 1) * (i + 1) + a);
    else list = [a, a + 1, a + 3, a + 6, a + 10, a + 15]; // somas crescentes
    const ans = list[list.length - 1];
    const shown = list.slice(0, -1);
    const wrong = new Set();
    while (wrong.size < 3) {
      const w = ans + (randInt(9) - 4) * (1 + Math.floor(diff / 2));
      if (w !== ans && w > 0) wrong.add(w);
    }
    return { shown, ans, opts: shuffled([ans, ...wrong]) };
  }, [diff]);
  const finish = useOnce(onDone);
  return (
    <TaskShell n={n} title="🔢 Sequência" seconds={Math.max(9, 20 - diff * 2)} hint="Qual número completa a sequência?" onTimeout={() => finish(0)}>
      <div className="work-card">
        <p className="work-phrase">{t.shown.join(" · ")} · ?</p>
        <div className="work-grid prices">
          {t.opts.map((o) => (
            <button type="button" key={o} onClick={() => finish(o === t.ans ? 1 : 0)}>
              {o}
            </button>
          ))}
        </div>
      </div>
    </TaskShell>
  );
}

/* ---------- 7. Reflexo: toque nos alvos que acendem ---------- */
function ReflexoTask({ n, onDone, diff }) {
  const TARGETS = 4 + diff; // quantos alvos acendem
  const [lit, setLit] = useState(-1);
  const [hits, setHits] = useState(0);
  const [shown, setShown] = useState(0);
  const st = useRef({ hits: 0, shown: 0 });
  const finish = useOnce(onDone);
  const grade = () => {
    const r = st.current.hits / TARGETS;
    return r >= 0.9 ? 1 : r >= 0.55 ? 0.5 : 0;
  };
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);
  useEffect(() => {
    let id;
    const ms = Math.max(520, 1100 - diff * 120);
    const step = () => {
      if (!alive.current) return;
      if (st.current.shown >= TARGETS) {
        setLit(-1);
        setTimeout(() => finish(grade()), 400);
        return;
      }
      st.current.shown += 1;
      setShown(st.current.shown);
      setLit(randInt(9));
      id = setTimeout(() => {
        setLit(-1);
        id = setTimeout(step, 180);
      }, ms);
    };
    id = setTimeout(step, 600);
    return () => clearTimeout(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  function tap(i) {
    if (i !== lit) return;
    st.current.hits += 1;
    setHits(st.current.hits);
    setLit(-1);
  }
  return (
    <TaskShell n={n} title="⚡ Reflexo" seconds={Math.ceil(TARGETS * (Math.max(520, 1100 - diff * 120) + 180) / 1000) + 4} hint={`Toque nos quadrados que acendem (${hits}/${TARGETS}).`} onTimeout={() => finish(grade())}>
      <div className="work-card">
        <div className="work-grid reflex">
          {Array.from({ length: 9 }, (_, i) => (
            <button type="button" key={i} className={i === lit ? "ok" : ""} onClick={() => tap(i)} aria-label={`alvo ${i + 1}`} />
          ))}
        </div>
        <small className="muted">
          Alvo {Math.min(shown, TARGETS)}/{TARGETS}
        </small>
      </div>
    </TaskShell>
  );
}
const TASK_VIEW = { troco: TrocoTask, digitar: DigitarTask, memoria: MemoriaTask, ordem: OrdemTask, conta: ContaTask, sequencia: SequenciaTask, reflexo: ReflexoTask };
function verdict(ratio) {
  if (ratio >= 1) return ["🌟", "Turno perfeito!"];
  if (ratio >= 0.7) return ["👏", "Bom trabalho!"];
  if (ratio >= 0.4) return ["😐", "Meio errado…"];
  return ["😬", "Turno ruim"];
}

/* ---------- o turno ---------- */
const MARK = { 1: "✅", 0.5: "🟡", 0: "❌" };
export default function WorkGame({ wallet, onFinished, onClose, onNeedPersona }) {
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [types, setTypes] = useState([]);
  const [phase, setPhase] = useState("pick"); // pick | play | saving | retry | done
  const [idx, setIdx] = useState(0);
  const [scores, setScores] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  if (!hasPersona(wallet)) {
    return (
      <div className="game">
        <p className="muted">Crie sua persona antes de trabalhar.</p>
        <button type="button" className="btn btn-gradient game-go" onClick={onNeedPersona}>
          Criar persona
        </button>
      </div>
    );
  }

  async function save(all) {
    setPhase("saving");
    setError("");
    try {
      const r = await work(user.uid, all, job.id);
      setResult(r);
      setPhase("done");
      onFinished?.(r);
    } catch (e) {
      setError(e.message);
      setPhase("retry");
    }
  }

  function taskDone(score) {
    const all = [...scores, score];
    setScores(all);
    setFeedback(score);
    timer.current = setTimeout(() => {
      setFeedback(null);
      if (all.length >= SHIFT_TASKS) save(all);
      else setIdx(all.length);
    }, 750);
  }

  function start(j) {
    setJob(j);
    setTypes(pickTypes(j));
    setScores([]);
    setIdx(0);
    setFeedback(null);
    setResult(null);
    setError("");
    setPhase("play");
  }

  if (phase === "pick") {
    const s = liveStats(wallet);
    return (
      <div className="game work-intro">
        <p className="game-hint">
          Escolha a carreira e o trabalho. Cada turno dá pontos de carreira: subindo de degrau você libera trabalhos que pagam muito mais (e uma roupa de cargo, como o jaleco de médico). Também dá para comprar a formação na Faculdade. Quanto mais difícil, mais cansa e mais cobra acerto.
          Saúde ❤️‍🩹 {s.health}/100 · Vidas {"❤️".repeat(s.lives)}
          {"🖤".repeat(5 - s.lives)}
        </p>
        {CAREERS.map((c) => {
          const lv = careerLevel(wallet, c.id);
          const xp = Number(wallet.careers?.[c.id]) || 0;
          const next = CAREER_XP[lv + 1];
          return (
            <section key={c.id} className="career-block">
              <h4 className="eco-sub">
                {c.icon} {c.name} · <b>{rankName(c.id, lv)}</b>
                <small className="muted"> {next ? ` ${xp}/${next} pts para o próximo degrau` : " no topo!"}</small>
              </h4>
              <div className="job-list">
                {jobsOf(c.id).map((j) => {
                  const lock = jobLock(j, wallet);
                  const p = workPreview(j, wallet);
                  return (
                    <button type="button" key={j.id} className={"job-card d" + j.diff} disabled={!!lock} onClick={() => start(j)} title={lock}>
                      <span className="job-ico">{j.icon}</span>
                      <b>{j.name}</b>
                      <span className="job-diff">
                        {"★".repeat(j.diff)}
                        {"☆".repeat(5 - j.diff)} {DIFF_LABEL[j.diff]}
                      </span>
                      <span className="job-pay">
                        💰 {p.min.toLocaleString("pt-BR")} a {p.max.toLocaleString("pt-BR")}
                      </span>
                      <small>
                        ⚡ −{j.energy} · ❤️‍🩹 −{j.health}+ · 🌟 até +{j.fame}
                      </small>
                      {lock && <em className="job-lock">🔒 {lock}</em>}
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    );
  }

  if (phase === "saving") return <div className="game work-intro"><p className="muted">Recebendo o pagamento…</p></div>;

  if (phase === "retry")
    return (
      <div className="game work-intro">
        <p className="auth-error">{error}</p>
        <div className="game-actions">
          <button type="button" className="btn btn-gradient" onClick={() => save(scores)}>
            Tentar receber de novo
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setPhase("pick")}>
            Escolher outro trabalho
          </button>
        </div>
      </div>
    );

  if (phase === "done" && result) {
    const [icon, text] = verdict(result.ratio);
    return (
      <div className="game work-result">
        <div className={"casino-result " + (result.ratio >= 0.4 ? "win" : "lose")}>
          <b>
            {icon} {text}
          </b>
          <small>
            {result.emoji} {wallet.persona.name} trabalhou como {result.job}
            {result.tip ? " · gorjeta dobrada! 🤑" : ""}
          </small>
          <span>+{coins(result.amount + (result.levelUp?.bonus || 0))}</span>
        </div>
        <div className="work-marks">
          {result.scores.map((s, i) => (
            <span key={i}>{MARK[s]}</span>
          ))}
        </div>
        <p className="game-hint">
          +{result.xp} XP · +{result.fame} fama 🌟 · −{result.hurt} saúde · pagou {Math.round(jobQuality(result.ratio, result.diff) * 100)}% da faixa do trabalho
          {result.levelUp ? ` · ⭐ Nível ${result.levelUp.to}! +${coins(result.levelUp.bonus)}` : ""}
        </p>
        {result.careerUp && (
          <p className="game-hint">
            🎓 Promoção! Você agora é <b>{result.careerUp.rank}</b> na carreira. Novos trabalhos e roupas de cargo liberados.
          </p>
        )}
        <p className="game-hint">+{result.careerXp} pontos de carreira</p>
        {result.fainted && (
          <p className="auth-error">
            🚑 Você desmaiou de exaustão! Perdeu 1 vida e a conta do hospital foi {coins(result.fee)}. Cuide da saúde na loja Saúde & Hospital.
          </p>
        )}
        <div className="game-actions">
          <button type="button" className="btn btn-gradient" onClick={() => start(job)}>
            Trabalhar de novo
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setPhase("pick")}>
            Outro trabalho
          </button>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    );
  }

  const View = TASK_VIEW[types[idx]];
  return (
    <div className="game work-play">
      <div className="work-marks">
        <span title={job.name}>{job.icon}</span>
        {Array.from({ length: SHIFT_TASKS }, (_, i) => (
          <span key={i} className={i === idx ? "now" : ""}>
            {scores[i] !== undefined ? MARK[scores[i]] : "⚪"}
          </span>
        ))}
      </div>
      {feedback !== null ? (
        <div className="work-feedback">{feedback === 1 ? "✅ Certo!" : feedback === 0.5 ? "🟡 Quase… meio errado" : "❌ Errou"}</div>
      ) : (
        <View key={idx} n={idx + 1} diff={job.diff} onDone={taskDone} />
      )}
    </div>
  );
}
