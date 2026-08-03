/**
 * Device-local grammar lesson state: which topics a learner has completed.
 */

export type GrammarTopic = {
  id: string;
  title: string;
  germanTitle: string;
  level: "A1" | "A2" | "B1" | "B2";
  summary: string;
  emoji: string;
};

export const GRAMMAR_TOPICS: GrammarTopic[] = [
  {
    id: "articles",
    title: "Articles: der, die, das",
    germanTitle: "Die Artikel",
    level: "A1",
    summary: "Every German noun has a gender. Learn how to spot and use the right article.",
    emoji: "🧩",
  },
  {
    id: "present-tense",
    title: "Present tense verbs",
    germanTitle: "Das Präsens",
    level: "A1",
    summary: "Say what you do every day with regular verb endings.",
    emoji: "⏱️",
  },
  {
    id: "sein-haben",
    title: "sein & haben",
    germanTitle: "sein und haben",
    level: "A1",
    summary: "The two most useful German verbs — to be and to have.",
    emoji: "⭐",
  },
  {
    id: "plurals",
    title: "Plural nouns",
    germanTitle: "Der Plural",
    level: "A1",
    summary: "Turning one thing into many, and why 'die' shows up everywhere.",
    emoji: "👥",
  },
  {
    id: "word-order",
    title: "Word order basics",
    germanTitle: "Die Wortstellung",
    level: "A2",
    summary: "Why the verb loves position two in a German sentence.",
    emoji: "🔀",
  },
  {
    id: "accusative",
    title: "Accusative case",
    germanTitle: "Der Akkusativ",
    level: "A2",
    summary: "When 'der' becomes 'den' — the direct object case made simple.",
    emoji: "🎯",
  },
  {
    id: "dative",
    title: "Dative case",
    germanTitle: "Der Dativ",
    level: "A2",
    summary: "Giving something to someone: dem, der, dem, den.",
    emoji: "🎁",
  },
  {
    id: "modal-verbs",
    title: "Modal verbs",
    germanTitle: "Modalverben",
    level: "A2",
    summary: "können, müssen, wollen — say what you can, must and want to do.",
    emoji: "🔑",
  },
  {
    id: "perfect-tense",
    title: "Perfect tense (past)",
    germanTitle: "Das Perfekt",
    level: "B1",
    summary: "Talk about yesterday with haben/sein plus a past participle.",
    emoji: "🕰️",
  },
  {
    id: "separable-verbs",
    title: "Separable verbs",
    germanTitle: "Trennbare Verben",
    level: "B1",
    summary: "Verbs that split in two and send their prefix to the end.",
    emoji: "✂️",
  },
  {
    id: "adjective-endings",
    title: "Adjective endings",
    germanTitle: "Adjektivendungen",
    level: "B1",
    summary: "Ein guter Kaffee: how adjectives change to match the noun.",
    emoji: "🎨",
  },
  {
    id: "subordinate-clauses",
    title: "Subordinate clauses",
    germanTitle: "Nebensätze",
    level: "B2",
    summary: "weil, dass, wenn — and the verb that jumps to the very end.",
    emoji: "🔗",
  },
];

const STORAGE_KEY = "lernexa.grammar.v1";

export type GrammarState = {
  completed: string[];
};

const INITIAL_STATE: GrammarState = { completed: [] };

export function loadGrammarState(): GrammarState {
  if (typeof window === "undefined") return INITIAL_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_STATE;
    const parsed = JSON.parse(raw) as Partial<GrammarState>;
    return { completed: Array.isArray(parsed.completed) ? parsed.completed : [] };
  } catch {
    return INITIAL_STATE;
  }
}

export function saveGrammarState(state: GrammarState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage can be unavailable in private mode — progress simply won't persist.
  }
}

export function markTopicComplete(topicId: string): GrammarState {
  const state = loadGrammarState();
  if (state.completed.includes(topicId)) return state;
  const next: GrammarState = { completed: [...state.completed, topicId] };
  saveGrammarState(next);
  return next;
}
