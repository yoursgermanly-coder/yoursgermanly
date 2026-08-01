import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";

type AuthSearch = { redirect?: string | undefined };

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): AuthSearch => ({
    redirect: typeof search['redirect'] === "string" ? search['redirect'] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — Lernexa" },
      {
        name: "description",
        content:
          "Create your free Lernexa account to save your German learning streak, XP and achievements to the cloud.",
      },
      { property: "og:title", content: "Sign in — Lernexa" },
      {
        property: "og:description",
        content: "Save your German learning progress and sync it across all your devices.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function safePath(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

function AuthPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth" });
  const { isSignedIn, isLoading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const destination = safePath(search.redirect);

  useEffect(() => {
    if (!isLoading && isSignedIn) {
      void navigate({ to: destination, replace: true });
    }
  }, [isLoading, isSignedIn, destination, navigate]);

  async function handleEmailSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: displayName || email.split("@")[0] },
          },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Almost there! Check your email to confirm your account.");
          return;
        }
        toast.success("Welcome to Lernexa! Your progress is now saved.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back! Syncing your progress…");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleGoogle() {
    setIsBusy(true);
    try {
      sessionStorage.setItem("lernexa.auth.redirect", destination);
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error("Google sign-in didn't work. Please try again.");
        return;
      }
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <AppShell
      title={mode === "signin" ? "Welcome back" : "Create your account"}
      subtitle="Save your streak, XP and achievements to the cloud."
    >
      <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
        <Button
          type="button"
          variant="outline"
          className="h-12 w-full rounded-2xl"
          onClick={handleGoogle}
          disabled={isBusy}
        >
          Continue with Google
        </Button>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          or use your email
          <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleEmailSubmit} className="space-y-4">
          {mode === "signup" ? (
            <div className="space-y-2">
              <Label htmlFor="displayName">Display name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Anna"
                autoComplete="nickname"
                className="h-12 rounded-2xl"
              />
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className="h-12 rounded-2xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 6 characters"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              className="h-12 rounded-2xl"
            />
          </div>

          <Button type="submit" className="h-12 w-full rounded-2xl" disabled={isBusy}>
            {isBusy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            {mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          {mode === "signin" ? "New to Lernexa?" : "Already have an account?"}{" "}
          <button
            type="button"
            className="font-semibold text-primary"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          >
            {mode === "signin" ? "Create an account" : "Sign in"}
          </button>
        </p>
      </section>

      <p className="mt-4 px-2 text-center text-xs text-muted-foreground">
        You can keep learning without an account — signing in just keeps your progress safe.
      </p>
    </AppShell>
  );
}
