import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

/**
 * Shared provider for the Lovable AI Gateway. Server-only.
 */
export function createLovableAiGatewayProvider(apiKey: string) {
  return createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: { Authorization: `Bearer ${apiKey}` },
    supportsStructuredOutputs: true,
  });
}

/** Reads the gateway key, falling back to a user-supplied OpenAI key. */
export function getAiApiKey(): string | undefined {
  return process.env["LOVABLE_API_KEY"] ?? process.env["OPENAI_API_KEY"];
}

export const CHAT_MODEL = "google/gemini-2.5-flash";
export const TRANSCRIBE_MODEL = "openai/gpt-4o-mini-transcribe";
