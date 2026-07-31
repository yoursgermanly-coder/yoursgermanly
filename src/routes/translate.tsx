import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Loader2, Volume2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { translateToGerman } from "@/lib/lernexa.functions";
import type { Translation } from "@/lib/lernexa-schemas";

export const Route = createFileRoute("/translate")({
  head: () => ({
    meta: [
      { title: "English to German Translator | Lernexa" },
      {
        name: "description",
        content:
          "Translate English to natural German with pronunciation help, formality hints and beginner-friendly notes.",
      },
      { property: "og:title", content: "English to German Translator | Lernexa" },
      {
        property: "og:description",
        content: "Instant, natural English to German translation with pronunciation and tips.",
      },
    ],
  }),
  component: TranslatePage,
});

const EXAMPLES = ["Where is the train station?", "I would like a coffee, please.", "Nice to meet you!"];

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    toast.error("Audio isn't supported on this device.");
    return;
  }
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "de-DE";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function TranslatePage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<Translation | null>(null);
  const translate = useServerFn(translateToGerman);
  const { recordTranslation } = useProgress();

  const mutation = useMutation({
    mutationFn: (value: string) => translate({ data: { text: value } }),
    onSuccess: (data) => {
      setResult(data);
      const { xp, unlocked } = recordTranslation();
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
      toast.error("Type something in English first.");
      return;
    }
    mutation.mutate(trimmed);
  };

  return (
    <AppShell title="Translate" subtitle="English → German, explained simply.">
      <Card className="shadow-soft rounded-3xl border-none p-5">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmit(text);
          }}
        >
          <label htmlFor="english-input" className="text-sm font-semibold">
            Your English text
          </label>
          <Textarea
            id="english-input"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="e.g. Could you help me, please?"
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
          {EXAMPLES.map((example) => (
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
            <Button
              type="button"
              variant="secondary"
              size="icon"
              aria-label="Listen in German"
              onClick={() => speak(result.german)}
              className="size-11 shrink-0 rounded-2xl"
            >
              <Volume2 className="size-5" aria-hidden="true" />
            </Button>
          </div>

          <p className="mt-2 text-sm text-muted-foreground">🗣 {result.pronunciation}</p>
          <Badge className="mt-3 rounded-full capitalize">{result.formality}</Badge>

          <p className="mt-4 text-sm">
            <span className="font-semibold">Word-for-word:</span> {result.literalEnglish}
          </p>
          {result.notes ? (
            <p className="mt-3 rounded-2xl bg-secondary/20 p-3 text-sm">💡 {result.notes}</p>
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

      {!result && !mutation.isPending ? (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Your translation will appear here. Try a phrase you'd actually use!
        </p>
      ) : null}
    </AppShell>
  );
}
