/**
 * Device-local learning progress: XP, levels, streaks, daily goal and achievements.
 * Stored in localStorage so Phase 2 motivation features work without an account.
 */

export const XP_PER_CORRECT_ANSWER = 10;
export const XP_PER_QUIZ_ROUND = 15;
export const XP_PER_TRANSLATION = 5;
export const DAILY_GOAL_OPTIONS = [30, 50, 100, 150] as const;
export const DEFAULT_DAILY_GOAL = 50;

const STORAGE_KEY = "lernexa.progress.v1";

export const MAX_STREAK_FREEZES = 3;
/** A freeze is granted every time the streak crosses one of these milestones. */
const FREEZE_MILESTONE = 5;

export type ProgressState = {
  totalXp: number;
  dailyGoal: number;
  todayKey: string;
  todayXp: number;
  streak: number;
  bestStreak: number;
  lastActiveDay: string | null;
  quizzesCompleted: number;
  correctAnswers: number;
  translations: number;
  perfectRounds: number;
  unlockedAchievements: string[];
  todayCorrect: number;
  todayQuizzes: number;
  todayTranslations: number;
  claimedMissions: string[];
  streakFreezes: number;
  freezesUsed: number;
};

export const INITIAL_PROGRESS: ProgressState = {
  totalXp: 0,
  dailyGoal: DEFAULT_DAILY_GOAL,
  todayKey: "",
  todayXp: 0,
  streak: 0,
  bestStreak: 0,
  lastActiveDay: null,
  quizzesCompleted: 0,
  correctAnswers: 0,
  translations: 0,
  perfectRounds: 0,
  unlockedAchievements: [],
  todayCorrect: 0,
  todayQuizzes: 0,
  todayTranslations: 0,
  claimedMissions: [],
  streakFreezes: 1,
  freezesUsed: 0,
};

export type DailyMission = {
  id: string;
  title: string;
  description: string;
  emoji: string;
  reward: number;
  target: number;
  current: (state: ProgressState) => number;
};

/** Three light missions that reset every calendar day. */
export const DAILY_MISSIONS: DailyMission[] = [
  {
    id: "mission-xp",
    title: "Warm-up",
    description: "Earn 20 XP today.",
    emoji: "⚡",
    reward: 15,
    target: 20,
    current: (state) => state.todayXp,
  },
  {
    id: "mission-correct",
    title: "Sharp shooter",
    description: "Get 5 answers right today.",
    emoji: "🎯",
    reward: 20,
    target: 5,
    current: (state) => state.todayCorrect,
  },
  {
    id: "mission-translate",
    title: "Phrase collector",
    description: "Translate 3 phrases today.",
    emoji: "🔤",
    reward: 10,
    target: 3,
    current: (state) => state.todayTranslations,
  },
];

export function missionStatus(state: ProgressState, mission: DailyMission) {
  const current = Math.min(mission.current(state), mission.target);
  return {
    current,
    percent: Math.round((current / mission.target) * 100),
    isComplete: current >= mission.target,
    isClaimed: state.claimedMissions.includes(mission.id),
  };
}


export type Achievement = {
  id: string;
  title: string;
  description: string;
  emoji: string;
  isUnlocked: (state: ProgressState) => boolean;
};

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-steps",
    title: "Erste Schritte",
    description: "Earn your very first XP.",
    emoji: "🌱",
    isUnlocked: (state) => state.totalXp > 0,
  },
  {
    id: "goal-getter",
    title: "Goal getter",
    description: "Hit your daily XP goal once.",
    emoji: "🎯",
    isUnlocked: (state) => state.todayXp >= state.dailyGoal,
  },
  {
    id: "quiz-rookie",
    title: "Quiz rookie",
    description: "Finish 3 quiz rounds.",
    emoji: "🧠",
    isUnlocked: (state) => state.quizzesCompleted >= 3,
  },
  {
    id: "perfect-round",
    title: "Perfekt!",
    description: "Answer a whole round correctly.",
    emoji: "💯",
    isUnlocked: (state) => state.perfectRounds >= 1,
  },
  {
    id: "wordsmith",
    title: "Wordsmith",
    description: "Translate 10 phrases.",
    emoji: "✍️",
    isUnlocked: (state) => state.translations >= 10,
  },
  {
    id: "streak-3",
    title: "Three in a row",
    description: "Keep a 3-day streak.",
    emoji: "🔥",
    isUnlocked: (state) => state.bestStreak >= 3,
  },
  {
    id: "streak-7",
    title: "Weekly warrior",
    description: "Keep a 7-day streak.",
    emoji: "🏆",
    isUnlocked: (state) => state.bestStreak >= 7,
  },
  {
    id: "xp-500",
    title: "500 club",
    description: "Collect 500 XP in total.",
    emoji: "⭐",
    isUnlocked: (state) => state.totalXp >= 500,
  },
];

export const LEVEL_TITLES = ["Beginner", "Explorer", "Achiever", "Advanced", "Master"] as const;

export function getDayKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getYesterdayKey(): string {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return getDayKey(date);
}

export function getLevel(totalXp: number) {
  const level = Math.floor(totalXp / 250) + 1;
  const xpIntoLevel = totalXp % 250;
  return {
    level,
    title: LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)],
    xpIntoLevel,
    xpForNextLevel: 250,
    percent: Math.round((xpIntoLevel / 250) * 100),
  };
}

/** Rolls the daily counter over when the calendar day changed. */
export function withFreshDay(state: ProgressState): ProgressState {
  const today = getDayKey();
  if (state.todayKey === today) return state;
  return { ...state, todayKey: today, todayXp: 0 };
}

export function awardXp(state: ProgressState, amount: number): ProgressState {
  const today = getDayKey();
  const base = withFreshDay(state);
  const isNewDay = base.lastActiveDay !== today;
  const streak = isNewDay
    ? base.lastActiveDay === getYesterdayKey()
      ? base.streak + 1
      : 1
    : base.streak;

  const next: ProgressState = {
    ...base,
    totalXp: base.totalXp + amount,
    todayXp: base.todayXp + amount,
    streak,
    bestStreak: Math.max(base.bestStreak, streak),
    lastActiveDay: today,
  };

  return syncAchievements(next);
}

export function syncAchievements(state: ProgressState): ProgressState {
  const unlocked = new Set(state.unlockedAchievements);
  for (const achievement of ACHIEVEMENTS) {
    if (achievement.isUnlocked(state)) unlocked.add(achievement.id);
  }
  return { ...state, unlockedAchievements: Array.from(unlocked) };
}

export function loadProgress(): ProgressState {
  if (typeof window === "undefined") return INITIAL_PROGRESS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...INITIAL_PROGRESS, todayKey: getDayKey() };
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    return withFreshDay({ ...INITIAL_PROGRESS, ...parsed });
  } catch {
    return { ...INITIAL_PROGRESS, todayKey: getDayKey() };
  }
}

export function saveProgress(state: ProgressState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage can be unavailable (private mode) — progress simply isn't persisted.
  }
}
