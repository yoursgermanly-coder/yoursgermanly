import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Flame, GraduationCap, Languages, MessageCircle, MessagesSquare, Mic, Sparkles, SpellCheck } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useProgress } from "@/hooks/use-progress";
import { getLevel } from "@/lib/progress";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lernexa — Learn German the Fun Way" },
      {
        name: "description",
        content:
          "Translate English to German instantly and practise with unlimited AI-powered German quizzes. Learn a little every day with Lernexa.",
      },
      { property: "og:title", content: "Lernexa — Learn German the Fun Way" },
      {
        property: "og:description",
        content:
          "Instant English to German translation plus unlimited AI quizzes for beginners to B2 learners.",
      },
    ],
  }),
  component: HomePage,
});

const FEATURES = [
  {
    to: "/translate",
    icon: Languages,
    title: "Translate",
    description: "English to German with pronunciation and friendly tips.",
  },
  {
    to: "/vocabulary",
    icon: BookOpen,
    title: "Vocabulary builder",
    description: "AI word packs plus spaced-repetition review that makes words stick.",
  },
  {
    to: "/tutor",
    icon: MessageCircle,
    title: "AI tutor",
    description: "Chat with Chinnu for practice, corrections and answers any time.",
  },
  {
    to: "/conversation",
    icon: MessagesSquare,
    title: "Real-life talks",
    description: "Role-play a café, a doctor's visit or a job interview with instant corrections.",
  },
  {
    to: "/speak",
    icon: Mic,
    title: "Speak & listen",
    description: "Say sentences out loud and get an instant pronunciation score.",
  },
  {
    to: "/grammar",
    icon: SpellCheck,
    title: "Grammar lessons",
    description: "Articles, cases and word order explained in plain English.",
  },
  {
    to: "/quiz",
    icon: GraduationCap,
    title: "Practice quiz",
    description: "Unlimited questions, from A1 basics to B2 grammar.",
  },
] as const;

function HomePage() {
  const { progress } = useProgress();
  const level = getLevel(progress.totalXp);
  const goalPercent = Math.min(100, Math.round((progress.todayXp / progress.dailyGoal) * 100));
  const goalReached = progress.todayXp >= progress.dailyGoal;

  return (
    <AppShell title="Willkommen 👋" subtitle="Your daily dose of German, made simple.">
      <Card className="shadow-soft rounded-3xl border-none p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold">
              {goalReached ? "Daily goal reached 🎉" : "Today's goal"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {goalReached
                ? "Fantastisch! Anything extra is bonus XP."
                : `${progress.todayXp} / ${progress.dailyGoal} XP — ${progress.dailyGoal - progress.todayXp} to go.`}
            </p>
          </div>
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-accent/20 px-3 py-1.5 text-sm font-bold text-foreground">
            <Flame className="size-4 text-accent" aria-hidden="true" /> {progress.streak}
          </span>
        </div>
        <Progress value={goalPercent} className="mt-4 h-2" />
        <Link to="/progress" className="mt-3 block text-xs font-semibold text-primary">
          Level {level.level} · {level.title} — view progress →
        </Link>
      </Card>

      <Card className="shadow-soft mt-3 rounded-3xl border-none p-5">
        <div className="flex items-start gap-3">
          <span className="bg-brand-gradient text-primary-foreground flex size-11 shrink-0 items-center justify-center rounded-2xl">
            <Sparkles className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-bold">Start with 5 minutes today</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Translate a phrase you actually want to say, then lock it in with a quick quiz.
            </p>
          </div>
        </div>
      </Card>


      <section aria-label="Learning tools" className="mt-4 space-y-3">
        {FEATURES.map(({ to, icon: Icon, title, description }) => (
          <Link key={to} to={to} className="block">
            <Card className="shadow-soft rounded-3xl border-none p-5 transition-transform duration-200 active:scale-[0.98]">
              <div className="flex items-center gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-secondary/25 text-primary">
                  <Icon className="size-6" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-base font-bold">{title}</h3>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </section>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Kleine Schritte, große Fortschritte — small steps, big progress.
      </p>
    </AppShell>
  );
}
