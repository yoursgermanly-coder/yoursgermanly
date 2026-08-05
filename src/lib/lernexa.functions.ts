import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";

import {
  ConversationTurnInput,
  ConversationTurnSchema,
  GrammarLessonInput,
  GrammarLessonSchema,
  QuizInput,
  QuizSchema,
  SpeakingSetInput,
  StudyPlanInput,
  StudyPlanSchema,
  SpeakingSetSchema,
  TranslateInput,
  TranslationSchema,
  VocabularyInput,
  VocabularySchema,
  toFriendlyAiError,
  type ConversationTurn,
  type GrammarLesson,
  type QuizQuestion,
  type SpeakingPhrase,
  type StudyPlan,
  type Translation,
  type VocabularyItem,
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
          "You write fun, clear multiple-choice German practice questions for English speakers, and you teach through the answer review. " +
          "Each question has exactly 4 options and exactly one correct answer. " +
          "`explanation` says in 1-2 simple English sentences why the correct option is right. " +
          "`rule` states the underlying German rule in one short, plain-English sentence (e.g. 'After the preposition mit the noun takes the dative case'). " +
          "`optionFeedback` has exactly 4 entries, one per option in the same order: for the correct option start with 'Correct — ' and confirm why; " +
          "for every wrong option explain in one short sentence exactly what is wrong with it (wrong gender, wrong case, wrong verb ending, means something else, etc.). " +
          "`tip` is one memorable trick to remember this point next time. " +
          "Use simple, encouraging English with no jargon, and vary the questions every time.",
        prompt: `Write ${data.count} CEFR ${data.level} German questions about "${data.topic}". Random seed: ${Math.random()}`,

      });
      return output.questions;
    } catch (error) {
      throw toFriendlyAiError(error);
    }
  });

export const generateVocabulary = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => VocabularyInput.parse(input))
  .handler(async ({ data }): Promise<VocabularyItem[]> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI is not configured yet.");

    const { createLovableAiGatewayProvider, CHAT_MODEL } = await import("./ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key);

    try {
      const { output } = await generateText({
        model: gateway(CHAT_MODEL),
        output: Output.object({ schema: VocabularySchema }),
        temperature: 1,
        system:
          "You build German vocabulary packs for English speakers. " +
          "`german` is the base word without an article. " +
          "`article` is der/die/das for nouns, or an empty string for other word types. " +
          "`english` is a short meaning (max 4 words). " +
          "`example` is one short everyday German sentence using the word, and `exampleEnglish` is its English meaning. " +
          "Choose useful, high-frequency words for the level. Never repeat a word within one pack.",
        prompt:
          `Give ${data.count} CEFR ${data.level} German words for the topic "${data.topic}".` +
          (data.exclude.length > 0
            ? ` Do not include any of these already-learned words: ${data.exclude.slice(0, 120).join(", ")}.`
            : "") +
          ` Random seed: ${Math.random()}`,
      });
      return output.words;
    } catch (error) {
      throw toFriendlyAiError(error);
    }
  });

export const generateGrammarLesson = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => GrammarLessonInput.parse(input))
  .handler(async ({ data }): Promise<GrammarLesson> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI is not configured yet.");

    const { createLovableAiGatewayProvider, CHAT_MODEL } = await import("./ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key);

    try {
      const { output } = await generateText({
        model: gateway(CHAT_MODEL),
        output: Output.object({ schema: GrammarLessonSchema }),
        system:
          "You are a warm, encouraging German grammar teacher for absolute beginners who speak English. " +
          "Explain in very simple English, short sentences, no linguistic jargon (or explain it in plain words). " +
          "`intro` is 1-2 friendly sentences on why this grammar point matters in real life. " +
          "Each rule has a short heading, a 1-3 sentence explanation, and 1-3 everyday German examples with English meanings. " +
          "`tip` is one memorable trick to remember the rule. `mistake` is the most common beginner mistake and how to avoid it. " +
          "`practice` questions have exactly 3 options, one correct answer, and a kind one-sentence explanation.",
        prompt: `Teach the CEFR ${data.level} German grammar topic "${data.topicTitle}" to a beginner. Random seed: ${Math.random()}`,
      });
      return output;
    } catch (error) {
      throw toFriendlyAiError(error);
    }
  });

export const generateSpeakingSet = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SpeakingSetInput.parse(input))
  .handler(async ({ data }): Promise<SpeakingPhrase[]> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI is not configured yet.");

    const { createLovableAiGatewayProvider, CHAT_MODEL } = await import("./ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key);

    try {
      const { output } = await generateText({
        model: gateway(CHAT_MODEL),
        output: Output.object({ schema: SpeakingSetSchema }),
        temperature: 1,
        system:
          "You create short German speaking and listening drills for English speakers. " +
          "`german` is one natural spoken sentence (max 12 words) a learner would really say. " +
          "`english` is its meaning. `pronunciation` is a simple English respelling with the stressed syllable in CAPITALS. " +
          "`tip` is one short, kind pronunciation tip about a tricky sound in the sentence. " +
          "Never repeat a sentence within one set.",
        prompt: `Give ${data.count} CEFR ${data.level} German sentences for the situation "${data.scenario}". Random seed: ${Math.random()}`,
      });
      return output.phrases;
    } catch (error) {
      throw toFriendlyAiError(error);
    }
  });

export const generateConversationTurn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ConversationTurnInput.parse(input))
  .handler(async ({ data }): Promise<ConversationTurn> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI is not configured yet.");

    const { createLovableAiGatewayProvider, CHAT_MODEL } = await import("./ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key);

    const transcript = data.history
      .map((turn) => `${turn.role === "learner" ? "Learner" : "You"}: ${turn.text}`)
      .join("\n");

    try {
      const { output } = await generateText({
        model: gateway(CHAT_MODEL),
        output: Output.object({ schema: ConversationTurnSchema }),
        temperature: 1,
        system:
          `You are role-playing as ${data.partner} in the real-life situation "${data.scenarioTitle}". ` +
          `The learner is at CEFR ${data.level}. Stay fully in character and always answer in German. ` +
          "`reply` is your next line in the conversation: 1-2 short, natural German sentences, and it should keep the conversation going with a question when it makes sense. " +
          "`replyEnglish` is its English meaning. " +
          "`correction` reviews ONLY the learner's last message: set `hasIssue` to false with empty strings when it was fine; " +
          "otherwise give the corrected German in `corrected` and a kind one-sentence reason in simple English in `note`. " +
          "`suggestions` are 2-3 natural German things the learner could say next, each with its English meaning, at their level. " +
          "Keep vocabulary appropriate for the level and be warm and encouraging.",
        prompt:
          (transcript ? `Conversation so far:\n${transcript}\n\n` : "") +
          (data.userText
            ? `The learner just said: "${data.userText}". Reply in character.`
            : "Start the conversation with a natural greeting in character."),
      });
      return output;
    } catch (error) {
      throw toFriendlyAiError(error);
    }
  });

export const generateStudyPlan = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => StudyPlanInput.parse(input))
  .handler(async ({ data }): Promise<StudyPlan> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI is not configured yet.");

    const { createLovableAiGatewayProvider, CHAT_MODEL } = await import("./ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key);

    try {
      const { output } = await generateText({
        model: gateway(CHAT_MODEL),
        output: Output.object({ schema: StudyPlanSchema }),
        temperature: 1,
        system:
          "You are a warm, motivating German learning coach. You design a short personalised study plan for today. " +
          "`headline` is a friendly one-line greeting about their momentum. " +
          "`focus` names the single skill to prioritise today. `why` explains that choice in one simple sentence based on their data. " +
          "Each step has a clear title, a one-sentence detail with something concrete to practise, a realistic minute count, " +
          "and the matching `skill` id. The minutes across steps must roughly add up to the learner's available time. " +
          "`encouragement` is one short, kind closing line. Use simple English and never shame the learner.",
        prompt:
          `Learner data — CEFR level: ${data.level}; minutes available today: ${data.minutes}; ` +
          `current streak: ${data.streak} days; XP in the last 7 days: ${data.weekXp}; ` +
          `strongest skill: ${data.strongest || "unknown"}; weakest skill: ${data.weakest || "unknown"}; ` +
          `never practised: ${data.untouched.join(", ") || "none"}; vocabulary words due for review: ${data.dueWords}.`,
      });
      return output;
    } catch (error) {
      throw toFriendlyAiError(error);
    }
  });
