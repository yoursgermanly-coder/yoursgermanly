import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { BookOpen, Loader2, Plus, RotateCcw, Sparkles, Trash2, Volume2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useGermanSpeech } from "@/hooks/use-german-speech";
import { useProgress } from "@/hooks/use-progress";
import { generateVocabulary } from "@/lib/lernexa.functions";
import { CEFR_LEVELS, VOCAB_TOPICS, type CefrLevel } from "@/lib/lernexa-schemas";
import {
  addWords,
  createWord,
  deckStats,
  dueWords,
  formatNextReview,
  getMastery,
  loadDeck,
  removeWord,
  reviewWord,
  saveDeck,
  type VocabularyWord,
} from "@/lib/vocabulary";
import { logActivity } from "@/lib/insights";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/vocabulary")({
  head: () => ({
    meta: [
      { title: "German Vocabulary Builder & Flashcards | Lernexa" },
      {
        name: "description",
        content:
          "Build your German vocabulary with AI word packs and review them with spaced-repetition flashcards, audio and mastery tracking.",
      },
      { property: "og:title", content: "German Vocabulary Builder & Flashcards | Lernexa" },
      {
        property: "og:description",
        content:
          "AI-generated German word packs plus spaced-repetition flashcards that help words stick for good.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VocabularyPage,
});

const WORDS_PER_PACK = 6;

type Tab = "review" | "add" | "deck";

function VocabularyPage() {
  const [deck, setDeck] = useState<VocabularyWord[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [tab, setTab] = useState<Tab>("review");

  useEffect(() => {
    setDeck(loadDeck());
    setHydrated(true);
  }, []);

  const update = (next: VocabularyWord[]) => {
    setDeck(next);
    saveDeck(next);
  };

  const stats = useMemo(() => deckStats(deck), [deck]);

  return (
    <AppShell title="Vocabulary" subtitle="Learn new words, then keep them with smart review.">
      <Card className="shadow-soft rounded-3xl border-none p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold">{stats.total} words in your deck</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {stats.due > 0
                ? `${stats.due} ready for review right now.`
                : "Nothing due — add a new word pack!"}
            </p>
          </div>
          <span className="bg-brand-gradient text-primary-foreground flex size-11 shrink-0 items-center justify-center rounded-2xl">
            <BookOpen className="size-5" aria-hidden="true" />
          </span>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2 text-center">
          {(["New", "Learning", "Familiar", "Mastered"] as const).map((stage) => (
            <div key={stage} className="rounded-2xl bg-muted p-2">
              <p className="text-base font-bold">{stats.counts[stage]}</p>
              <p className="text-[11px] text-muted-foreground">{stage}</p>
            </div>
          ))}
        </div>
      </Card>

      <div
        role="tablist"
        aria-label="Vocabulary sections"
        className="mt-3 grid grid-cols-3 gap-2 rounded-2xl bg-muted p-1"
      >
        {(
          [
            ["review", "Review"],
            ["add", "Add words"],
            ["deck", "My deck"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            role="tab"
            type="button"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={cn(
              "h-10 rounded-xl text-sm font-semibold transition-colors",
              tab === value ? "bg-card text-primary shadow-soft" : "text-muted-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4 pb-4">
        {!hydrated ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Loading your deck…</p>
        ) : tab === "review" ? (
          <ReviewSection deck={deck} onUpdate={update} onAddMore={() => setTab("add")} />
        ) : tab === "add" ? (
          <AddSection deck={deck} onUpdate={update} onDone={() => setTab("review")} />
        ) : (
          <DeckSection deck={deck} onUpdate={update} />
        )}
      </div>
    </AppShell>
  );
}

function ReviewSection({
  deck,
  onUpdate,
  onAddMore,
}: {
  deck: VocabularyWord[];
  onUpdate: (next: VocabularyWord[]) => void;
  onAddMore: () => void;
}) {
  const [queue, setQueue] = useState<string[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const { speak } = useGermanSpeech();
  const { recordCorrectAnswer } = useProgress();

  const due = useMemo(() => dueWords(deck), [deck]);

  useEffect(() => {
    setQueue(dueWords(deck).map((word) => word.id));
    // Only build the queue once per mount so answers don't reshuffle mid-session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentId = queue[0];
  const current = deck.find((word) => word.id === currentId) ?? null;

  const grade = (quality: number) => {
    if (!current) return;
    onUpdate(deck.map((word) => (word.id === current.id ? reviewWord(word, quality) : word)));
    setQueue((items) => items.slice(1));
    setRevealed(false);
    setReviewed((count) => count + 1);
    if (quality >= 3) {
      const result = recordCorrectAnswer();
      logActivity("vocabulary", result.xp, 1, 1);
      toast.success(`Nice! +${result.xp} XP`);
      for (const achievement of result.unlocked) {
        toast(`${achievement.emoji} Achievement unlocked: ${achievement.title}`);
      }
    }
  };

  if (deck.length === 0) {
    return (
      <EmptyState
        title="Your deck is empty"
        description="Generate your first word pack and start building vocabulary today."
        actionLabel="Add words"
        onAction={onAddMore}
      />
    );
  }

  if (!current) {
    return (
      <EmptyState
        title={reviewed > 0 ? "Review complete 🎉" : "Nothing due right now"}
        description={
          reviewed > 0
            ? `You reviewed ${reviewed} word${reviewed === 1 ? "" : "s"}. Come back later for the next round.`
            : "Every word is scheduled for later. Add a new pack to keep the momentum going."
        }
        actionLabel="Add more words"
        onAction={onAddMore}
      />
    );
  }

  const total = due.length || 1;
  const done = Math.min(reviewed, total);

  return (
    <div>
      <Progress value={Math.round((done / total) * 100)} className="h-2" />
      <p className="mt-2 text-xs text-muted-foreground">
        {queue.length} left in this review session
      </p>

      <Card className="shadow-soft mt-3 rounded-3xl border-none p-6 text-center">
        <Badge variant="secondary" className="mb-3">
          {getMastery(current)} · {current.level}
        </Badge>
        <p className="text-2xl font-extrabold">
          {current.article ? `${current.article} ` : ""}
          {current.german}
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="mt-2"
          onClick={() => speak(`${current.article} ${current.german}`.trim())}
        >
          <Volume2 className="size-4" aria-hidden="true" /> Hear it
        </Button>

        {revealed ? (
          <div className="mt-4 space-y-3 text-left">
            <p className="text-center text-lg font-bold text-primary">{current.english}</p>
            <div className="rounded-2xl bg-muted p-3">
              <p className="text-sm font-semibold">{current.example}</p>
              <p className="mt-1 text-xs text-muted-foreground">{current.exampleEnglish}</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-1"
                onClick={() => speak(current.example)}
              >
                <Volume2 className="size-4" aria-hidden="true" /> Play sentence
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            Think of the meaning, then reveal the answer.
          </p>
        )}
      </Card>

      {revealed ? (
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Button variant="outline" className="h-12 rounded-2xl" onClick={() => grade(2)}>
            Again
          </Button>
          <Button variant="secondary" className="h-12 rounded-2xl" onClick={() => grade(4)}>
            Good
          </Button>
          <Button className="h-12 rounded-2xl" onClick={() => grade(5)}>
            Easy
          </Button>
        </div>
      ) : (
        <Button className="mt-3 h-12 w-full rounded-2xl" onClick={() => setRevealed(true)}>
          Reveal answer
        </Button>
      )}
    </div>
  );
}

function AddSection({
  deck,
  onUpdate,
  onDone,
}: {
  deck: VocabularyWord[];
  onUpdate: (next: VocabularyWord[]) => void;
  onDone: () => void;
}) {
  const [level, setLevel] = useState<CefrLevel>("A1");
  const [topic, setTopic] = useState<string>(VOCAB_TOPICS[0]);
  const fetchVocabulary = useServerFn(generateVocabulary);

  const mutation = useMutation({
    mutationFn: () =>
      fetchVocabulary({
        data: {
          topic,
          level,
          count: WORDS_PER_PACK,
          exclude: deck.slice(0, 100).map((word) => word.german),
        },
      }),
    onSuccess: (words) => {
      const fresh = words.map((item) => createWord({ ...item, topic, level }));
      const next = addWords(deck, fresh);
      const added = next.length - deck.length;
      onUpdate(next);
      if (added === 0) {
        toast("You already know all of those — try another topic.");
        return;
      }
      toast.success(`${added} new word${added === 1 ? "" : "s"} added to your deck!`);
      onDone();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div>
      <Card className="shadow-soft rounded-3xl border-none p-5">
        <h2 className="text-base font-bold">Build a word pack</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a topic and level — we'll pick {WORDS_PER_PACK} useful words you don't have yet.
        </p>

        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Level
        </p>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {CEFR_LEVELS.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={level === option}
              onClick={() => setLevel(option)}
              className={cn(
                "h-11 rounded-2xl border border-border text-sm font-semibold transition-colors",
                level === option
                  ? "border-transparent bg-primary text-primary-foreground"
                  : "bg-card",
              )}
            >
              {option}
            </button>
          ))}
        </div>

        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Topic
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {VOCAB_TOPICS.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={topic === option}
              onClick={() => setTopic(option)}
              className={cn(
                "rounded-full border border-border px-3 py-2 text-xs font-semibold transition-colors",
                topic === option ? "border-transparent bg-secondary/30 text-primary" : "bg-card",
              )}
            >
              {option}
            </button>
          ))}
        </div>

        <Button
          className="mt-5 h-12 w-full rounded-2xl"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Building your pack…
            </>
          ) : (
            <>
              <Sparkles className="size-4" aria-hidden="true" /> Generate {WORDS_PER_PACK} words
            </>
          )}
        </Button>
      </Card>
    </div>
  );
}

function DeckSection({
  deck,
  onUpdate,
}: {
  deck: VocabularyWord[];
  onUpdate: (next: VocabularyWord[]) => void;
}) {
  const { speak } = useGermanSpeech();

  if (deck.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No words yet — generate your first pack from the “Add words” tab.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {deck.map((word) => (
        <li key={word.id}>
          <Card className="shadow-soft rounded-3xl border-none p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-base font-bold">
                  {word.article ? `${word.article} ` : ""}
                  {word.german}
                </p>
                <p className="truncate text-sm text-muted-foreground">{word.english}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{getMastery(word)}</Badge>
                  <span className="text-xs text-muted-foreground">{formatNextReview(word)}</span>
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Hear ${word.german}`}
                  onClick={() => speak(`${word.article} ${word.german}`.trim())}
                >
                  <Volume2 className="size-4" aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${word.german}`}
                  onClick={() => {
                    onUpdate(removeWord(deck, word.id));
                    toast(`Removed “${word.german}”.`);
                  }}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}

function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <Card className="shadow-soft rounded-3xl border-none p-6 text-center">
      <span className="bg-brand-gradient text-primary-foreground mx-auto flex size-12 items-center justify-center rounded-2xl">
        <RotateCcw className="size-5" aria-hidden="true" />
      </span>
      <h2 className="mt-3 text-base font-bold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <Button className="mt-4 h-12 w-full rounded-2xl" onClick={onAction}>
        <Plus className="size-4" aria-hidden="true" /> {actionLabel}
      </Button>
    </Card>
  );
}
