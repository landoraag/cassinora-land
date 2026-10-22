// Como o lobby organiza os jogos: linhas (categorias), cor de cada capa e atalhos da economia.
import { PVP_GAMES } from "./tables";

// Matiz (0–360) da capa de cada jogo.
export const HUES = {
  blackjack: 150, chicken: 45, coinflip: 48, roulette: 0, mines: 200, dice: 270, slots: 330, scratch: 38,
  hilo: 175, tower: 215, wheel: 350, baccarat: 300, vpoker: 120, crash: 16, plinko: 260, keno: 190,
  bingo: 30, truco: 100, uno: 355,
};

// Cada jogo aparece em uma linha só (as linhas "Multijogador" e "Mesas" são extras).
export const ROWS = [
  { id: "arcade", title: "🚀 Arcade & Crash", sub: "Resultado rápido, adrenalina alta", games: ["crash", "plinko", "mines", "tower", "chicken"] },
  { id: "cards", title: "🃏 Cartas", sub: "Estratégia e blefe", games: ["blackjack", "baccarat", "vpoker", "truco", "uno", "hilo"] },
  { id: "luck", title: "🍀 Sorte rápida", sub: "Aposte e veja no que dá", games: ["roulette", "coinflip", "dice", "scratch"] },
  { id: "classics", title: "🎰 Clássicos de cassino", sub: "Os de sempre, do jeito certo", games: ["wheel", "slots", "keno", "bingo"] },
];

// No modo mesa, o Vídeo Poker vira "Poker" (mesmo jogo, contra os amigos).
export const pvpKey = (id) => (PVP_GAMES[id] ? id : id === "vpoker" ? "poker" : null);
export const MULTI_IDS = ["blackjack", "baccarat", "vpoker", "truco", "uno", "hilo", "crash", "mines", "tower", "chicken", "roulette", "coinflip", "dice", "plinko", "wheel", "slots", "keno", "bingo", "scratch"];

// Atalhos para os painéis da economia (?abrir=…).
export const ECONOMY_TILES = [
  { id: "city", icon: "🏙️", name: "Cidade", desc: "Passeie e visite casas", hue: 190, to: "/cidade" },
  { id: "profile", icon: "🧑", name: "Meu perfil", desc: "Boneco, nome e foto", hue: 300, to: "/perfil" },
  { id: "work", icon: "💼", name: "Trabalhar", desc: "Minigame, sem espera", hue: 205 },
  { id: "shops", icon: "🛍️", name: "Lojas", desc: "Comida, casa, carro…", hue: 285 },
  { id: "bank", icon: "🏦", name: "Banco", desc: "Guardar e sacar", hue: 220 },
  { id: "charity", icon: "💝", name: "Caridade", desc: "Pontos sociais", hue: 335 },
  { id: "loans", icon: "🤝", name: "Empréstimos", desc: "Pedir e pagar", hue: 160 },
  { id: "pay", icon: "💸", name: "Pagar", desc: "Transferir moedas", hue: 130 },
  { id: "rob", icon: "🕵️", name: "Roubar", desc: "Arrisque a sorte", hue: 10 },
  { id: "persona", icon: "🧑", name: "Persona", desc: "Seu personagem", hue: 250 },
];

export const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
