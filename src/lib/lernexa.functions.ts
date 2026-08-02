import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";

import {
  QuizInput,
  QuizSchema,
  TranslateInput,
  TranslationSchema,
  toFriendlyAiError,
  type QuizQuestion,
  type Translation,
} from "./lernexa-schemas";

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
          "You are a warm, encouraging German tutor for beginners. " +
          "Always fill both `german` and `english` with the same meaning, whichever language the learner typed. " +
          "Keep German natural and everyday. Keep notes short (max 2 sentences), friendly, in simple English. " +
          "`pronunciation` is a simple English-phonetic respelling of the German. " +
          "`syllables` is the German split with hyphens and the stressed syllable in CAPITALS (e.g. ent-SCHUL-di-gung). " +
          "`literalEnglish` is the word-for-word English of the German. " +
          "`alternatives` are other natural German ways to say it (may be empty). " +
          "`example` is one short everyday German sentence using the phrase, plus its English meaning.",
        prompt:
          data.direction === "de-en"
            ? `The learner typed German: "${data.text}". Explain it for an English speaker.`
            : `The learner typed English: "${data.text}". Translate it into German.`,
      });
      return output;
    } catch (error) {
      throw toFriendlyAiError(error);
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
          "Each question has exactly 4 options, exactly one correct answer, and a short encouraging explanation in simple English. " +
          "Vary the questions every time and never repeat a sentence within one set.",
        prompt: `Write ${data.count} CEFR ${data.level} German questions about "${data.topic}". Random seed: ${Math.random()}`,
      });
      return output.questions;
    } catch (error) {
      throw toFriendlyAiError(error);
    }
  });
