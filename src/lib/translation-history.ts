/**
 * Device-local translation cache + history.
 * The cache makes repeated phrases instant (no AI round-trip), the history
 * lets learners revisit and star phrases they want to remember.
 */

import type { Translation, TranslationDirection } from "./lernexa-schemas";

const STORAGE_KEY = "lernexa.translations.v1";
const MAX_ENTRIES = 50;

export type TranslationEntry = {
  id: string;
  source: string;
  direction: TranslationDirection;
  result: Translation;
  createdAt: number;
  favorite: boolean;
};

export function cacheKey(source: string, direction: TranslationDirection) {
  return `${direction}::${source.trim().toLowerCase()}`;
}

export function loadHistory(): TranslationEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as TranslationEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveHistory(entries: TranslationEntry[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch {
    // storage full or unavailable — history is a nicety, never block the UI
  }
}

export function findCached(
  entries: TranslationEntry[],
  source: string,
  direction: TranslationDirection,
) {
  const key = cacheKey(source, direction);
  return entries.find((entry) => cacheKey(entry.source, entry.direction) === key) ?? null;
}

export function upsertEntry(
  entries: TranslationEntry[],
  entry: TranslationEntry,
): TranslationEntry[] {
  const key = cacheKey(entry.source, entry.direction);
  const rest = entries.filter((item) => cacheKey(item.source, item.direction) !== key);
  return [entry, ...rest].slice(0, MAX_ENTRIES);
}
