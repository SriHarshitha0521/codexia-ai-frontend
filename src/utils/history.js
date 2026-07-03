// Lightweight "recent sessions" store so a user (especially a beginner
// experimenting with different snippets) can jump back to something
// they looked at earlier without retyping it.

const KEY = "codexi_history_v1";
const MAX_ITEMS = 20;

export function getHistory() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addHistoryEntry({ code, language, level, summary }) {
  try {
    const entries = getHistory();
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
      code,
      language,
      level,
      summary: (summary || "").slice(0, 160),
    };
    const next = [entry, ...entries].slice(0, MAX_ITEMS);
    localStorage.setItem(KEY, JSON.stringify(next));
    return next;
  } catch {
    return getHistory();
  }
}

export function clearHistory() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* no-op */
  }
}
