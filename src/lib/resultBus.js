// Avisa a tela inteira que uma partida acabou (a animação de vitória/derrota fica em ResultOverlay).
// net > 0 ganhou · net < 0 perdeu · 0 empate (aposta devolvida).
const seen = new Set();
export function announceResult({ key, net, game, text, table = false }) {
  if (key) {
    if (seen.has(key)) return;
    seen.add(key);
    if (seen.size > 200) seen.delete(seen.values().next().value);
  }
  window.dispatchEvent(new CustomEvent("cassinora:result", { detail: { net: Math.round(net || 0), game, text, table } }));
}
