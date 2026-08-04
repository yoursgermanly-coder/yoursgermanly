import { useChat } from "@ai-sdk/react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { DefaultChatTransport } from "ai";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import tutorAvatar from "@/assets/tutor-lena.png";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { BottomNav } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  getThread,
  loadThreadMessages,
  renameThread,
  titleFromText,
  TUTOR_STARTERS,
} from "@/lib/tutor";
import type { UIMessage } from "ai";

export const Route = createFileRoute("/tutor/$threadId")({
  head: () => ({
    meta: [
      { title: "Chat with your AI German Tutor | Lernexa" },
      {
        name: "description",
        content:
          "Practise German in a friendly chat with Chinnu, your AI tutor: instant corrections, pronunciation hints and conversation practice.",
      },
      { property: "og:title", content: "Chat with your AI German Tutor | Lernexa" },
      {
        property: "og:description",
        content: "A personal AI German teacher that corrects, explains and chats with you.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TutorThreadPage,
});

function TutorThreadPage() {
  const { threadId } = Route.useParams();
  const { isLoading: isAuthLoading, isSignedIn } = useAuth();
  const navigate = useNavigate();
  const [initialMessages, setInitialMessages] = useState<UIMessage[] | null>(null);
  const [title, setTitle] = useState("New chat");

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isSignedIn) {
      void navigate({ to: "/auth" });
      return;
    }
    let isActive = true;
    void (async () => {
      try {
        const thread = await getThread(threadId);
        if (!thread) {
          toast.error("That conversation isn't available.");
          await navigate({ to: "/tutor" });
          return;
        }
        const messages = await loadThreadMessages(threadId);
        if (!isActive) return;
        setTitle(thread.title);
        setInitialMessages(messages);
      } catch (error) {
        toast.error((error as Error).message);
      }
    })();
    return () => {
      isActive = false;
    };
  }, [isAuthLoading, isSignedIn, navigate, threadId]);

  if (isAuthLoading || initialMessages === null) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-3 bg-background">
        <Loader2 className="size-5 animate-spin text-primary" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">Waking up your tutor…</p>
      </div>
    );
  }

  return (
    <ChatWindow
      key={threadId}
      threadId={threadId}
      title={title}
      initialMessages={initialMessages}
      onTitleChange={setTitle}
    />
  );
}

function ChatWindow({
  threadId,
  title,
  initialMessages,
  onTitleChange,
}: {
  threadId: string;
  title: string;
  initialMessages: UIMessage[];
  onTitleChange: (title: string) => void;
}) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasTitle = useRef(initialMessages.length > 0);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { threadId },
        headers: async () => {
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token;
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
      }),
    [threadId],
  );

  const { messages, sendMessage, status } = useChat({
    id: threadId,
    messages: initialMessages,
    transport,
    onError: (error) => toast.error(error.message || "Chinnu couldn't reply. Please try again."),
  });

  const isBusy = status === "submitted" || status === "streaming";

  const focusInput = useCallback(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    focusInput();
  }, [focusInput, threadId]);

  useEffect(() => {
    if (status === "ready") focusInput();
  }, [focusInput, status]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isBusy) return;
      setInput("");
      if (!hasTitle.current) {
        hasTitle.current = true;
        const nextTitle = titleFromText(trimmed);
        onTitleChange(nextTitle);
        void renameThread(threadId, nextTitle).catch(() => undefined);
      }
      await sendMessage({ text: trimmed });
      focusInput();
    },
    [focusInput, isBusy, onTitleChange, sendMessage, threadId],
  );

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <header className="bg-brand-gradient flex items-center gap-3 px-4 pb-5 pt-8 text-primary-foreground">
        <Button asChild size="icon" variant="ghost" className="shrink-0 hover:bg-white/15">
          <Link to="/tutor" aria-label="Back to conversations">
            <ArrowLeft className="size-5" aria-hidden="true" />
          </Link>
        </Button>
        <img
          src={tutorAvatar}
          alt=""
          width={512}
          height={512}
          loading="lazy"
          className="size-10 shrink-0 rounded-full bg-white/20 object-cover"
        />
        <div className="min-w-0">
          <p className="truncate text-base font-bold">{title}</p>
          <p className="text-xs opacity-90">Chinnu · your German tutor</p>
        </div>
      </header>

      <Conversation className="mx-auto w-full max-w-md flex-1">
        <ConversationContent className="gap-5 px-4 py-5">
          {messages.length === 0 ? (
            <ConversationEmptyState
              title="Sag Hallo! 👋"
              description="Ask a question or pick a starter below."
              icon={
                <img
                  src={tutorAvatar}
                  alt="Chinnu, your AI German tutor"
                  width={512}
                  height={512}
                  loading="lazy"
                  className="size-20 rounded-full bg-secondary/20 object-cover"
                />
              }
            >
              <div className="mt-2 flex w-full flex-col gap-2">
                {TUTOR_STARTERS.map((starter) => (
                  <Button
                    key={starter}
                    variant="outline"
                    className="h-auto whitespace-normal rounded-2xl py-3 text-left text-sm"
                    onClick={() => void send(starter)}
                  >
                    {starter}
                  </Button>
                ))}
              </div>
            </ConversationEmptyState>
          ) : (
            messages.map((message) => (
              <Message key={message.id} from={message.role}>
                <MessageContent
                  className={
                    message.role === "assistant" ? "bg-transparent p-0 text-foreground" : undefined
                  }
                >
                  {message.parts.map((part, index) =>
                    part.type === "text" ? (
                      <MessageResponse key={`${message.id}-${index}`}>{part.text}</MessageResponse>
                    ) : null,
                  )}
                </MessageContent>
              </Message>
            ))
          )}

          {status === "submitted" ? (
            <Message from="assistant">
              <MessageContent className="bg-transparent p-0">
                <Shimmer>Chinnu is thinking…</Shimmer>
              </MessageContent>
            </Message>
          ) : null}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="sticky bottom-20 mx-auto w-full max-w-md px-4 pb-2">
        <PromptInput
          onSubmit={(_message, event) => {
            event.preventDefault();
            void send(input);
          }}
        >
          <PromptInputTextarea
            ref={textareaRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask Chinnu anything about German…"
          />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit status={status} disabled={!input.trim() || isBusy} />
          </PromptInputFooter>
        </PromptInput>
      </div>

      <BottomNav />
    </div>
  );
}
