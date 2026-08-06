import { z } from "zod";

export const TRANSLATION_DIRECTIONS = ["en-de", "de-en"] as const;
export type TranslationDirection = (typeof TRANSLATION_DIRECTIONS)[number];

export const TranslateInput = z.object({
  text: z.string().min(1).max(600),
  direction: z.enum(TRANSLATION_DIRECTIONS).default("en-de"),
});

export const TranslationSchema = z.object({
  german: z.string(),
  english: z.string(),
  literalEnglish: z.string(),
  pronunciation: z.string(),
  syllables: z.string(),
  formality: z.enum(["informal", "formal", "neutral"]),
  notes: z.string(),
  alternatives: z.array(z.string()).max(3),
  example: z.object({
    german: z.string(),
    english: z.string(),
  }),
});

export type Translation = z.infer<typeof TranslationSchema>;

export const CEFR_LEVELS = ["A1", "A2", "B1", "B2"] as const;
export type CefrLevel = (typeof CEFR_LEVELS)[number];

export const QuizInput = z.object({
  topic: z.string().min(1).max(60),
  level: z.enum(CEFR_LEVELS),
  count: z.number().int().min(1).max(10),
});

export const QuizSchema = z.object({
  questions: z
    .array(
      z.object({
        prompt: z.string(),
        options: z.array(z.string()).length(4),
        correctIndex: z.number().int().min(0).max(3),
        explanation: z.string(),
        rule: z.string(),
        optionFeedback: z.array(z.string()).length(4),
        tip: z.string(),
      }),
    )
    .min(1),
});

export type QuizQuestion = z.infer<typeof QuizSchema>["questions"][number];

export const QUIZ_TOPICS = [
  "Greetings & introductions",
  "Everyday vocabulary",
  "Ordering food & drinks",
  "Travel & directions",
  "Numbers & time",
  "Articles der/die/das",
  "Verb conjugation",
  "Small talk",
] as const;

export const VOCAB_TOPICS = [
  "Everyday essentials",
  "Food & drink",
  "Travel & transport",
  "Home & family",
  "Work & office",
  "Shopping & money",
  "Health & body",
  "Nature & weather",
  "Feelings & opinions",
  "Common verbs",
] as const;

export const VocabularyInput = z.object({
  topic: z.string().min(1).max(60),
  level: z.enum(CEFR_LEVELS),
  count: z.number().int().min(1).max(12),
  exclude: z.array(z.string()).max(200).default([]),
});

export const VocabularySchema = z.object({
  words: z
    .array(
      z.object({
        german: z.string(),
        english: z.string(),
        article: z.string(),
        example: z.string(),
        exampleEnglish: z.string(),
      }),
    )
    .min(1),
});

export type VocabularyItem = z.infer<typeof VocabularySchema>["words"][number];

export function toFriendlyAiError(error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("429")) {
    return new Error("Too many requests right now. Please try again in a moment.");
  }
  if (message.includes("402")) {
    return new Error("AI credits are exhausted. Please add credits to continue.");
  }
  console.error("[lernexa] AI gateway error:", message);
  return new Error("We couldn't reach the AI tutor. Please try again.");
}

export const GrammarLessonInput = z.object({
  topicId: z.string().min(1).max(60),
  topicTitle: z.string().min(1).max(80),
  level: z.enum(CEFR_LEVELS),
});

export const GrammarLessonSchema = z.object({
  intro: z.string(),
  rules: z
    .array(
      z.object({
        heading: z.string(),
        explanation: z.string(),
        examples: z
          .array(z.object({ german: z.string(), english: z.string() }))
          .min(1)
          .max(3),
      }),
    )
    .min(2)
    .max(4),
  tip: z.string(),
  mistake: z.string(),
  practice: z
    .array(
      z.object({
        prompt: z.string(),
        options: z.array(z.string()).length(3),
        correctIndex: z.number().int().min(0).max(2),
        explanation: z.string(),
      }),
    )
    .min(3)
    .max(5),
});

export type GrammarLesson = z.infer<typeof GrammarLessonSchema>;

export const SPEAKING_SCENARIOS = [
  "Greetings & introductions",
  "Ordering in a café",
  "Asking for directions",
  "Shopping & prices",
  "Small talk with neighbours",
  "At the doctor",
  "Travel & train station",
  "At work",
] as const;

export const SpeakingSetInput = z.object({
  scenario: z.string().min(1).max(60),
  level: z.enum(CEFR_LEVELS),
  count: z.number().int().min(3).max(8),
});

export const SpeakingSetSchema = z.object({
  phrases: z
    .array(
      z.object({
        german: z.string(),
        english: z.string(),
        pronunciation: z.string(),
        tip: z.string(),
      }),
    )
    .min(3),
});

export type SpeakingPhrase = z.infer<typeof SpeakingSetSchema>["phrases"][number];

export const CONVERSATION_SCENARIOS = [
  { id: "cafe", title: "Ordering in a café", emoji: "☕", partner: "a friendly barista in Berlin" },
  {
    id: "directions",
    title: "Asking for directions",
    emoji: "🗺️",
    partner: "a helpful passer-by on the street",
  },
  {
    id: "shopping",
    title: "Shopping for clothes",
    emoji: "🛍️",
    partner: "a shop assistant in a clothing store",
  },
  { id: "doctor", title: "At the doctor", emoji: "🩺", partner: "a calm family doctor" },
  { id: "hotel", title: "Checking into a hotel", emoji: "🏨", partner: "a hotel receptionist" },
  {
    id: "smalltalk",
    title: "Small talk with a neighbour",
    emoji: "👋",
    partner: "your chatty neighbour Frau Weber",
  },
  { id: "interview", title: "Job interview", emoji: "💼", partner: "a polite hiring manager" },
  { id: "train", title: "At the train station", emoji: "🚆", partner: "a ticket counter clerk" },
] as const;

export type ConversationScenario = (typeof CONVERSATION_SCENARIOS)[number];

export const ConversationTurnInput = z.object({
  scenarioTitle: z.string().min(1).max(80),
  partner: z.string().min(1).max(120),
  level: z.enum(CEFR_LEVELS),
  history: z
    .array(z.object({ role: z.enum(["learner", "partner"]), text: z.string().max(600) }))
    .max(30)
    .default([]),
  userText: z.string().max(600).default(""),
});

export const ConversationTurnSchema = z.object({
  reply: z.string(),
  replyEnglish: z.string(),
  correction: z.object({
    hasIssue: z.boolean(),
    corrected: z.string(),
    note: z.string(),
  }),
  suggestions: z
    .array(z.object({ german: z.string(), english: z.string() }))
    .min(2)
    .max(3),
});

export type ConversationTurn = z.infer<typeof ConversationTurnSchema>;

export const StudyPlanInput = z.object({
  level: z.enum(CEFR_LEVELS),
  minutes: z.number().int().min(5).max(60),
  streak: z.number().int().min(0).max(2000),
  weekXp: z.number().int().min(0).max(100000),
  strongest: z.string().max(60).default(""),
  weakest: z.string().max(60).default(""),
  untouched: z.array(z.string().max(60)).max(6).default([]),
  dueWords: z.number().int().min(0).max(10000).default(0),
});

export const StudyPlanSchema = z.object({
  headline: z.string(),
  focus: z.string(),
  why: z.string(),
  steps: z
    .array(
      z.object({
        title: z.string(),
        detail: z.string(),
        minutes: z.number().int().min(1).max(30),
        skill: z.enum(["quiz", "vocabulary", "translate", "grammar", "speaking", "conversation"]),
      }),
    )
    .min(2)
    .max(4),
  encouragement: z.string(),
});

export type StudyPlan = z.infer<typeof StudyPlanSchema>;
