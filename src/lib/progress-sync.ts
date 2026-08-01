/**
 * Maps the local progress shape to the cloud row and merges the two so a learner
 * never loses XP when they sign in on a new device.
 */
import { supabase } from "@/integrations/supabase/client";
import { INITIAL_PROGRESS, getDayKey, syncAchievements, type ProgressState } from "@/lib/progress";

type ProgressRow = {
  total_xp: number;
  daily_goal: number;
  today_key: string;
  today_xp: number;
  streak: number;
  best_streak: number;
  last_active_day: string | null;
  quizzes_completed: number;
  correct_answers: number;
  translations: number;
  perfect_rounds: number;
  unlocked_achievements: string[];
};

export function rowToState(row: ProgressRow): ProgressState {
  return {
    totalXp: row.total_xp,
    dailyGoal: row.daily_goal,
    todayKey: row.today_key,
    todayXp: row.today_xp,
    streak: row.streak,
    bestStreak: row.best_streak,
    lastActiveDay: row.last_active_day,
    quizzesCompleted: row.quizzes_completed,
    correctAnswers: row.correct_answers,
    translations: row.translations,
    perfectRounds: row.perfect_rounds,
    unlockedAchievements: row.unlocked_achievements ?? [],
  };
}

export function stateToRow(state: ProgressState): ProgressRow {
  return {
    total_xp: state.totalXp,
    daily_goal: state.dailyGoal,
    today_key: state.todayKey,
    today_xp: state.todayXp,
    streak: state.streak,
    best_streak: state.bestStreak,
    last_active_day: state.lastActiveDay,
    quizzes_completed: state.quizzesCompleted,
    correct_answers: state.correctAnswers,
    translations: state.translations,
    perfect_rounds: state.perfectRounds,
    unlocked_achievements: state.unlockedAchievements,
  };
}

/** Keeps the best of both worlds when local device progress meets cloud progress. */
export function mergeProgress(local: ProgressState, remote: ProgressState): ProgressState {
  const today = getDayKey();
  const localToday = local.todayKey === today ? local.todayXp : 0;
  const remoteToday = remote.todayKey === today ? remote.todayXp : 0;

  return syncAchievements({
    ...INITIAL_PROGRESS,
    totalXp: Math.max(local.totalXp, remote.totalXp),
    dailyGoal: remote.dailyGoal || local.dailyGoal,
    todayKey: today,
    todayXp: Math.max(localToday, remoteToday),
    streak: Math.max(local.streak, remote.streak),
    bestStreak: Math.max(local.bestStreak, remote.bestStreak),
    lastActiveDay:
      [local.lastActiveDay, remote.lastActiveDay].filter(Boolean).sort().pop() ?? null,
    quizzesCompleted: Math.max(local.quizzesCompleted, remote.quizzesCompleted),
    correctAnswers: Math.max(local.correctAnswers, remote.correctAnswers),
    translations: Math.max(local.translations, remote.translations),
    perfectRounds: Math.max(local.perfectRounds, remote.perfectRounds),
    unlockedAchievements: Array.from(
      new Set([...local.unlockedAchievements, ...remote.unlockedAchievements]),
    ),
  });
}

export async function fetchRemoteProgress(userId: string): Promise<ProgressState | null> {
  const { data, error } = await supabase
    .from("learning_progress")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return rowToState(data as unknown as ProgressRow);
}

export async function pushRemoteProgress(userId: string, state: ProgressState): Promise<void> {
  await supabase
    .from("learning_progress")
    .upsert({ user_id: userId, ...stateToRow(state) }, { onConflict: "user_id" });
}
