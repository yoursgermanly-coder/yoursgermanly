import type { UIMessage } from "ai";

import { supabase } from "@/integrations/supabase/client";

export type TutorThread = {
  id: string;
  title: string;
  updated_at: string;
};

type MessageRow = {
  id: string;
  role: "user" | "assistant";
  parts: unknown;
  client_message_id: string | null;
};

export const TUTOR_STARTERS = [
  "How do I introduce myself in German?",
  "Explain der, die, das like I'm five.",
  "Give me 5 phrases for ordering coffee.",
  "Correct this: Ich habe 20 Jahre alt.",
] as const;

export async function listThreads(): Promise<TutorThread[]> {
  const { data, error } = await supabase
    .from("tutor_threads")
    .select("id, title, updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as TutorThread[];
}

export async function createThread(userId: string, title = "New chat"): Promise<TutorThread> {
  const { data, error } = await supabase
    .from("tutor_threads")
    .insert({ user_id: userId, title })
    .select("id, title, updated_at")
    .single();
  if (error) throw new Error(error.message);
  return data as TutorThread;
}

export async function deleteThread(threadId: string): Promise<void> {
  const { error } = await supabase.from("tutor_threads").delete().eq("id", threadId);
  if (error) throw new Error(error.message);
}

export async function renameThread(threadId: string, title: string): Promise<void> {
  const { error } = await supabase
    .from("tutor_threads")
    .update({ title, updated_at: new Date().toISOString() })
    .eq("id", threadId);
  if (error) throw new Error(error.message);
}

export async function getThread(threadId: string): Promise<TutorThread | null> {
  const { data, error } = await supabase
    .from("tutor_threads")
    .select("id, title, updated_at")
    .eq("id", threadId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as TutorThread | null) ?? null;
}

export async function loadThreadMessages(threadId: string): Promise<UIMessage[]> {
  const { data, error } = await supabase
    .from("tutor_messages")
    .select("id, role, parts, client_message_id")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);

  return ((data ?? []) as MessageRow[]).map((row) => ({
    id: row.client_message_id ?? row.id,
    role: row.role,
    parts: Array.isArray(row.parts) ? (row.parts as UIMessage["parts"]) : [],
  }));
}

/** First user line makes a friendly thread title. */
export function titleFromText(text: string): string {
  const clean = text.trim().replace(/\s+/g, " ");
  if (clean.length <= 48) return clean || "New chat";
  return `${clean.slice(0, 45)}…`;
}
