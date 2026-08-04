import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

import { createLovableAiGatewayProvider, CHAT_MODEL } from "@/lib/ai-gateway.server";

type ChatRequestBody = { messages?: unknown; threadId?: unknown };

const TUTOR_SYSTEM_PROMPT = [
  "You are Chinnu, a warm and encouraging personal German tutor for English speakers using the Lernexa app.",
  "Speak simple English. Keep answers short and friendly, and never make the learner feel bad about mistakes.",
  "Always show German text in **bold** and give the English meaning right after it.",
  "When the learner writes German, gently correct it: show the corrected sentence, then one short reason why.",
  "Add a simple pronunciation hint (English respelling) for new German words.",
  "End most replies with one small follow-up question or mini challenge to keep the conversation going.",
  "Use at most one short list per reply. No walls of text.",
].join(" ");

function supabaseForToken(token: string) {
  const url = process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"];
  const key =
    process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Supabase is not configured");
  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        if (!token) return new Response("Unauthorized", { status: 401 });

        const body = (await request.json()) as ChatRequestBody;
        const messages = body.messages;
        const threadId = typeof body.threadId === "string" ? body.threadId : null;
        if (!Array.isArray(messages) || !threadId) {
          return new Response("Messages and threadId are required", { status: 400 });
        }

        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("AI is not configured yet.", { status: 500 });

        const supabase = supabaseForToken(token);
        const { data: userData, error: userError } = await supabase.auth.getUser();
        const userId = userData.user?.id;
        if (userError || !userId) return new Response("Unauthorized", { status: 401 });

        const { data: thread, error: threadError } = await supabase
          .from("tutor_threads")
          .select("id")
          .eq("id", threadId)
          .maybeSingle();
        if (threadError) return new Response(threadError.message, { status: 500 });
        if (!thread) return new Response("Conversation not found", { status: 404 });

        const uiMessages = messages as UIMessage[];
        const lastMessage = uiMessages[uiMessages.length - 1];

        if (lastMessage?.role === "user") {
          const { error: insertError } = await supabase.from("tutor_messages").insert({
            thread_id: threadId,
            user_id: userId,
            role: "user",
            parts: lastMessage.parts,
            client_message_id: lastMessage.id,
          });
          if (insertError) console.error("[lernexa] saving user message failed", insertError);
        }

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway(CHAT_MODEL),
          system: TUTOR_SYSTEM_PROMPT,
          messages: await convertToModelMessages(uiMessages),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: uiMessages,
          onFinish: async ({ responseMessage }) => {
            const { error } = await supabase.from("tutor_messages").insert({
              thread_id: threadId,
              user_id: userId,
              role: "assistant",
              parts: responseMessage.parts,
              client_message_id: responseMessage.id,
            });
            if (error) console.error("[lernexa] saving assistant message failed", error);
            const { error: touchError } = await supabase
              .from("tutor_threads")
              .update({ updated_at: new Date().toISOString() })
              .eq("id", threadId);
            if (touchError) console.error("[lernexa] touching thread failed", touchError);
          },
        });
      },
    },
  },
});
