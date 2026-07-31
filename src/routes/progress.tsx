import { createFileRoute } from "@tanstack/react-router";
import { Flame, Lock, Sparkles, Target, Trophy } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useProgress } from "@/hooks/use-progress";
import { ACHIEVEMENTS, DAILY_GOAL_OPTIONS, getLevel } from "@/lib/progress";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "Your German Progress & Achievements | Lernexa" },
      {
        name: "description",
        content:
          "Track your daily XP goal, learning streak, level and unlocked achievements as you learn German with Lernexa.",
      },
      { property: "og:title", content: "Your German Progress & Achievements | Lernexa" },
      {
        property: "og:description",
        content: "Streaks, XP levels and achievement badges that keep your German practice going.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProgressPage,
});

function ProgressPage() {
  const { progress, setDailyGoal } = useProgress();
  const level = getLevel(progress.totalXp);
  const goalPercent = Math.min(100, Math.round((progress.todayXp / progress.dailyGoal) * 100));

  return (
    <AppShell title="Your progress" subtitle="Every小 step counts — keep the streak alive.">
      <Card className="shadow-soft rounded-3xl border-none p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Level {level.level}
            </p>
            <h2 className="text-xl">{level.title}</h2>
          </div>
          <span className="bg-brand-gradient text-primary-foreground flex size-12 items-center justify-center rounded-2xl">
            <Sparkles className="size-6" aria-hidden="true" />
          </span>
        </div>
        <Progress value={level.percent} className="mt-4 h-2" />
        <p className="mt-2 text-xs text-muted-foreground">
          {level.xpIntoLevel} / {level.xpForNextLevel} XP to level {level.level + 1}
        </p>
      </Card>

      <div className="mt-3 grid grid-cols-3 gap-3">
        <StatTile icon={<Flame className="size-5" aria-hidden="true" />} label="Streak" value={`${progress.streak}d`} />
        <StatTile icon={<Trophy className="size-5" aria-hidden="true" />} label="Total XP" value={`${progress.totalXp}`} />
        <StatTile
          icon={<Target className="size-5" aria-hidden="true" />}
          label="Today"
          value={`${progress.todayXp} XP`}
        />
      </div>

      <Card className="shadow-soft mt-3 rounded-3xl border-none p-5">
        <h2 className="text-base font-bold">Daily goal</h2>
        <Progress value={goalPercent} className="mt-3 h-2" />
        <p className="mt-2 text-sm text-muted-foreground">
          {progress.todayXp >= progress.dailyGoal
            ? "Goal reached today — fantastisch! 🎉"
            : `${progress.dailyGoal - progress.todayXp} XP to go today.`}
        </p>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {DAILY_GOAL_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={progress.dailyGoal === option}
              onClick={() => setDailyGoal(option)}
              className={cn(
                "h-11 rounded-2xl border border-border text-sm font-semibold transition-colors",
                progress.dailyGoal === option
                  ? "border-transparent bg-primary text-primary-foreground"
                  : "bg-card",
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </Card>

      <section aria-label="Achievements" className="mt-5">
        <h2 className="mb-3 text-base font-bold">Achievements</h2>
        <div className="grid grid-cols-2 gap-3">
          {ACHIEVEMENTS.map((achievement) => {
            const unlocked = progress.unlockedAchievements.includes(achievement.id);
            return (
              <Card
                key={achievement.id}
                className={cn(
                  "shadow-soft rounded-3xl border-none p-4 transition-opacity",
                  !unlocked && "opacity-55",
                )}
              >
                <span className="text-2xl" aria-hidden="true">
                  {unlocked ? achievement.emoji : <Lock className="size-5 text-muted-foreground" />}
                </span>
                <h3 className="mt-2 text-sm font-bold">{achievement.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{achievement.description}</p>
              </Card>
            );
          })}
        </div>
      </section>

      <div className="mt-5 grid grid-cols-3 gap-3 text-center">
        <MiniStat label="Quizzes" value={progress.quizzesCompleted} />
        <MiniStat label="Correct" value={progress.correctAnswers} />
        <MiniStat label="Translations" value={progress.translations} />
      </div>
    </AppShell>
  );
}

function StatTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="shadow-soft rounded-3xl border-none p-4 text-center">
      <span className="mx-auto flex size-9 items-center justify-center rounded-xl bg-secondary/25 text-primary">
        {icon}
      </span>
      <p className="mt-2 text-base font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-muted p-3">
      <p className="text-base font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
