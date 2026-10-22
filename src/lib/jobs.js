// Carreiras e trabalhos. Cada carreira é uma escada: você começa no primeiro degrau e sobe trabalhando
// (cada turno dá pontos da carreira) ou comprando a formação na Escola. Degrau mais alto = mais difícil,
// paga mais, cansa e machuca mais. O que você recebe depende da dificuldade E dos acertos.
//   diff 1..5 · pay = faixa base · tasks = tipos de tarefa (components/WorkGame.jsx)
//   energy = custo de energia · health = custo de saúde por turno · fame = fama máxima por turno

// pontos de carreira para chegar em cada nível (nível 0 = começo)
export const CAREER_XP = [0, 30, 90, 200, 400];
export const careerLevelOf = (xp) => CAREER_XP.reduce((lv, need, i) => (Number(xp) >= need ? i : lv), 0);

export const CAREERS = [
  { id: "comercio", name: "Comércio", icon: "🛒", outfit: "apron", desc: "Do caixa ao dono da loja." },
  { id: "saude", name: "Medicina", icon: "🩺", outfit: "coat", desc: "Contas e memória: de auxiliar a cirurgião." },
  { id: "tecnologia", name: "Tecnologia", icon: "💻", outfit: "hoodie", desc: "Lógica e sequências." },
  { id: "transporte", name: "Transporte", icon: "🚚", outfit: "tee", acc: "cap", desc: "Reflexo e atenção." },
  { id: "gastronomia", name: "Gastronomia", icon: "👨‍🍳", outfit: "apron", desc: "Do ajudante ao chef." },
  { id: "negocios", name: "Negócios", icon: "💼", outfit: "suit", desc: "Contas e decisões de terno." },
];
export const CAREERS_BY_ID = Object.fromEntries(CAREERS.map((c) => [c.id, c]));

// lvl = nível de carreira necessário (0 a 4)
export const JOB_LIST = [
  { id: "caixa", career: "comercio", lvl: 0, name: "Operador de caixa", icon: "🛒", diff: 1, pay: [80, 130], tasks: ["troco", "conta", "ordem"], energy: 6, health: 1, fame: 1 },
  { id: "atendente", career: "comercio", lvl: 1, name: "Atendente", icon: "🎧", diff: 2, pay: [150, 230], tasks: ["digitar", "troco", "memoria"], energy: 8, health: 2, fame: 2 },
  { id: "gerente-loja", career: "comercio", lvl: 2, name: "Gerente de loja", icon: "🏪", diff: 3, pay: [280, 420], tasks: ["conta", "ordem", "sequencia"], energy: 11, health: 3, fame: 4 },
  { id: "dono-loja", career: "comercio", lvl: 3, name: "Dono de rede", icon: "🏬", diff: 4, pay: [520, 780], tasks: ["conta", "sequencia", "memoria"], energy: 14, health: 4, fame: 7 },

  { id: "aux-enfermagem", career: "saude", lvl: 0, name: "Auxiliar de enfermagem", icon: "🩹", diff: 1, pay: [90, 140], tasks: ["conta", "memoria", "ordem"], energy: 7, health: 2, fame: 1 },
  { id: "enfermeiro", career: "saude", lvl: 1, name: "Enfermeiro", icon: "💉", diff: 2, pay: [170, 260], tasks: ["conta", "memoria", "sequencia"], energy: 9, health: 3, fame: 2 },
  { id: "medico", career: "saude", lvl: 2, name: "Médico", icon: "🩺", diff: 3, pay: [320, 480], tasks: ["conta", "sequencia", "memoria", "conta"], energy: 12, health: 4, fame: 5 },
  { id: "cirurgiao", career: "saude", lvl: 3, name: "Cirurgião", icon: "🥼", diff: 5, pay: [900, 1400], tasks: ["memoria", "sequencia", "reflexo", "conta"], energy: 20, health: 8, fame: 10 },

  { id: "suporte", career: "tecnologia", lvl: 0, name: "Suporte técnico", icon: "🎧", diff: 1, pay: [90, 140], tasks: ["digitar", "sequencia", "ordem"], energy: 6, health: 1, fame: 1 },
  { id: "programador", career: "tecnologia", lvl: 1, name: "Programador", icon: "💻", diff: 3, pay: [300, 450], tasks: ["sequencia", "digitar", "memoria", "conta"], energy: 12, health: 3, fame: 4 },
  { id: "engenheiro", career: "tecnologia", lvl: 2, name: "Engenheiro de software", icon: "🛠️", diff: 4, pay: [520, 780], tasks: ["sequencia", "conta", "memoria"], energy: 15, health: 4, fame: 6 },
  { id: "arquiteto", career: "tecnologia", lvl: 3, name: "Arquiteto de sistemas", icon: "🏗️", diff: 5, pay: [950, 1450], tasks: ["sequencia", "conta", "memoria", "digitar"], energy: 19, health: 5, fame: 9 },

  { id: "entregador", career: "transporte", lvl: 0, name: "Entregador", icon: "🛵", diff: 1, pay: [90, 140], tasks: ["reflexo", "ordem", "troco"], energy: 8, health: 3, fame: 1 },
  { id: "motorista", career: "transporte", lvl: 1, name: "Motorista", icon: "🚕", diff: 2, pay: [160, 250], tasks: ["reflexo", "sequencia", "ordem"], energy: 10, health: 4, fame: 2 },
  { id: "mecanico", career: "transporte", lvl: 2, name: "Mecânico", icon: "🔧", diff: 3, pay: [290, 430], tasks: ["sequencia", "reflexo", "conta", "ordem"], energy: 12, health: 5, fame: 4 },
  { id: "piloto", career: "transporte", lvl: 3, name: "Piloto de corrida", icon: "🏎️", diff: 5, pay: [1000, 1500], tasks: ["reflexo", "sequencia", "ordem", "reflexo"], energy: 22, health: 12, fame: 14 },

  { id: "ajudante-cozinha", career: "gastronomia", lvl: 0, name: "Ajudante de cozinha", icon: "🥣", diff: 1, pay: [85, 135], tasks: ["ordem", "memoria", "conta"], energy: 7, health: 2, fame: 1 },
  { id: "cozinheiro", career: "gastronomia", lvl: 1, name: "Cozinheiro", icon: "🍳", diff: 2, pay: [160, 250], tasks: ["memoria", "ordem", "conta"], energy: 9, health: 3, fame: 2 },
  { id: "chef", career: "gastronomia", lvl: 2, name: "Chef", icon: "👨‍🍳", diff: 4, pay: [540, 800], tasks: ["memoria", "sequencia", "conta", "reflexo"], energy: 15, health: 5, fame: 8 },

  { id: "estagiario", career: "negocios", lvl: 0, name: "Estagiário", icon: "📎", diff: 1, pay: [85, 135], tasks: ["digitar", "conta", "ordem"], energy: 6, health: 1, fame: 1 },
  { id: "analista", career: "negocios", lvl: 1, name: "Analista", icon: "📊", diff: 3, pay: [290, 440], tasks: ["conta", "sequencia", "digitar"], energy: 11, health: 2, fame: 3 },
  { id: "gerente", career: "negocios", lvl: 2, name: "Gerente", icon: "👔", diff: 4, pay: [520, 790], tasks: ["conta", "sequencia", "memoria"], energy: 14, health: 3, fame: 6 },
  { id: "executivo", career: "negocios", lvl: 3, name: "Executivo (CEO)", icon: "🏢", diff: 5, pay: [950, 1450], tasks: ["conta", "sequencia", "memoria", "digitar"], energy: 18, health: 4, fame: 12 },
];
export const JOBS_BY_ID = Object.fromEntries(JOB_LIST.map((j) => [j.id, j]));
export const jobsOf = (careerId) => JOB_LIST.filter((j) => j.career === careerId);
export const rankName = (careerId, level) => {
  const list = jobsOf(careerId);
  return (list[Math.min(level, list.length - 1)] || list[0]).name;
};
export const DIFF_LABEL = ["", "Fácil", "Médio", "Difícil", "Muito difícil", "Extremo"];

// Pagamento conforme os acertos (ratio 0..1). Em trabalho difícil a curva é mais exigente.
export const QUALITY_MAX = 1.5;
export const qualityMin = (diff) => Math.max(0.05, 0.3 - 0.06 * (diff - 1));
export function jobQuality(ratio, diff) {
  const r = Math.max(0, Math.min(1, ratio));
  const min = qualityMin(diff);
  return min + (QUALITY_MAX - min) * Math.pow(r, 1 + 0.3 * (diff - 1));
}

// Formações (Escola): comprar o degrau leva a carreira direto àquele nível. Preço por degrau.
export const FORMATION_PRICE = [0, 800, 3000, 9000, 25000];
export const careerXpFor = (level) => CAREER_XP[Math.max(0, Math.min(CAREER_XP.length - 1, level))];
