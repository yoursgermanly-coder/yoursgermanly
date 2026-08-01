import { useCallback, useSyncExternalStore } from "react";

import { fetchRemoteProgress, mergeProgress, pushRemoteProgress } from "@/lib/progress-sync";
import {
  ACHIEVEMENTS,
  INITIAL_PROGRESS,
  XP_PER_CORRECT_ANSWER,
  XP_PER_QUIZ_ROUND,
  XP_PER_TRANSLATION,
  awardXp,
  loadProgress,
  saveProgress,
  syncAchievements,
  withFreshDay,
  type ProgressState,
} from "@/lib/progress";

type Listener = () => void;

let state: ProgressState | null = null;
const listeners = new Set<Listener>();

function getSnapshot(): ProgressState {
  if (!state) state = loadProgress();
  return state;
}

function getServerSnapshot(): ProgressState {
  return INITIAL_PROGRESS;
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setState(
  updater: (current: ProgressState) => ProgressState,
): [ProgressState, ProgressState] {
  const previous = getSnapshot();
  const next = syncAchievements(updater(withFreshDay(previous)));
  state = next;
  saveProgress(next);
  for (const listener of listeners) listener();
  return [previous, next];
}

function newlyUnlockedTitles(previous: ProgressState, next: ProgressState) {
  const before = new Set(previous.unlockedAchievements);
  return ACHIEVEMENTS.filter(
    (achievement) => next.unlockedAchievements.includes(achievement.id) && !before.has(achievement.id),
  );
}

export function useProgress() {
  const progress = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const recordCorrectAnswer = useCallback(() => {
    const [previous, next] = setState((current) =>
      awardXp({ ...current, correctAnswers: current.correctAnswers + 1 }, XP_PER_CORRECT_ANSWER),
    );
    return { xp: XP_PER_CORRECT_ANSWER, unlocked: newlyUnlockedTitles(previous, next) };
  }, []);

  const recordQuizRound = useCallback((score: number, total: number) => {
    const isPerfect = total > 0 && score === total;
    const [previous, next] = setState((current) =>
      awardXp(
        {
          ...current,
          quizzesCompleted: current.quizzesCompleted + 1,
          perfectRounds: current.perfectRounds + (isPerfect ? 1 : 0),
        },
        XP_PER_QUIZ_ROUND,
      ),
    );
    return { xp: XP_PER_QUIZ_ROUND, unlocked: newlyUnlockedTitles(previous, next) };
  }, []);

  const recordTranslation = useCallback(() => {
    const [previous, next] = setState((current) =>
      awardXp({ ...current, translations: current.translations + 1 }, XP_PER_TRANSLATION),
    );
    return { xp: XP_PER_TRANSLATION, unlocked: newlyUnlockedTitles(previous, next) };
  }, []);

  const setDailyGoal = useCallback((dailyGoal: number) => {
    setState((current) => ({ ...current, dailyGoal }));
  }, []);

  return { progress, recordCorrectAnswer, recordQuizRound, recordTranslation, setDailyGoal };
}
