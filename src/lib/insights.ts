/**
 * Device-local learning analytics: which skills a learner practises, how accurate
 * they are, and how much XP they earn each day. Used to personalise their plan.
 */

export const SKILLS = [
  { id: "quiz", label: "Grammar quiz", emoji: "🎯", to: "/quiz" },
  { id: "vocabulary", label: "Vocabulary", emoji: "📚", to: "/vocabulary" },
  { id: "translate", label: "Translation", emoji: "🔁", to: "/translate" },
  { id: "grammar", label: "Grammar lessons", emoji: "📘", to: "/grammar" },
  { id: "speaking", label: "Speaking", emoji: "🎤", to: "/speak" },
  { id: "conversation", label: "Conversation", emoji: "💬", to: "/conversation" },
] as const;

export type SkillId = (typeof SKILLS)[number]["id"];

export type ActivityEvent = {
  day: string;
  skill: SkillId;
  xp: number;
  correct: number;
  total: number;
};

const STORAGE_KEY = "lernexa.insights.v1";
const MAX_EVENTS = 600;

function dayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function readEvents(): ActivityEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as ActivityEvent[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const listeners = new Set<() => void>();
let cache: ActivityEvent[] | null = null;

function emit(events: ActivityEvent[]) {
  cache = events;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch {
    /* storage full or unavailable — analytics are best effort */
  }
  listeners.forEach((listener) => listener());
}

export function subscribeToInsights(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getActivity(): ActivityEvent[] {
  if (cache === null) cache = readEvents();
  return cache;
}

const EMPTY: ActivityEvent[] = [];
export function getServerActivity(): ActivityEvent[] {
  return EMPTY;
}

/** Records one practice event. `correct`/`total` are optional accuracy signals. */
export function logActivity(skill: SkillId, xp: number, correct = 0, total = 0): void {
  if (typeof window === "undefined") return;
  const events = [...getActivity(), { day: dayKey(), skill, xp, correct, total }];
  emit(events.slice(-MAX_EVENTS));
}

export function clearActivity(): void {
  emit([]);
}

export type SkillStat = {
  id: SkillId;
  label: string;
  emoji: string;
  to: string;
  xp: number;
  sessions: number;
  accuracy: number | null;
  /** 0-100 relative strength, used for the radar chart. */
  score: number;
};

export type DailyXp = { day: string; label: string; xp: number };

export type Insights = {
  skills: SkillStat[];
  daily: DailyXp[];
  weekXp: number;
  activeDays: number;
  totalSessions: number;
  weakest: SkillStat | null;
  strongest: SkillStat | null;
  untouched: SkillStat[];
};

export function buildInsights(events: ActivityEvent[], days = 7): Insights {
  const daily: DailyXp[] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - offset);
    const key = dayKey(date);
    daily.push({
      day: key,
      label: date.toLocaleDateString(undefined, { weekday: "short" }),
      xp: events.filter((event) => event.day === key).reduce((sum, event) => sum + event.xp, 0),
    });
  }

  const skills: SkillStat[] = SKILLS.map((skill) => {
    const own = events.filter((event) => event.skill === skill.id);
    const xp = own.reduce((sum, event) => sum + event.xp, 0);
    const graded = own.filter((event) => event.total > 0);
    const correct = graded.reduce((sum, event) => sum + event.correct, 0);
    const total = graded.reduce((sum, event) => sum + event.total, 0);
    return {
      ...skill,
      xp,
      sessions: own.length,
      accuracy: total > 0 ? Math.round((correct / total) * 100) : null,
      score: 0,
    };
  });

  const maxXp = Math.max(1, ...skills.map((skill) => skill.xp));
  for (const skill of skills) {
    const practice = (skill.xp / maxXp) * 100;
    skill.score = Math.round(
      skill.accuracy === null ? practice : practice * 0.6 + skill.accuracy * 0.4,
    );
  }

  const practised = skills.filter((skill) => skill.sessions > 0);
  const sorted = [...practised].sort((a, b) => a.score - b.score);

  return {
    skills,
    daily,
    weekXp: daily.reduce((sum, entry) => sum + entry.xp, 0),
    activeDays: daily.filter((entry) => entry.xp > 0).length,
    totalSessions: events.length,
    weakest: sorted[0] ?? null,
    strongest: sorted[sorted.length - 1] ?? null,
    untouched: skills.filter((skill) => skill.sessions === 0),
  };
}
