import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Check, CheckCircle2, Loader2, Sparkles, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useGermanSpeech } from "@/hooks/use-german-speech";
import { useProgress } from "@/hooks/use-progress";
import {
  GRAMMAR_TOPICS,
  loadGrammarState,
  markTopicComplete,
  type GrammarTopic,
} from "@/lib/grammar";
import { generateGrammarLesson } from "@/lib/lernexa.functions";
import type { GrammarLesson } from "@/lib/lernexa-schemas";
import { logActivity } from "@/lib/insights";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/grammar")({
  head: () => ({
    meta: [
      { title: "German Grammar Lessons for Beginners | Lernexa" },
      {
        name: "description",
        content:
          "Learn German grammar step by step: articles, cases, word order and verb tenses explained in simple English with examples and quick practice.",
      },
      { property: "og:title", content: "German Grammar Lessons for Beginners | Lernexa" },
      {
        property: "og:description",
        content:
          "Beginner-friendly German grammar lessons with plain-English rules, everyday examples and instant practice questions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GrammarPage,
});

function GrammarPage() {
  const [completed, setCompleted] = useState<string[]>([]);
  const [topic, setTopic] = useState<GrammarTopic | null>(null);

  useEffect(() => {
    setCompleted(loadGrammarState().completed);
  }, []);

  const percent = Math.round((completed.length / GRAMMAR_TOPICS.length) * 100);

  if (topic) {
    return (
      <LessonView
        topic={topic}
        onBack={() => setTopic(null)}
        onComplete={(id) => setCompleted(markTopicComplete(id).completed)}
      />
    );
  }

  return (
    <AppShell title="Grammar" subtitle="German rules explained in plain English.">
      <Card className="shadow-soft rounded-3xl border-none p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold">Your grammar journey</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {completed.length} of {GRAMMAR_TOPICS.length} topics finished
            </p>
          </div>
          <span className="bg-brand-gradient text-primary-foreground flex size-11 shrink-0 items-center justify-center rounded-2xl">
            <Sparkles className="size-5" aria-hidden="true" />
          </span>
        </div>
        <Progress value={percent} className="mt-4 h-2" />
      </Card>

      <section aria-label="Grammar topics" className="mt-4 space-y-3">
        {GRAMMAR_TOPICS.map((item) => {
          const isDone = completed.includes(item.id);
          return (
            <Card
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => setTopic(item)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setTopic(item);
                }
              }}
              className="shadow-soft cursor-pointer rounded-3xl border-none p-4 transition-transform duration-200 active:scale-[0.98]"
            >
              <div className="flex items-center gap-4">
                <span
                  className={cn(
                    "flex size-12 shrink-0 items-center justify-center rounded-2xl text-xl",
                    isDone ? "bg-secondary/40" : "bg-secondary/20",
                  )}
                  aria-hidden="true"
                >
                  {isDone ? <Check className="size-6 text-primary" /> : item.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-base font-bold">{item.title}</h3>
                    <Badge variant="secondary" className="shrink-0">
                      {item.level}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.summary}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </section>
    </AppShell>
  );
}

function LessonView({
  topic,
  onBack,
  onComplete,
}: {
  topic: GrammarTopic;
  onBack: () => void;
  onComplete: (topicId: string) => void;
}) {
  const teach = useServerFn(generateGrammarLesson);
  const { speak } = useGermanSpeech();
  const { recordCorrectAnswer, recordQuizRound } = useProgress();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [finished, setFinished] = useState(false);

  const lesson = useMutation({
    mutationFn: () =>
      teach({ data: { topicId: topic.id, topicTitle: topic.title, level: topic.level } }),
    onError: (error: Error) => toast.error(error.message),
  });

  useEffect(() => {
    lesson.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic.id]);

  const data: GrammarLesson | undefined = lesson.data;
  const total = data?.practice.length ?? 0;
  const answeredCount = Object.keys(answers).length;
  const score = data
    ? data.practice.filter((item, index) => answers[index] === item.correctIndex).length
    : 0;

  function handleAnswer(index: number, choice: number, correctIndex: number) {
    if (answers[index] !== undefined) return;
    const next = { ...answers, [index]: choice };
    setAnswers(next);
    if (choice === correctIndex) {
      const { xp } = recordCorrectAnswer();
      logActivity("grammar", xp, 1, 1);
      toast.success(`Richtig! +${xp} XP`);
    }
    if (data && Object.keys(next).length === data.practice.length && !finished) {
      setFinished(true);
      const finalScore = data.practice.filter(
        (item, i) => next[i] === item.correctIndex,
      ).length;
      recordQuizRound(finalScore, data.practice.length);
      onComplete(topic.id);
    }
  }

  return (
    <AppShell title={topic.title} subtitle={topic.germanTitle}>
      <Button variant="ghost" onClick={onBack} className="mb-2 -ml-2 gap-2 text-sm">
        <ArrowLeft className="size-4" aria-hidden="true" /> All topics
      </Button>

      {lesson.isPending ? (
        <Card className="shadow-soft flex items-center gap-3 rounded-3xl border-none p-6">
          <Loader2 className="size-5 animate-spin text-primary" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">Preparing your lesson…</p>
        </Card>
      ) : null}

      {lesson.isError ? (
        <Card className="shadow-soft rounded-3xl border-none p-6">
          <p className="text-sm text-muted-foreground">
            We couldn&apos;t load this lesson. Let&apos;s try that again.
          </p>
          <Button className="mt-4 w-full" onClick={() => lesson.mutate()}>
            Retry
          </Button>
        </Card>
      ) : null}

      {data ? (
        <div className="space-y-3">
          <Card className="shadow-soft rounded-3xl border-none p-5">
            <p className="text-sm leading-relaxed">{data.intro}</p>
          </Card>

          {data.rules.map((rule) => (
            <Card key={rule.heading} className="shadow-soft rounded-3xl border-none p-5">
              <h3 className="text-base font-bold">{rule.heading}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{rule.explanation}</p>
              <ul className="mt-3 space-y-2">
                {rule.examples.map((example) => (
                  <li
                    key={example.german}
                    className="flex items-start gap-3 rounded-2xl bg-muted/60 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{example.german}</p>
                      <p className="text-sm text-muted-foreground">{example.english}</p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Listen to ${example.german}`}
                      onClick={() => speak(example.german)}
                    >
                      <Volume2 className="size-4" aria-hidden="true" />
                    </Button>
                  </li>
                ))}
              </ul>
            </Card>
          ))}

          <Card className="shadow-soft rounded-3xl border-none bg-accent/15 p-5">
            <h3 className="text-base font-bold">💡 Remember it like this</h3>
            <p className="mt-1 text-sm">{data.tip}</p>
          </Card>

          <Card className="shadow-soft rounded-3xl border-none p-5">
            <h3 className="text-base font-bold">Watch out for</h3>
            <p className="mt-1 text-sm text-muted-foreground">{data.mistake}</p>
          </Card>

          <section aria-label="Practice questions" className="space-y-3">
            <h2 className="px-1 pt-2 text-base font-bold">
              Quick practice {answeredCount > 0 ? `· ${score}/${total}` : ""}
            </h2>
            {data.practice.map((question, index) => {
              const chosen = answers[index];
              const answered = chosen !== undefined;
              return (
                <Card key={question.prompt} className="shadow-soft rounded-3xl border-none p-5">
                  <p className="text-sm font-semibold">{question.prompt}</p>
                  <div className="mt-3 space-y-2">
                    {question.options.map((option, optionIndex) => {
                      const isCorrect = optionIndex === question.correctIndex;
                      const isChosen = chosen === optionIndex;
                      return (
                        <button
                          key={option}
                          type="button"
                          disabled={answered}
                          onClick={() => handleAnswer(index, optionIndex, question.correctIndex)}
                          className={cn(
                            "flex w-full items-center justify-between gap-3 rounded-2xl border border-border px-4 py-3 text-left text-sm transition-colors",
                            !answered && "active:scale-[0.99]",
                            answered && isCorrect && "border-transparent bg-secondary/30",
                            answered && isChosen && !isCorrect && "border-transparent bg-destructive/15",
                          )}
                        >
                          {option}
                          {answered && isCorrect ? (
                            <CheckCircle2 className="size-4 shrink-0 text-primary" aria-hidden="true" />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                  {answered ? (
                    <p className="mt-3 text-sm text-muted-foreground">{question.explanation}</p>
                  ) : null}
                </Card>
              );
            })}
          </section>

          {finished ? (
            <Card className="shadow-soft rounded-3xl border-none p-5 text-center">
              <p className="text-base font-bold">Super gemacht! {score}/{total} correct 🎉</p>
              <p className="mt-1 text-sm text-muted-foreground">
                This topic is marked as finished. Come back any time for a fresh lesson.
              </p>
              <Button className="mt-4 w-full" onClick={onBack}>
                Back to topics
              </Button>
            </Card>
          ) : null}
        </div>
      ) : null}
    </AppShell>
  );
}
