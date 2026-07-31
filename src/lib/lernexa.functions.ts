import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";

const TranslateInput = z.object({
  text: z.string().min(1).max(600),
});

const TranslationSchema = z.object({
  german: z.string(),
  literalEnglish: z.string(),
  pronunciation: z.string(),
  formality: z.enum(["informal", "formal", "neutral"]),
  notes: z.string(),
  alternatives: z.array(z.string()).max(3),
});

export type Translation = z.infer<typeof TranslationSchema>;

const QuizInput = z.object({
  topic: z.string().min(1).max(60),
  level: z.enum(["A1", "A2", "B1", "B2"]),
  count: z.number().int().min(1).max(10),
});

const QuizSchema = z.object({
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

function gatewayError(error: unknown): never {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("429")) {
    throw new Error("Too many requests right now. Please try again in a moment.");
  }
  if (message.includes("402")) {
    throw new Error("AI credits are exhausted. Please add credits to continue.");
  }
  throw new Error("We couldn't reach the AI tutor. Please try again.");
}

export const translateToGerman = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => TranslateInput.parse(input))
  .handler(async ({ data }): Promise<Translation> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI is not configured yet.");

    const { createLovableAiGatewayProvider, CHAT_MODEL } = await import("./ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key);

    try {
      const { output } = await generateText({
        model: gateway(CHAT_MODEL),
        output: Output.object({ schema: TranslationSchema }),
        system:
          "You are a warm, encouraging German tutor for beginners. Translate English into natural, everyday German. " +
          "Keep notes short (max 2 sentences), friendly, and beginner-friendly in simple English. " +
          "pronunciation is a simple English-phonetic respelling. alternatives are other natural ways to say it (may be empty).",
        prompt: data.text,
      });
      return output;
    } catch (error) {
      gatewayError(error);
    }
  });

export const generateQuiz = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => QuizInput.parse(input))
  .handler(async ({ data }): Promise<QuizQuestion[]> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI is not configured yet.");

    const { createLovableAiGatewayProvider, CHAT_MODEL } = await import("./ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key);

    try {
      const { output } = await generateText({
        model: gateway(CHAT_MODEL),
        output: Output.object({ schema: QuizSchema }),
        temperature: 1,
        system:
          "You write fun, clear multiple-choice German practice questions for English speakers. " +
          "Each question has exactly 4 options, exactly one correct, and a short encouraging explanation in simple English. " +
          "Vary the questions every time and never repeat the same sentence twice in one set.",
        prompt: `Write ${data.count} CEFR ${data.level} German questions about "${data.topic}". Random seed: ${Math.random()}`,
      });
      return output.questions;
    } catch (error) {
      gatewayError(error);
    }
  });
