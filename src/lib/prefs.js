import { useCallback, useState } from "react";

// Listas pequenas guardadas no aparelho (favoritos, jogados recentemente). Sem armazenamento: só não lembra.
function read(key) {
  try {
    const v = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
function write(key, list) {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    /* sem armazenamento */
  }
}

export function useStoredList(key, max = 30) {
  const [list, setList] = useState(() => read(key));
  // coloca o item na frente (sem repetir)
  const push = useCallback(
    (id) =>
      setList((l) => {
        const next = [id, ...l.filter((x) => x !== id)].slice(0, max);
        write(key, next);
        return next;
      }),
    [key, max]
  );
  // liga/desliga o item
  const toggle = useCallback(
    (id) =>
      setList((l) => {
        const next = l.includes(id) ? l.filter((x) => x !== id) : [id, ...l].slice(0, max);
        write(key, next);
        return next;
      }),
    [key, max]
  );
  return [list, { push, toggle }];
}
