import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Check, Ear, Loader2, Mic, Sparkles, Square, Volume2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGermanSpeech } from "@/hooks/use-german-speech";
import { useProgress } from "@/hooks/use-progress";
import { generateSpeakingSet } from "@/lib/lernexa.functions";
import {
  CEFR_LEVELS,
  SPEAKING_SCENARIOS,
  type CefrLevel,
  type SpeakingPhrase,
} from "@/lib/lernexa-schemas";
import {
  feedbackForScore,
  normalizeGerman,
  scoreAttempt,
  startRecording,
  transcribeGerman,
  type Recorder,
} from "@/lib/speaking";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/speak")({
  head: () => ({
    meta: [
      { title: "German Speaking & Listening Practice | Lernexa" },
      {
        name: "description",
        content:
          "Practise speaking German out loud with instant pronunciation scoring, and train your ear with native-voice listening exercises.",
      },
      { property: "og:title", content: "German Speaking & Listening Practice | Lernexa" },
      {
        property: "og:description",
        content:
          "Record yourself, get an instant pronunciation score, and test your listening with spoken German sentences.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SpeakPage,
});

function SpeakPage() {
  const [scenario, setScenario] = useState<string>(SPEAKING_SCENARIOS[0]);
  const [level, setLevel] = useState<CefrLevel>("A1");
  const [phrases, setPhrases] = useState<SpeakingPhrase[]>([]);
  const [index, setIndex] = useState(0);

  const generate = useServerFn(generateSpeakingSet);
  const mutation = useMutation({
    mutationFn: () => generate({ data: { scenario, level, count: 5 } }),
    onSuccess: (data) => {
      setPhrases(data);
      setIndex(0);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const phrase = phrases[index];

  return (
    <AppShell title="Speak & Listen" subtitle="Say it out loud — that's how it sticks.">
      <Card className="shadow-soft rounded-3xl border-none p-5">
        <h2 className="text-base font-bold">Pick a situation</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {SPEAKING_SCENARIOS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setScenario(item)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                scenario === item
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {CEFR_LEVELS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setLevel(item)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                level === item ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              {item}
            </button>
          ))}
        </div>
        <Button
          className="mt-4 w-full rounded-2xl"
          size="lg"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Preparing your drill…
            </>
          ) : (
            <>
              <Sparkles className="size-4" aria-hidden="true" />
              {phrases.length > 0 ? "New sentences" : "Start practising"}
            </>
          )}
        </Button>
      </Card>

      {phrases.length > 0 && phrase ? (
        <Card className="shadow-soft mt-4 rounded-3xl border-none p-5">
          <div className="flex items-center justify-between gap-3">
            <Badge variant="secondary" className="rounded-full">
              {index + 1} of {phrases.length}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full"
              onClick={() => setIndex((current) => (current + 1) % phrases.length)}
            >
              Next sentence
            </Button>
          </div>
          <Progress value={((index + 1) / phrases.length) * 100} className="mt-3 h-2" />

          <Tabs defaultValue="speak" className="mt-4">
            <TabsList className="grid w-full grid-cols-2 rounded-2xl">
              <TabsTrigger value="speak" className="rounded-xl">
                <Mic className="size-4" aria-hidden="true" /> Speak
              </TabsTrigger>
              <TabsTrigger value="listen" className="rounded-xl">
                <Ear className="size-4" aria-hidden="true" /> Listen
              </TabsTrigger>
            </TabsList>

            <TabsContent value="speak" className="mt-4">
              <SpeakingDrill key={`s-${index}`} phrase={phrase} />
            </TabsContent>
            <TabsContent value="listen" className="mt-4">
              <ListeningDrill key={`l-${index}`} phrase={phrase} />
            </TabsContent>
          </Tabs>
        </Card>
      ) : (
        <Card className="shadow-soft mt-4 rounded-3xl border-none p-6 text-center">
          <Mic className="mx-auto size-8 text-primary" aria-hidden="true" />
          <p className="mt-3 text-sm text-muted-foreground">
            Choose a situation and level, then practise saying real German sentences out loud. You'll
            get an instant pronunciation score and a friendly tip.
          </p>
        </Card>
      )}
    </AppShell>
  );
}

function PhraseAudio({ german }: { german: string }) {
  const { speak } = useGermanSpeech();
  return (
    <div className="flex gap-2">
      <Button variant="secondary" size="sm" className="rounded-full" onClick={() => speak(german)}>
        <Volume2 className="size-4" aria-hidden="true" /> Listen
      </Button>
      <Button variant="outline" size="sm" className="rounded-full" onClick={() => speak(german, 0.6)}>
        <Volume2 className="size-4" aria-hidden="true" /> Slow
      </Button>
    </div>
  );
}

function SpeakingDrill({ phrase }: { phrase: SpeakingPhrase }) {
  const { recordCorrectAnswer } = useProgress();
  const recorderRef = useRef<Recorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<{ score: number; heard: string } | null>(null);

  const start = async () => {
    try {
      recorderRef.current = await startRecording();
      setResult(null);
      setIsRecording(true);
    } catch {
      toast.error("We need microphone access to hear you. Please allow it and try again.");
    }
  };

  const stop = async () => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    setIsRecording(false);
    setIsChecking(true);
    try {
      const blob = await recorder.stop();
      recorderRef.current = null;
      if (blob.size < 2048) {
        toast.error("That recording was empty — please try again.");
        return;
      }
      const heard = await transcribeGerman(blob);
      if (!heard) {
        toast.error("We couldn't hear any speech. Please try again.");
        return;
      }
      const score = scoreAttempt(phrase.german, heard);
      setResult({ score, heard });
      if (score >= 65) {
        const { xp } = recordCorrectAnswer();
        toast.success(`Nice pronunciation! +${xp} XP`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setIsChecking(false);
    }
  };

  const feedback = result ? feedbackForScore(result.score) : null;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-muted/60 p-4">
        <p className="text-lg font-bold">{phrase.german}</p>
        <p className="mt-1 text-sm text-muted-foreground">{phrase.english}</p>
        <p className="mt-2 text-xs font-semibold text-primary">{phrase.pronunciation}</p>
      </div>
      <PhraseAudio german={phrase.german} />
      <p className="text-xs text-muted-foreground">💡 {phrase.tip}</p>

      <Button
        size="lg"
        className="w-full rounded-2xl"
        variant={isRecording ? "destructive" : "default"}
        onClick={isRecording ? stop : start}
        disabled={isChecking}
      >
        {isChecking ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Listening to you…
          </>
        ) : isRecording ? (
          <>
            <Square className="size-4" aria-hidden="true" /> Stop and check
          </>
        ) : (
          <>
            <Mic className="size-4" aria-hidden="true" /> Record yourself
          </>
        )}
      </Button>

      {result && feedback ? (
        <div className="rounded-2xl border border-border p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="font-bold">{feedback.label}</p>
            <Badge className="rounded-full">{result.score}%</Badge>
          </div>
          <Progress value={result.score} className="mt-3 h-2" />
          <p className="mt-3 text-sm text-muted-foreground">{feedback.message}</p>
          <p className="mt-2 text-xs text-muted-foreground">We heard: “{result.heard}”</p>
        </div>
      ) : null}
    </div>
  );
}

function ListeningDrill({ phrase }: { phrase: SpeakingPhrase }) {
  const { recordCorrectAnswer } = useProgress();
  const [answer, setAnswer] = useState("");
  const [checked, setChecked] = useState(false);
  const isCorrect = normalizeGerman(answer) === normalizeGerman(phrase.german);

  const check = () => {
    if (!answer.trim()) return;
    setChecked(true);
    if (normalizeGerman(answer) === normalizeGerman(phrase.german)) {
      const { xp } = recordCorrectAnswer();
      toast.success(`Perfect ear! +${xp} XP`);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Play the sentence and type what you hear. No peeking — the answer appears after you check.
      </p>
      <PhraseAudio german={phrase.german} />
      <Input
        value={answer}
        onChange={(event) => {
          setAnswer(event.target.value);
          setChecked(false);
        }}
        placeholder="Type the German you heard…"
        className="rounded-2xl"
        aria-label="What you heard in German"
      />
      <Button className="w-full rounded-2xl" size="lg" onClick={check} disabled={!answer.trim()}>
        <Check className="size-4" aria-hidden="true" /> Check my answer
      </Button>

      {checked ? (
        <div
          className={cn(
            "rounded-2xl p-4 text-sm",
            isCorrect ? "bg-secondary/20 text-foreground" : "bg-muted text-foreground",
          )}
        >
          <p className="font-bold">{isCorrect ? "Richtig! 🎉" : "So close — here it is:"}</p>
          <p className="mt-2 text-base font-semibold">{phrase.german}</p>
          <p className="mt-1 text-muted-foreground">{phrase.english}</p>
        </div>
      ) : null}
    </div>
  );
}
