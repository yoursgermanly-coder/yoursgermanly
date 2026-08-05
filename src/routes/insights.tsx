import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  Bar,
  BarChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useProgress } from "@/hooks/use-progress";
import {
  buildInsights,
  getActivity,
  getServerActivity,
  subscribeToInsights,
} from "@/lib/insights";
import { generateStudyPlan } from "@/lib/lernexa.functions";
import { CEFR_LEVELS, type CefrLevel, type StudyPlan } from "@/lib/lernexa-schemas";
import { dueWords, loadDeck } from "@/lib/vocabulary";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "Your German Learning Insights | Lernexa" },
      {
        name: "description",
        content:
          "See which German skills you're strongest at, track your weekly XP and get a personalised study plan built around your own progress.",
      },
      { property: "og:title", content: "Your German Learning Insights | Lernexa" },
      {
        property: "og:description",
        content: "Skill radar, weekly XP trends and an AI study plan personalised to your learning.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InsightsPage,
});

const TIME_OPTIONS = [5, 10, 20, 30] as const;

function InsightsPage() {
  const events = useSyncExternalStore(subscribeToInsights, getActivity, getServerActivity);
  const insights = useMemo(() => buildInsights(events), [events]);
  const { progress } = useProgress();
  const [level, setLevel] = useState<CefrLevel>("A1");
  const [minutes, setMinutes] = useState<number>(10);
  const [due, setDue] = useState(0);
  const [plan, setPlan] = useState<StudyPlan | null>(null);

  useEffect(() => {
    setDue(dueWords(loadDeck()).length);
  }, []);

  const buildPlan = useServerFn(generateStudyPlan);
  const mutation = useMutation({
    mutationFn: () =>
      buildPlan({
        data: {
          level,
          minutes,
          streak: progress.streak,
          weekXp: insights.weekXp,
          strongest: insights.strongest?.label ?? "",
          weakest: insights.weakest?.label ?? "",
          untouched: insights.untouched.map((skill) => skill.label),
          dueWords: due,
        },
      }),
    onSuccess: setPlan,
    onError: (error: Error) => toast.error(error.message),
  });

  const radarData = insights.skills.map((skill) => ({ skill: skill.label, score: skill.score }));

  return (
    <AppShell title="Your insights" subtitle="Learning built around how you actually practise.">
      <Card className="shadow-soft rounded-3xl border-none p-5">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-2xl font-bold">{insights.weekXp}</p>
            <p className="text-xs text-muted-foreground">XP this week</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{insights.activeDays}/7</p>
            <p className="text-xs text-muted-foreground">Active days</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{insights.totalSessions}</p>
            <p className="text-xs text-muted-foreground">Practice sessions</p>
          </div>
        </div>
        <div className="mt-5 h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={insights.daily}>
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
              <Tooltip cursor={false} />
              <Bar dataKey="xp" radius={[8, 8, 0, 0]} fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="shadow-soft mt-3 rounded-3xl border-none p-5">
        <h2 className="text-base font-bold">Skill balance</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {insights.totalSessions === 0
            ? "Practise anything today and your skill map will appear here."
            : `Strongest: ${insights.strongest?.label ?? "—"} · Needs love: ${insights.weakest?.label ?? "—"}`}
        </p>
        <div className="mt-3 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} outerRadius="72%">
              <PolarGrid />
              <PolarAngleAxis dataKey="skill" fontSize={10} />
              <Radar
                dataKey="score"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.35}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <ul className="mt-2 space-y-2">
          {insights.skills.map((skill) => (
            <li key={skill.id}>
              <Link to={skill.to} className="block rounded-2xl px-1 py-2">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>
                    {skill.emoji} {skill.label}
                  </span>
                  <span className="text-muted-foreground">
                    {skill.sessions === 0
                      ? "Not started"
                      : `${skill.xp} XP${skill.accuracy !== null ? ` · ${skill.accuracy}%` : ""}`}
                  </span>
                </div>
                <Progress value={skill.score} className="mt-2 h-2" />
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="shadow-soft mt-3 rounded-3xl border-none p-5">
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-primary" aria-hidden="true" />
          <h2 className="text-base font-bold">Today's personalised plan</h2>
        </div>

        <h3 className="mt-4 text-sm font-semibold">Your level</h3>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {CEFR_LEVELS.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={level === value}
              onClick={() => setLevel(value)}
              className={cn(
                "h-11 rounded-2xl border border-border text-sm font-semibold transition-colors",
                level === value ? "border-transparent bg-primary text-primary-foreground" : "bg-card",
              )}
            >
              {value}
            </button>
          ))}
        </div>

        <h3 className="mt-4 text-sm font-semibold">Time today</h3>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {TIME_OPTIONS.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={minutes === value}
              onClick={() => setMinutes(value)}
              className={cn(
                "h-11 rounded-2xl border border-border text-sm font-semibold transition-colors",
                minutes === value ? "border-transparent bg-secondary text-secondary-foreground" : "bg-card",
              )}
            >
              {value}m
            </button>
          ))}
        </div>

        <Button
          size="lg"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate()}
          className="mt-5 h-12 w-full rounded-2xl text-base font-semibold"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="size-5 animate-spin" aria-hidden="true" /> Building your plan…
            </>
          ) : (
            <>
              <TrendingUp className="size-5" aria-hidden="true" /> {plan ? "Refresh plan" : "Build my plan"}
            </>
          )}
        </Button>

        {plan ? (
          <div className="mt-5 space-y-3">
            <div>
              <h3 className="text-base font-bold">{plan.headline}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Focus: <span className="font-semibold text-foreground">{plan.focus}</span> — {plan.why}
              </p>
            </div>
            <ol className="space-y-2">
              {plan.steps.map((step, index) => {
                const target = insights.skills.find((skill) => skill.id === step.skill);
                return (
                  <li key={step.title}>
                    <Link
                      to={target?.to ?? "/"}
                      className="flex items-start gap-3 rounded-2xl border border-border p-3 transition-colors hover:border-primary"
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-secondary/25 text-sm font-bold">
                        {index + 1}
                      </span>
                      <span>
                        <span className="block text-sm font-semibold">
                          {step.title} · {step.minutes} min
                        </span>
                        <span className="block text-sm text-muted-foreground">{step.detail}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
            <p className="rounded-2xl bg-accent/20 p-3 text-sm">💪 {plan.encouragement}</p>
          </div>
        ) : null}
      </Card>
    </AppShell>
  );
}
