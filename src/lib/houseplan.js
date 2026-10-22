// Planta da casa por nível: os cômodos crescem com a casa (kitnet → casa → apartamento → mansão).
// Medidas em "tiles" (x para a direita-baixo, y para a esquerda-baixo). Todos os cômodos formam um retângulo só,
// então dá para andar livremente dentro dele.
export const WALL_H = 112;

const SALA = (w, d) => ({ kind: "sala", name: "Sala", x: 0, y: 0, w, d, floor: "wood", wall: "#d9b48a" });

export function planFor(tier = 1) {
  const t = Math.max(1, Math.min(4, tier));
  if (t === 1)
    return { W: 10, D: 6, rooms: [{ kind: "kitnet", name: "Kitnet", x: 0, y: 0, w: 10, d: 6, floor: "wood", wall: "#d9b48a" }] };
  if (t === 2)
    return {
      W: 14,
      D: 11,
      rooms: [
        SALA(8, 6),
        { kind: "cozinha", name: "Cozinha", x: 8, y: 0, w: 6, d: 6, floor: "tile", wall: "#e3cf9a" },
        { kind: "quarto", name: "Quarto", x: 0, y: 6, w: 14, d: 5, floor: "dark", wall: "#b9a1c9" },
      ],
    };
  if (t === 3)
    return {
      W: 14,
      D: 11,
      rooms: [
        SALA(8, 6),
        { kind: "cozinha", name: "Cozinha", x: 8, y: 0, w: 6, d: 6, floor: "tile", wall: "#e3cf9a" },
        { kind: "quarto", name: "Quarto", x: 0, y: 6, w: 8, d: 5, floor: "dark", wall: "#b9a1c9" },
        { kind: "banheiro", name: "Banheiro", x: 8, y: 6, w: 6, d: 5, floor: "bath", wall: "#bfe0e8" },
      ],
    };
  return {
    W: 16,
    D: 13,
    rooms: [
      SALA(10, 7),
      { kind: "cozinha", name: "Cozinha", x: 10, y: 0, w: 6, d: 7, floor: "tile", wall: "#e3cf9a" },
      { kind: "quarto", name: "Quarto", x: 0, y: 7, w: 6, d: 6, floor: "dark", wall: "#b9a1c9" },
      { kind: "banheiro", name: "Banheiro", x: 6, y: 7, w: 4, d: 6, floor: "bath", wall: "#bfe0e8" },
      { kind: "escritorio", name: "Escritório", x: 10, y: 7, w: 6, d: 6, floor: "wood", wall: "#a9c0a0" },
    ],
  };
}
