import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Crown, Flame, Lock, Medal, Snowflake, Sparkles, Target, Trophy } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { useProgress } from "@/hooks/use-progress";
import { fetchLeaderboard } from "@/lib/leaderboard";
import {
  ACHIEVEMENTS,
  DAILY_GOAL_OPTIONS,
  DAILY_MISSIONS,
  MAX_STREAK_FREEZES,
  getLevel,
  missionStatus,
} from "@/lib/progress";
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
  const { progress, setDailyGoal, claimMission } = useProgress();
  const level = getLevel(progress.totalXp);
  const goalPercent = Math.min(100, Math.round((progress.todayXp / progress.dailyGoal) * 100));

  const handleClaim = (missionId: string) => {
    const mission = DAILY_MISSIONS.find((item) => item.id === missionId);
    if (!mission) return;
    const result = claimMission(mission);
    if (!result) return;
    toast.success(`Mission complete! +${result.xp} XP`, { description: mission.title });
    for (const achievement of result.unlocked) {
      toast(`${achievement.emoji} ${achievement.title}`, { description: achievement.description });
    }
  };


  return (
    <AppShell title="Your progress" subtitle="Every small step counts — keep the streak alive.">
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

      <section aria-label="Daily missions" className="mt-5">
        <h2 className="mb-3 text-base font-bold">Today's missions</h2>
        <div className="space-y-3">
          {DAILY_MISSIONS.map((mission) => {
            const status = missionStatus(progress, mission);
            return (
              <Card key={mission.id} className="shadow-soft rounded-3xl border-none p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl" aria-hidden="true">
                    {mission.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold">{mission.title}</h3>
                    <p className="text-xs text-muted-foreground">{mission.description}</p>
                    <Progress value={status.percent} className="mt-2 h-1.5" />
                    <p className="mt-1 text-xs text-muted-foreground">
                      {status.current} / {mission.target} · +{mission.reward} XP
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={status.isComplete && !status.isClaimed ? "default" : "secondary"}
                    disabled={!status.isComplete || status.isClaimed}
                    onClick={() => handleClaim(mission.id)}
                    className="rounded-full"
                  >
                    {status.isClaimed ? "Claimed" : "Claim"}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <Card className="shadow-soft mt-3 rounded-3xl border-none p-5">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-secondary/25 text-primary">
            <Snowflake className="size-5" aria-hidden="true" />
          </span>
          <div className="flex-1">
            <h2 className="text-base font-bold">Streak freezes</h2>
            <p className="text-xs text-muted-foreground">
              A freeze saves your streak if you miss one day. Earn one every 5 streak days.
            </p>
          </div>
        </div>
        <div className="mt-3 flex gap-2" aria-label={`${progress.streakFreezes} freezes available`}>
          {Array.from({ length: MAX_STREAK_FREEZES }).map((_, index) => (
            <span
              key={index}
              aria-hidden="true"
              className={cn(
                "flex h-10 flex-1 items-center justify-center rounded-2xl text-lg",
                index < progress.streakFreezes ? "bg-secondary/30" : "bg-muted opacity-60",
              )}
            >
              {index < progress.streakFreezes ? "🧊" : "·"}
            </span>
          ))}
        </div>
      </Card>

      <LeaderboardSection />

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

const MEDALS = ["🥇", "🥈", "🥉"] as const;

function LeaderboardSection() {
  const { user, isSignedIn } = useAuth();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => fetchLeaderboard(25),
    enabled: isSignedIn,
    staleTime: 60_000,
  });

  return (
    <section aria-label="Leaderboard" className="mt-5">
      <h2 className="mb-3 flex items-center gap-2 text-base font-bold">
        <Crown className="size-4 text-primary" aria-hidden="true" />
        Leaderboard
      </h2>
      <Card className="shadow-soft rounded-3xl border-none p-4">
        {!isSignedIn ? (
          <p className="text-sm text-muted-foreground">
            Sign in to see how you compare with other Lernexa learners.
          </p>
        ) : isLoading ? (
          <p className="text-sm text-muted-foreground">Loading the ranking…</p>
        ) : isError ? (
          <p className="text-sm text-muted-foreground">
            We couldn't load the leaderboard right now — please try again later.
          </p>
        ) : !data || data.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No one is on the board yet. Earn some XP and claim the top spot!
          </p>
        ) : (
          <ol className="space-y-2">
            {data.map((entry, index) => (
              <li
                key={entry.user_id}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3 py-2",
                  entry.user_id === user?.id ? "bg-primary/10" : "bg-muted/60",
                )}
              >
                <span className="w-7 text-center text-sm font-bold" aria-hidden="true">
                  {MEDALS[index] ?? index + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                  {entry.display_name}
                  {entry.user_id === user?.id ? " (you)" : ""}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Flame className="size-3.5" aria-hidden="true" />
                  {entry.streak}
                </span>
                <span className="flex items-center gap-1 text-sm font-bold">
                  <Medal className="size-4 text-primary" aria-hidden="true" />
                  {entry.total_xp}
                </span>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </section>
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
