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
