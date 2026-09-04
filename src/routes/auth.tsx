import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/app-shell";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";

type AuthSearch = { redirect?: string | undefined };

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): AuthSearch => ({
    redirect: typeof search["redirect"] === "string" ? search["redirect"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — Yours Germanly" },
      {
        name: "description",
        content:
          "Create your free Yours Germanly account to save your German learning streak, XP and achievements to the cloud.",
      },
      { property: "og:title", content: "Sign in — Yours Germanly" },
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
  const [isBusy, setIsBusy] = useState(false);

  const destination = safePath(search.redirect);

  useEffect(() => {
    if (!isLoading && isSignedIn) {
      void navigate({ to: destination, replace: true });
    }
  }, [isLoading, isSignedIn, destination, navigate]);

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
      title="Welcome"
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
          {isBusy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          Continue with Google
        </Button>
      </section>

      <p className="mt-4 px-2 text-center text-xs text-muted-foreground">
        You can keep learning without an account — signing in just keeps your progress safe.
      </p>
    </AppShell>
  );
}
