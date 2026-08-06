import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, MessageCircle, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import tutorAvatar from "@/assets/tutor-chinnu.png";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { createThread, deleteThread, listThreads, type TutorThread } from "@/lib/tutor";

export const Route = createFileRoute("/tutor/")({
  head: () => ({
    meta: [
      { title: "AI German Tutor — Chat with Chinnu | Lernexa" },
      {
        name: "description",
        content:
          "Chat with your personal AI German tutor. Ask questions, practise conversations and get gentle corrections in simple English, any time.",
      },
      { property: "og:title", content: "AI German Tutor — Chat with Chinnu | Lernexa" },
      {
        property: "og:description",
        content:
          "Your personal AI German teacher: friendly explanations, instant corrections and conversation practice saved to your account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TutorHomePage,
});

function TutorHomePage() {
  const { user, isLoading: isAuthLoading, isSignedIn } = useAuth();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<TutorThread[] | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!isSignedIn) {
      setThreads(null);
      return;
    }
    let isActive = true;
    void listThreads()
      .then((rows) => {
        if (isActive) setThreads(rows);
      })
      .catch((error: Error) => toast.error(error.message));
    return () => {
      isActive = false;
    };
  }, [isSignedIn]);

  const startChat = useCallback(async () => {
    if (!user) return;
    setIsCreating(true);
    try {
      const thread = await createThread(user.id);
      await navigate({ to: "/tutor/$threadId", params: { threadId: thread.id } });
    } catch (error) {
      toast.error((error as Error).message);
      setIsCreating(false);
    }
  }, [navigate, user]);

  async function handleDelete(threadId: string) {
    try {
      await deleteThread(threadId);
      setThreads((current) => (current ?? []).filter((item) => item.id !== threadId));
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  return (
    <AppShell title="AI Tutor" subtitle="Chinnu is here whenever you want to practise.">
      <Card className="shadow-soft rounded-3xl border-none p-5">
        <div className="flex items-center gap-4">
          <img
            src={tutorAvatar}
            alt="Chinnu, your AI German tutor"
            width={512}
            height={512}
            loading="lazy"
            className="size-16 shrink-0 rounded-2xl bg-secondary/20 object-cover"
          />
          <div>
            <h2 className="text-base font-bold">Hallo, ich bin Chinnu 👋</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ask me anything about German — grammar, phrases, or just chat with me for practice.
            </p>
          </div>
        </div>
      </Card>

      {isAuthLoading ? (
        <Card className="shadow-soft mt-3 flex items-center gap-3 rounded-3xl border-none p-6">
          <Loader2 className="size-5 animate-spin text-primary" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">Loading…</p>
        </Card>
      ) : !isSignedIn ? (
        <Card className="shadow-soft mt-3 rounded-3xl border-none p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Sign in so your tutor chats are saved to your account and follow you everywhere.
          </p>
          <Button asChild className="mt-4 w-full">
            <Link to="/auth">Sign in to chat</Link>
          </Button>
        </Card>
      ) : (
        <>
          <Button className="mt-3 w-full gap-2" onClick={startChat} disabled={isCreating}>
            {isCreating ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Plus className="size-4" aria-hidden="true" />
            )}
            New conversation
          </Button>

          <section aria-label="Your conversations" className="mt-4 space-y-3">
            {threads === null ? (
              <Card className="shadow-soft flex items-center gap-3 rounded-3xl border-none p-6">
                <Loader2 className="size-5 animate-spin text-primary" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">Loading your chats…</p>
              </Card>
            ) : threads.length === 0 ? (
              <Card className="shadow-soft rounded-3xl border-none p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No conversations yet. Start one and ask Chinnu your first question.
                </p>
              </Card>
            ) : (
              threads.map((thread) => (
                <Card
                  key={thread.id}
                  className="shadow-soft flex items-center gap-2 rounded-3xl border-none p-4"
                >
                  <Link
                    to="/tutor/$threadId"
                    params={{ threadId: thread.id }}
                    className="flex min-w-0 flex-1 items-center gap-3"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-secondary/20 text-primary">
                      <MessageCircle className="size-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold">{thread.title}</span>
                      <span className="block text-xs text-muted-foreground">
                        {new Date(thread.updated_at).toLocaleString()}
                      </span>
                    </span>
                  </Link>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Delete conversation ${thread.title}`}
                    onClick={() => handleDelete(thread.id)}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </Card>
              ))
            )}
          </section>
        </>
      )}
    </AppShell>
  );
}
