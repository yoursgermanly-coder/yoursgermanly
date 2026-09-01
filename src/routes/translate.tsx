import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowRight,
  ArrowRightLeft,
  Check,
  Copy,
  Loader2,
  Star,
  Turtle,
  Volume2,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useGermanSpeech } from "@/hooks/use-german-speech";
import { useProgress } from "@/hooks/use-progress";
import { translateToGerman } from "@/lib/lernexa.functions";
import type { Translation, TranslationDirection } from "@/lib/lernexa-schemas";
import { logActivity } from "@/lib/insights";
import {
  cacheKey,
  findCached,
  loadHistory,
  saveHistory,
  upsertEntry,
  type TranslationEntry,
} from "@/lib/translation-history";

export const Route = createFileRoute("/translate")({
  head: () => ({
    meta: [
      { title: "English to German Translator | Yours Germanly" },
      {
        name: "description",
        content:
          "Translate English to natural German with pronunciation help, slow audio, formality hints and beginner-friendly notes.",
      },
      { property: "og:title", content: "English to German Translator | Yours Germanly" },
      {
        property: "og:description",
        content: "Instant, natural English to German translation with pronunciation and tips.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TranslatePage,
});

const EXAMPLES: Record<TranslationDirection, string[]> = {
  "en-de": ["Where is the train station?", "I would like a coffee, please.", "Nice to meet you!"],
  "de-en": ["Wie geht es dir?", "Ich hätte gern die Rechnung.", "Kein Problem!"],
};

function TranslatePage() {
  const [text, setText] = useState("");
  const [direction, setDirection] = useState<TranslationDirection>("en-de");
  const [result, setResult] = useState<Translation | null>(null);
  const [instant, setInstant] = useState(false);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<TranslationEntry[]>([]);
  const translate = useServerFn(translateToGerman);
  const { recordTranslation } = useProgress();
  const { speak } = useGermanSpeech();

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const persist = (entries: TranslationEntry[]) => {
    setHistory(entries);
    saveHistory(entries);
  };

  const mutation = useMutation({
    mutationFn: (value: string) => translate({ data: { text: value, direction } }),
    onSuccess: (data, value) => {
      setResult(data);
      setInstant(false);
      persist(
        upsertEntry(loadHistory(), {
          id: cacheKey(value, direction),
          source: value,
          direction,
          result: data,
          createdAt: Date.now(),
          favorite: false,
        }),
      );
      const { xp, unlocked } = recordTranslation();
      logActivity("translate", xp);
      toast.success(`Übersetzt! +${xp} XP`);
      for (const achievement of unlocked) {
        toast(`${achievement.emoji} Achievement unlocked: ${achievement.title}`);
      }
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const handleSubmit = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      toast.error("Type something first.");
      return;
    }
    const cached = findCached(history, trimmed, direction);
    if (cached) {
      setResult(cached.result);
      setInstant(true);
      return;
    }
    mutation.mutate(trimmed);
  };

  const copyGerman = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.german);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy — try selecting the text.");
    }
  };

  const toggleFavorite = (id: string) => {
    persist(
      history.map((entry) => (entry.id === id ? { ...entry, favorite: !entry.favorite } : entry)),
    );
  };

  const openEntry = (entry: TranslationEntry) => {
    setText(entry.source);
    setDirection(entry.direction);
    setResult(entry.result);
    setInstant(true);
  };

  const swapDirection = () => {
    setDirection((current) => (current === "en-de" ? "de-en" : "en-de"));
    setResult(null);
    setText("");
  };

  const sourceLabel = direction === "en-de" ? "English" : "German";
  const sorted = [...history].sort(
    (a, b) => Number(b.favorite) - Number(a.favorite) || b.createdAt - a.createdAt,
  );

  return (
    <AppShell title="Translate" subtitle="Smarter German, with pronunciation.">
      <Card className="shadow-soft rounded-3xl border-none p-5">
        <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl bg-muted p-1.5">
          <span className="flex-1 text-center text-sm font-semibold">
            {direction === "en-de" ? "English" : "Deutsch"}
          </span>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            aria-label="Swap translation direction"
            onClick={swapDirection}
            className="size-9 shrink-0 rounded-xl"
          >
            <ArrowRightLeft className="size-4" aria-hidden="true" />
          </Button>
          <span className="flex-1 text-center text-sm font-semibold">
            {direction === "en-de" ? "Deutsch" : "English"}
          </span>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmit(text);
          }}
        >
          <label htmlFor="source-input" className="text-sm font-semibold">
            Your {sourceLabel} text
          </label>
          <Textarea
            id="source-input"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={
              direction === "en-de"
                ? "e.g. Could you help me, please?"
                : "z. B. Kannst du mir helfen?"
            }
            rows={4}
            maxLength={600}
            className="mt-2 resize-none rounded-2xl text-base"
          />
          <Button
            type="submit"
            size="lg"
            disabled={mutation.isPending}
            className="mt-4 h-12 w-full rounded-2xl text-base font-semibold"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="size-5 animate-spin" aria-hidden="true" /> Translating…
              </>
            ) : (
              <>
                Translate <ArrowRight className="size-5" aria-hidden="true" />
              </>
            )}
          </Button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {EXAMPLES[direction].map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => {
                setText(example);
                handleSubmit(example);
              }}
              className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {example}
            </button>
          ))}
        </div>
      </Card>

      {mutation.isPending && !result ? (
        <Card className="mt-4 rounded-3xl border-none p-5">
          <div className="h-5 w-2/3 animate-pulse rounded-full bg-muted" />
          <div className="mt-3 h-4 w-1/2 animate-pulse rounded-full bg-muted" />
        </Card>
      ) : null}

      {result ? (
        <Card className="shadow-soft mt-4 rounded-3xl border-none p-5">
          <div className="flex items-start justify-between gap-3">
            <p className="font-display text-xl font-extrabold leading-snug">{result.german}</p>
            <div className="flex shrink-0 gap-2">
              <Button
                type="button"
                variant="secondary"
                size="icon"
                aria-label="Listen in German"
                onClick={() => speak(result.german)}
                className="size-11 rounded-2xl"
              >
                <Volume2 className="size-5" aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                aria-label="Listen slowly"
                onClick={() => speak(result.german, 0.6)}
                className="size-11 rounded-2xl"
              >
                <Turtle className="size-5" aria-hidden="true" />
              </Button>
            </div>
          </div>

          <p className="mt-2 text-sm text-muted-foreground">🗣 {result.pronunciation}</p>
          {result.syllables ? (
            <p className="mt-1 font-mono text-sm tracking-wide text-primary">{result.syllables}</p>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge className="rounded-full capitalize">{result.formality}</Badge>
            {instant ? (
              <Badge variant="secondary" className="rounded-full">
                <Zap className="size-3" aria-hidden="true" /> Instant
              </Badge>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={copyGerman}
              className="ml-auto h-8 rounded-full text-xs"
            >
              {copied ? (
                <Check className="size-4" aria-hidden="true" />
              ) : (
                <Copy className="size-4" aria-hidden="true" />
              )}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>

          <p className="mt-4 text-sm">
            <span className="font-semibold">Meaning:</span> {result.english}
          </p>
          <p className="mt-2 text-sm">
            <span className="font-semibold">Word-for-word:</span> {result.literalEnglish}
          </p>
          {result.notes ? (
            <p className="mt-3 rounded-2xl bg-secondary/20 p-3 text-sm">💡 {result.notes}</p>
          ) : null}

          {result.example?.german ? (
            <div className="mt-4 rounded-2xl bg-muted p-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                In a sentence
              </h2>
              <div className="mt-1 flex items-start justify-between gap-3">
                <p className="text-sm font-medium">{result.example.german}</p>
                <button
                  type="button"
                  aria-label="Listen to the example sentence"
                  onClick={() => speak(result.example.german)}
                  className="text-primary"
                >
                  <Volume2 className="size-4" aria-hidden="true" />
                </button>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{result.example.english}</p>
            </div>
          ) : null}

          {result.alternatives.length > 0 ? (
            <div className="mt-4">
              <h2 className="text-sm font-semibold">Other ways to say it</h2>
              <ul className="mt-2 space-y-2">
                {result.alternatives.map((alternative) => (
                  <li
                    key={alternative}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-muted px-3 py-2 text-sm"
                  >
                    <span>{alternative}</span>
                    <button
                      type="button"
                      aria-label={`Listen to ${alternative}`}
                      onClick={() => speak(alternative)}
                      className="text-primary"
                    >
                      <Volume2 className="size-4" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Card>
      ) : null}

      {sorted.length > 0 ? (
        <section className="mt-6">
          <h2 className="text-sm font-semibold">Recent phrases</h2>
          <ul className="mt-2 space-y-2">
            {sorted.slice(0, 8).map((entry) => (
              <li
                key={entry.id}
                className="flex items-center gap-2 rounded-2xl bg-card px-3 py-2 shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => openEntry(entry)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="truncate text-sm font-semibold">{entry.result.german}</p>
                  <p className="truncate text-xs text-muted-foreground">{entry.source}</p>
                </button>
                <button
                  type="button"
                  aria-label={entry.favorite ? "Remove from favourites" : "Save to favourites"}
                  aria-pressed={entry.favorite}
                  onClick={() => toggleFavorite(entry.id)}
                  className={entry.favorite ? "text-accent" : "text-muted-foreground"}
                >
                  <Star
                    className="size-5"
                    fill={entry.favorite ? "currentColor" : "none"}
                    aria-hidden="true"
                  />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Your translations are saved here so you can replay them anytime.
        </p>
      )}
    </AppShell>
  );
}
