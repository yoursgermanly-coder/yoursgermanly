import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

/**
 * Shared provider for the OpenAI API. Server-only.
 */
export function createLovableAiGatewayProvider(apiKey: string) {
  return createOpenAICompatible({
    name: "openai",
    baseURL: "https://api.openai.com/v1",
    headers: { Authorization: `Bearer ${apiKey}` },
    supportsStructuredOutputs: true,
  });
}

export const CHAT_MODEL = "gpt-4o-mini";
export const TRANSCRIBE_MODEL = "gpt-4o-mini-transcribe";
