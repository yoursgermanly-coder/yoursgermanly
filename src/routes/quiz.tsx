import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Check, Loader2, RotateCcw, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useProgress } from "@/hooks/use-progress";
import { generateQuiz } from "@/lib/lernexa.functions";
import { CEFR_LEVELS, QUIZ_TOPICS, type CefrLevel, type QuizQuestion } from "@/lib/lernexa-schemas";
import { logActivity } from "@/lib/insights";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/quiz")({
  head: () => ({
    meta: [
      { title: "Unlimited German Practice Quiz | Yours Germanly" },
      {
        name: "description",
        content:
          "Practise German with unlimited AI-generated multiple-choice questions from A1 to B2, with instant feedback.",
      },
      { property: "og:title", content: "Unlimited German Practice Quiz | Yours Germanly" },
      {
        property: "og:description",
        content: "Unlimited A1–B2 German quiz questions with instant, encouraging feedback.",
      },
    ],
  }),
  component: QuizPage,
});

const QUESTIONS_PER_ROUND = 5;

function QuizPage() {
  const [level, setLevel] = useState<CefrLevel>("A1");
  const [topic, setTopic] = useState<string>(QUIZ_TOPICS[0]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  const { recordCorrectAnswer, recordQuizRound } = useProgress();
  const fetchQuiz = useServerFn(generateQuiz);

  const celebrate = (
    result: { xp: number; unlocked: { emoji: string; title: string }[] },
    message: string,
  ) => {
    toast.success(`${message} +${result.xp} XP`);
    for (const achievement of result.unlocked) {
      toast(`${achievement.emoji} Achievement unlocked: ${achievement.title}`);
    }
  };

  const mutation = useMutation({
    mutationFn: () => fetchQuiz({ data: { topic, level, count: QUESTIONS_PER_ROUND } }),
    onSuccess: (data) => {
      setQuestions(data);
      setIndex(0);
      setSelected(null);
      setScore(0);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const current = questions[index];
  const finished = questions.length > 0 && index >= questions.length;

  const handleAnswer = (optionIndex: number) => {
    if (selected !== null || !current) return;
    setSelected(optionIndex);
    if (optionIndex === current.correctIndex) {
      setScore((value) => value + 1);
      celebrate(recordCorrectAnswer(), "Richtig! Nice work 🎉");
      logActivity("quiz", 10, 1, 1);
    }
  };

  const handleNext = () => {
    const isLast = index + 1 === questions.length;
    setSelected(null);
    setIndex((value) => value + 1);
    if (selected !== current?.correctIndex) logActivity("quiz", 0, 0, 1);
    if (isLast) celebrate(recordQuizRound(score, questions.length), "Round complete!");
  };

  return (
    <AppShell title="Practice quiz" subtitle="Unlimited questions, instant feedback.">
      {questions.length === 0 ? (
        <Card className="shadow-soft rounded-3xl border-none p-5">
          <h2 className="text-base font-bold">Choose your level</h2>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {CEFR_LEVELS.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={level === value}
                onClick={() => setLevel(value)}
                className={cn(
                  "h-12 rounded-2xl border border-border text-sm font-semibold transition-colors",
                  level === value
                    ? "bg-primary text-primary-foreground border-transparent"
                    : "bg-card",
                )}
              >
                {value}
              </button>
            ))}
          </div>

          <h2 className="mt-5 text-base font-bold">Pick a topic</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {QUIZ_TOPICS.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={topic === value}
                onClick={() => setTopic(value)}
                className={cn(
                  "rounded-full px-3 py-2 text-xs font-medium transition-colors",
                  topic === value
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {value}
              </button>
            ))}
          </div>

          <Button
            size="lg"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
            className="mt-6 h-12 w-full rounded-2xl text-base font-semibold"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="size-5 animate-spin" aria-hidden="true" /> Building your quiz…
              </>
            ) : (
              "Start quiz"
            )}
          </Button>
        </Card>
      ) : null}

      {current ? (
        <Card className="shadow-soft rounded-3xl border-none p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>
              Question {index + 1} of {questions.length}
            </span>
            <span>
              {level} · {score} correct
            </span>
          </div>
          <Progress
            value={((index + (selected !== null ? 1 : 0)) / questions.length) * 100}
            className="mt-3 h-2"
          />

          <h2 className="mt-5 text-lg leading-snug">{current.prompt}</h2>

          <ul className="mt-4 space-y-2">
            {current.options.map((option, optionIndex) => {
              const isCorrect = optionIndex === current.correctIndex;
              const isChosen = optionIndex === selected;
              const revealed = selected !== null;
              return (
                <li key={option}>
                  <button
                    type="button"
                    disabled={revealed}
                    onClick={() => handleAnswer(optionIndex)}
                    className={cn(
                      "flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl border border-border px-4 py-3 text-left text-sm font-medium transition-colors",
                      revealed && isCorrect && "border-transparent bg-success/15 text-foreground",
                      revealed && isChosen && !isCorrect && "border-transparent bg-destructive/15",
                      !revealed && "hover:border-primary",
                    )}
                  >
                    <span>{option}</span>
                    {revealed && isCorrect ? (
                      <Check className="size-5 text-success" aria-hidden="true" />
                    ) : null}
                    {revealed && isChosen && !isCorrect ? (
                      <X className="size-5 text-destructive" aria-hidden="true" />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>

          {selected !== null ? (
            <>
              <div className="mt-4 space-y-3 rounded-2xl bg-muted p-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wide text-success">
                    ✅ Correct answer: {current.options[current.correctIndex]}
                  </h3>
                  <p className="mt-1 text-sm">{current.explanation}</p>
                </div>

                {current.rule ? (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      📘 The rule
                    </h3>
                    <p className="mt-1 text-sm">{current.rule}</p>
                  </div>
                ) : null}

                {current.optionFeedback?.length ? (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      🔍 Every option explained
                    </h3>
                    <ul className="mt-2 space-y-2">
                      {current.options.map((option, optionIndex) => (
                        <li key={option} className="flex gap-2 text-sm">
                          <span aria-hidden="true">
                            {optionIndex === current.correctIndex ? "✅" : "❌"}
                          </span>
                          <span>
                            <span className="font-semibold">{option}</span>
                            <span className="text-muted-foreground">
                              {" "}
                              — {current.optionFeedback[optionIndex]}
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {current.tip ? (
                  <p className="rounded-xl bg-accent/20 p-3 text-sm">💡 Remember: {current.tip}</p>
                ) : null}
              </div>
              <Button
                size="lg"
                onClick={handleNext}
                className="mt-4 h-12 w-full rounded-2xl text-base font-semibold"
              >
                {index + 1 === questions.length ? "See results" : "Next question"}
              </Button>
            </>
          ) : null}
        </Card>
      ) : null}

      {finished ? (
        <Card className="shadow-soft rounded-3xl border-none p-6 text-center">
          <h2 className="text-xl">Super gemacht! 🎉</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            You got {score} out of {questions.length} right.
          </p>
          <Button
            size="lg"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
            className="mt-5 h-12 w-full rounded-2xl text-base font-semibold"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="size-5 animate-spin" aria-hidden="true" /> Loading…
              </>
            ) : (
              <>
                <RotateCcw className="size-5" aria-hidden="true" /> Another round
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setQuestions([]);
              setSelected(null);
              setScore(0);
              setIndex(0);
            }}
            className="mt-2 w-full rounded-2xl"
          >
            Change level or topic
          </Button>
        </Card>
      ) : null}
    </AppShell>
  );
}
