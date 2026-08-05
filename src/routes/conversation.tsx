import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Mic, RotateCcw, Send, Square, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useGermanSpeech } from "@/hooks/use-german-speech";
import { useProgress } from "@/hooks/use-progress";
import { generateConversationTurn } from "@/lib/lernexa.functions";
import {
  CEFR_LEVELS,
  CONVERSATION_SCENARIOS,
  type CefrLevel,
  type ConversationScenario,
  type ConversationTurn,
} from "@/lib/lernexa-schemas";
import { startRecording, transcribeGerman, type Recorder } from "@/lib/speaking";
import { logActivity } from "@/lib/insights";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/conversation")({
  head: () => ({
    meta: [
      { title: "Real-Life German Conversation Practice | Lernexa" },
      {
        name: "description",
        content:
          "Practise real German conversations — order a coffee, ask for directions or ace a job interview — with instant corrections and reply suggestions.",
      },
      { property: "og:title", content: "Real-Life German Conversation Practice | Lernexa" },
      {
        property: "og:description",
        content:
          "Role-play everyday German situations by voice or text and get instant, friendly corrections.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ConversationPage,
});

type ChatTurn = {
  role: "learner" | "partner";
  text: string;
  english?: string;
};

function ConversationPage() {
  const [scenario, setScenario] = useState<ConversationScenario | null>(null);
  const [level, setLevel] = useState<CefrLevel>("A1");
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [draft, setDraft] = useState("");
  const [latest, setLatest] = useState<ConversationTurn | null>(null);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const recorderRef = useRef<Recorder | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  const { speak } = useGermanSpeech();
  const { recordCorrectAnswer } = useProgress();
  const continueConversation = useServerFn(generateConversationTurn);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns.length, latest]);

  const mutation = useMutation({
    mutationFn: async (userText: string) => {
      if (!scenario) throw new Error("Pick a situation first.");
      return continueConversation({
        data: {
          scenarioTitle: scenario.title,
          partner: scenario.partner,
          level,
          history: turns.map(({ role, text }) => ({ role, text })),
          userText,
        },
      });
    },
    onSuccess: (data, userText) => {
      setLatest(data);
      setTurns((value) => [...value, { role: "partner", text: data.reply, english: data.replyEnglish }]);
      speak(data.reply);
      if (userText) {
        const result = recordCorrectAnswer();
        logActivity("conversation", result.xp);
        toast.success(`Nice reply! +${result.xp} XP`);
        for (const achievement of result.unlocked) {
          toast(`${achievement.emoji} Achievement unlocked: ${achievement.title}`);
        }
      }
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const start = (chosen: ConversationScenario) => {
    setScenario(chosen);
    setTurns([]);
    setLatest(null);
    setDraft("");
    setTimeout(() => mutation.mutate(""), 0);
  };

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || mutation.isPending) return;
    setTurns((value) => [...value, { role: "learner", text: trimmed }]);
    setLatest(null);
    setDraft("");
    mutation.mutate(trimmed);
  };

  const toggleRecording = async () => {
    if (recording) {
      const recorder = recorderRef.current;
      recorderRef.current = null;
      setRecording(false);
      if (!recorder) return;
      try {
        setTranscribing(true);
        const audio = await recorder.stop();
        const text = await transcribeGerman(audio);
        if (!text) {
          toast.error("We couldn't hear that. Try again a little louder.");
          return;
        }
        send(text);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Recording failed.");
      } finally {
        setTranscribing(false);
      }
      return;
    }

    try {
      recorderRef.current = await startRecording();
      setRecording(true);
    } catch {
      toast.error("We need microphone access to hear you.");
    }
  };

  if (!scenario) {
    return (
      <AppShell title="Real-life talks" subtitle="Role-play everyday German situations.">
        <Card className="shadow-soft rounded-3xl border-none p-5">
          <h2 className="text-base font-bold">Your level</h2>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {CEFR_LEVELS.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={level === value}
                onClick={() => setLevel(value)}
                className={cn(
                  "h-12 rounded-2xl border border-border text-sm font-semibold transition-colors",
                  level === value ? "border-transparent bg-primary text-primary-foreground" : "bg-card",
                )}
              >
                {value}
              </button>
            ))}
          </div>
        </Card>

        <h2 className="mt-5 px-1 text-base font-bold">Choose a situation</h2>
        <ul className="mt-3 space-y-3">
          {CONVERSATION_SCENARIOS.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => start(item)}
                className="w-full text-left transition-transform active:scale-[0.98]"
              >
                <Card className="shadow-soft flex items-center gap-4 rounded-3xl border-none p-4">
                  <span
                    aria-hidden="true"
                    className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-secondary/25 text-2xl"
                  >
                    {item.emoji}
                  </span>
                  <div>
                    <h3 className="text-base font-bold">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">Talk with {item.partner}.</p>
                  </div>
                </Card>
              </button>
            </li>
          ))}
        </ul>
      </AppShell>
    );
  }

  return (
    <AppShell title={scenario.title} subtitle={`Speaking with ${scenario.partner}.`}>
      <Card className="shadow-soft rounded-3xl border-none p-4">
        <ul className="space-y-3">
          {turns.map((turn, index) => (
            <li
              key={`${turn.role}-${index}`}
              className={cn("flex", turn.role === "learner" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-3xl px-4 py-3 text-sm",
                  turn.role === "learner"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground",
                )}
              >
                <p className="font-medium">{turn.text}</p>
                {turn.english ? (
                  <p className="mt-1 text-xs text-muted-foreground">{turn.english}</p>
                ) : null}
                {turn.role === "partner" ? (
                  <button
                    type="button"
                    onClick={() => speak(turn.text)}
                    aria-label="Play this line in German"
                    className="mt-2 flex items-center gap-1 text-xs font-semibold text-primary"
                  >
                    <Volume2 className="size-4" aria-hidden="true" /> Listen
                  </button>
                ) : null}
              </div>
            </li>
          ))}
          {mutation.isPending || transcribing ? (
            <li className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              {transcribing ? "Listening to you…" : "Chinnu is replying…"}
            </li>
          ) : null}
        </ul>
        <div ref={endRef} />
      </Card>

      {latest?.correction.hasIssue ? (
        <Card className="shadow-soft mt-3 rounded-3xl border-none bg-accent/15 p-4">
          <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            ✏️ Gentle correction
          </h2>
          <p className="mt-1 text-sm font-semibold">{latest.correction.corrected}</p>
          <p className="mt-1 text-sm text-muted-foreground">{latest.correction.note}</p>
        </Card>
      ) : null}

      {latest && latest.suggestions.length > 0 && !mutation.isPending ? (
        <Card className="shadow-soft mt-3 rounded-3xl border-none p-4">
          <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            💬 You could say
          </h2>
          <ul className="mt-2 space-y-2">
            {latest.suggestions.map((suggestion) => (
              <li key={suggestion.german}>
                <button
                  type="button"
                  onClick={() => send(suggestion.german)}
                  className="w-full rounded-2xl border border-border px-4 py-3 text-left text-sm transition-colors hover:border-primary"
                >
                  <span className="font-semibold">{suggestion.german}</span>
                  <span className="block text-xs text-muted-foreground">{suggestion.english}</span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          send(draft);
        }}
        className="mt-3 flex items-center gap-2"
      >
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Antworte auf Deutsch…"
          aria-label="Your reply in German"
          className="h-12 rounded-2xl"
        />
        <Button
          type="button"
          size="icon"
          variant={recording ? "destructive" : "secondary"}
          aria-label={recording ? "Stop recording" : "Speak your reply"}
          disabled={transcribing || mutation.isPending}
          onClick={() => void toggleRecording()}
          className="size-12 shrink-0 rounded-2xl"
        >
          {recording ? <Square className="size-5" /> : <Mic className="size-5" />}
        </Button>
        <Button
          type="submit"
          size="icon"
          aria-label="Send reply"
          disabled={!draft.trim() || mutation.isPending}
          className="size-12 shrink-0 rounded-2xl"
        >
          <Send className="size-5" />
        </Button>
      </form>

      <Button
        variant="ghost"
        onClick={() => {
          setScenario(null);
          setTurns([]);
          setLatest(null);
        }}
        className="mt-3 w-full rounded-2xl"
      >
        <RotateCcw className="size-4" aria-hidden="true" /> Change situation
      </Button>
    </AppShell>
  );
}
