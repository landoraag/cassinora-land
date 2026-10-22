// Efeitos sonoros feitos na hora com Web Audio (nenhum arquivo de áudio). O botão 🔊/🔇 do topo liga e desliga.
let ctx = null;
let muted = false;
try {
  muted = localStorage.getItem("cl-muted") === "1";
} catch {
  /* sem armazenamento: segue ligado */
}

function ac() {
  if (muted) return null;
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(c, { f = 440, f2, t = 0, d = 0.15, type = "sine", v = 0.15 }) {
  const o = c.createOscillator();
  const g = c.createGain();
  const t0 = c.currentTime + t;
  o.type = type;
  o.frequency.setValueAtTime(f, t0);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + d);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(v, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
  o.connect(g).connect(c.destination);
  o.start(t0);
  o.stop(t0 + d + 0.02);
}
function noise(c, { t = 0, d = 0.3, v = 0.2, lp = 1200 }) {
  const n = Math.floor(c.sampleRate * d);
  const buf = c.createBuffer(1, n, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = c.createBufferSource();
  const f = c.createBiquadFilter();
  const g = c.createGain();
  f.type = "lowpass";
  f.frequency.value = lp;
  g.gain.value = v;
  s.buffer = buf;
  s.connect(f).connect(g).connect(c.destination);
  s.start(c.currentTime + t);
}

const SOUNDS = {
  click: (c) => tone(c, { f: 620, f2: 420, d: 0.05, type: "triangle", v: 0.06 }),
  bet: (c) => [0, 0.07].forEach((t, i) => tone(c, { f: 1300 + i * 300, t, d: 0.12, type: "square", v: 0.05 })), // moedinhas
  card: (c) => noise(c, { d: 0.09, v: 0.25, lp: 3500 }),
  win: (c) => [523, 659, 784, 1047].forEach((f, i) => tone(c, { f, t: i * 0.09, d: 0.22, type: "triangle", v: 0.16 })),
  bigwin: (c) => {
    [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone(c, { f, t: i * 0.08, d: 0.3, type: "triangle", v: 0.18 }));
    for (let i = 0; i < 8; i++) tone(c, { f: 1800 + (i % 3) * 400, t: 0.5 + i * 0.06, d: 0.1, type: "square", v: 0.04 });
  },
  lose: (c) => [330, 262, 196].forEach((f, i) => tone(c, { f, f2: f * 0.9, t: i * 0.16, d: 0.28, type: "sawtooth", v: 0.1 })),
  push: (c) => tone(c, { f: 440, d: 0.2, type: "sine", v: 0.12 }),
  boom: (c) => {
    noise(c, { d: 0.6, v: 0.5, lp: 700 });
    tone(c, { f: 140, f2: 40, d: 0.5, type: "sawtooth", v: 0.25 });
  },
  launch: (c) => {
    noise(c, { d: 0.8, v: 0.2, lp: 2500 });
    tone(c, { f: 200, f2: 900, d: 0.8, type: "sawtooth", v: 0.07 });
  },
  tick: (c) => tone(c, { f: 900, d: 0.04, type: "square", v: 0.04 }),
  levelup: (c) => [392, 523, 659, 784, 1047].forEach((f, i) => tone(c, { f, t: i * 0.1, d: 0.25, type: "triangle", v: 0.15 })),
};

export function play(name) {
  const c = ac();
  if (c && SOUNDS[name]) SOUNDS[name](c);
}
export const isMuted = () => muted;
export function setMuted(v) {
  muted = !!v;
  try {
    localStorage.setItem("cl-muted", muted ? "1" : "0");
  } catch {
    /* ignora */
  }
  window.dispatchEvent(new CustomEvent("cassinora:mute"));
  if (!muted) play("click");
}

// um "tic" suave em qualquer botão (instalado uma vez no Shell)
export function installClickSound() {
  const on = (e) => {
    const b = e.target.closest?.("button, .gcard-main");
    if (b && !b.disabled) play("click");
  };
  document.addEventListener("pointerdown", on, true);
  return () => document.removeEventListener("pointerdown", on, true);
}
