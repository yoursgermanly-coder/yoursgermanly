/**
 * Device-local vocabulary deck with SM-2 style spaced repetition.
 * Words are added from AI-generated topic packs and reviewed on a daily queue.
 */

export const MASTERY_STAGES = ["New", "Learning", "Familiar", "Mastered"] as const;
export type MasteryStage = (typeof MASTERY_STAGES)[number];

export type VocabularyWord = {
  id: string;
  german: string;
  english: string;
  article: string;
  example: string;
  exampleEnglish: string;
  topic: string;
  level: string;
  /** SM-2 state */
  repetitions: number;
  easeFactor: number;
  intervalDays: number;
  dueAt: number;
  reviewCount: number;
  correctCount: number;
  addedAt: number;
};

const STORAGE_KEY = "lernexa.vocabulary.v1";
const DAY_MS = 24 * 60 * 60 * 1000;

export function makeWordId(german: string) {
  return german.trim().toLowerCase().replace(/\s+/g, "-");
}

export function getMastery(word: VocabularyWord): MasteryStage {
  if (word.reviewCount === 0) return "New";
  if (word.repetitions >= 4 && word.intervalDays >= 21) return "Mastered";
  if (word.repetitions >= 2) return "Familiar";
  return "Learning";
}

export function loadDeck(): VocabularyWord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as VocabularyWord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveDeck(words: VocabularyWord[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
  } catch {
    // Storage unavailable — the deck simply isn't persisted on this device.
  }
}

export function createWord(input: {
  german: string;
  english: string;
  article: string;
  example: string;
  exampleEnglish: string;
  topic: string;
  level: string;
}): VocabularyWord {
  return {
    id: makeWordId(input.german),
    german: input.german,
    english: input.english,
    article: input.article,
    example: input.example,
    exampleEnglish: input.exampleEnglish,
    topic: input.topic,
    level: input.level,
    repetitions: 0,
    easeFactor: 2.5,
    intervalDays: 0,
    dueAt: Date.now(),
    reviewCount: 0,
    correctCount: 0,
    addedAt: Date.now(),
  };
}

export function addWords(deck: VocabularyWord[], incoming: VocabularyWord[]): VocabularyWord[] {
  const existing = new Set(deck.map((word) => word.id));
  const fresh = incoming.filter((word) => !existing.has(word.id));
  return [...fresh, ...deck];
}

export function removeWord(deck: VocabularyWord[], id: string): VocabularyWord[] {
  return deck.filter((word) => word.id !== id);
}

export function dueWords(deck: VocabularyWord[], now = Date.now()): VocabularyWord[] {
  return deck
    .filter((word) => word.dueAt <= now)
    .sort((a, b) => a.dueAt - b.dueAt);
}

/**
 * SM-2 update. `quality` 0-5; we map three learner buttons to 2 (again), 4 (good), 5 (easy).
 */
export function reviewWord(word: VocabularyWord, quality: number): VocabularyWord {
  const correct = quality >= 3;
  let { repetitions, easeFactor, intervalDays } = word;

  if (correct) {
    repetitions += 1;
    if (repetitions === 1) intervalDays = 1;
    else if (repetitions === 2) intervalDays = 6;
    else intervalDays = Math.round(intervalDays * easeFactor);
  } else {
    repetitions = 0;
    intervalDays = 0;
  }

  easeFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
  );

  return {
    ...word,
    repetitions,
    easeFactor,
    intervalDays,
    dueAt: Date.now() + (correct ? intervalDays * DAY_MS : 10 * 60 * 1000),
    reviewCount: word.reviewCount + 1,
    correctCount: word.correctCount + (correct ? 1 : 0),
  };
}

export function deckStats(deck: VocabularyWord[]) {
  const counts: Record<MasteryStage, number> = {
    New: 0,
    Learning: 0,
    Familiar: 0,
    Mastered: 0,
  };
  for (const word of deck) counts[getMastery(word)] += 1;
  return { total: deck.length, due: dueWords(deck).length, counts };
}

export function formatNextReview(word: VocabularyWord) {
  const diff = word.dueAt - Date.now();
  if (diff <= 0) return "Due now";
  const days = Math.round(diff / DAY_MS);
  if (days >= 1) return `In ${days} day${days === 1 ? "" : "s"}`;
  const minutes = Math.max(1, Math.round(diff / 60000));
  return `In ${minutes} min`;
}
