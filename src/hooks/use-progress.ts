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
  missionStatus,
  saveProgress,
  syncAchievements,
  withFreshDay,
  type DailyMission,
  type ProgressState,
} from "@/lib/progress";


type Listener = () => void;

let state: ProgressState | null = null;
const listeners = new Set<Listener>();

let syncedUserId: string | null = null;
let pushTimer: ReturnType<typeof setTimeout> | null = null;

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

function emit(next: ProgressState) {
  state = next;
  saveProgress(next);
  for (const listener of listeners) listener();
}

function schedulePush() {
  if (!syncedUserId) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    const userId = syncedUserId;
    if (!userId) return;
    void pushRemoteProgress(userId, getSnapshot());
  }, 800);
}

/** Called when a learner signs in: merge cloud progress with this device's progress. */
export async function startCloudSync(userId: string): Promise<void> {
  if (syncedUserId === userId) return;
  syncedUserId = userId;
  const remote = await fetchRemoteProgress(userId);
  const merged = remote ? mergeProgress(getSnapshot(), remote) : getSnapshot();
  emit(merged);
  await pushRemoteProgress(userId, merged);
}

export function stopCloudSync(): void {
  syncedUserId = null;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = null;
}

function setState(
  updater: (current: ProgressState) => ProgressState,
): [ProgressState, ProgressState] {
  const previous = getSnapshot();
  const next = syncAchievements(updater(withFreshDay(previous)));
  emit(next);
  schedulePush();
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
      awardXp(
        {
          ...current,
          correctAnswers: current.correctAnswers + 1,
          todayCorrect: current.todayCorrect + 1,
        },
        XP_PER_CORRECT_ANSWER,
      ),
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
          todayQuizzes: current.todayQuizzes + 1,
          perfectRounds: current.perfectRounds + (isPerfect ? 1 : 0),
        },
        XP_PER_QUIZ_ROUND,
      ),
    );
    return { xp: XP_PER_QUIZ_ROUND, unlocked: newlyUnlockedTitles(previous, next) };
  }, []);

  const recordTranslation = useCallback(() => {
    const [previous, next] = setState((current) =>
      awardXp(
        {
          ...current,
          translations: current.translations + 1,
          todayTranslations: current.todayTranslations + 1,
        },
        XP_PER_TRANSLATION,
      ),
    );
    return { xp: XP_PER_TRANSLATION, unlocked: newlyUnlockedTitles(previous, next) };
  }, []);

  /** Collects the bonus XP for a finished daily mission (once per day). */
  const claimMission = useCallback((mission: DailyMission) => {
    const current = getSnapshot();
    const status = missionStatus(withFreshDay(current), mission);
    if (!status.isComplete || status.isClaimed) return null;

    const [previous, next] = setState((state) =>
      awardXp({ ...state, claimedMissions: [...state.claimedMissions, mission.id] }, mission.reward),
    );
    return { xp: mission.reward, unlocked: newlyUnlockedTitles(previous, next) };
  }, []);

  const setDailyGoal = useCallback((dailyGoal: number) => {
    setState((current) => ({ ...current, dailyGoal }));
  }, []);

  return {
    progress,
    recordCorrectAnswer,
    recordQuizRound,
    recordTranslation,
    claimMission,
    setDailyGoal,
  };
}

