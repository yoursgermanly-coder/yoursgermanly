import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  CloudCheck,
  CloudOff,
  LineChart,
  LogOut,
  Moon,
  Shield,
  Sun,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, useProfile } from "@/hooks/use-auth";
import { useProgress } from "@/hooks/use-progress";
import { supabase } from "@/integrations/supabase/client";
import { DAILY_GOAL_OPTIONS, getLevel } from "@/lib/progress";
import { useTheme } from "@/hooks/use-theme";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Your account — Yours Germanly" },
      {
        name: "description",
        content:
          "Manage your Yours Germanly account, update your display name and keep your German learning progress synced to the cloud.",
      },
      { property: "og:title", content: "Your account — Yours Germanly" },
      {
        property: "og:description",
        content: "Manage your Yours Germanly profile and cloud-synced German learning progress.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { user, isSignedIn, isLoading, signOut } = useAuth();
  const profile = useProfile(user?.id);
  const { progress, setDailyGoal } = useProgress();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile?.display_name) setDisplayName(profile.display_name);
  }, [profile?.display_name]);

  const level = getLevel(progress.totalXp);

  async function handleSaveProfile(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;
    setIsSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName.trim() || null })
      .eq("id", user.id);
    setIsSaving(false);
    if (error) {
      toast.error("We couldn't save that just now. Please try again.");
      return;
    }
    toast.success("Profile updated. Looking good!");
  }

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOut();
    void navigate({ to: "/", replace: true });
    toast.success("Signed out. Your progress is safe in the cloud.");
  }

  if (!isLoading && !isSignedIn) {
    return (
      <AppShell title="Your account" subtitle="Sync your progress across devices.">
        <section className="rounded-3xl border border-border bg-card p-6 text-center shadow-sm">
          <CloudOff className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
          <h2 className="mt-3 text-lg font-semibold">You're learning offline</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your streak and XP live on this device only. Create a free account to back them up and
            pick up where you left off anywhere.
          </p>
          <Button asChild className="mt-5 h-12 w-full rounded-2xl">
            <Link to="/auth" search={{ redirect: "/account" }}>
              Sign in or create account
            </Link>
          </Button>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell title="Your account" subtitle="Your progress is backed up automatically.">
      <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-brand-gradient text-lg font-bold text-primary-foreground">
            {(displayName || user?.email || "?").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold">{displayName || "Learner"}</p>
            <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-secondary/15 px-3 py-2 text-sm text-foreground">
          <CloudCheck className="size-4 text-secondary" aria-hidden="true" />
          Synced · Level {level.level} {level.title} · {progress.totalXp} XP
        </div>

        <form onSubmit={handleSaveProfile} className="mt-5 space-y-3">
          <Label htmlFor="account-name">Display name</Label>
          <Input
            id="account-name"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Anna"
            className="h-12 rounded-2xl"
          />
          <Button type="submit" className="h-12 w-full rounded-2xl" disabled={isSaving}>
            {isSaving ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </section>

      <section className="mt-4 rounded-3xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-base font-bold">Settings</h2>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Appearance</p>
            <p className="text-sm text-muted-foreground">Switch between light and dark.</p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-2xl"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? (
              <>
                <Sun className="size-4" aria-hidden="true" /> Light
              </>
            ) : (
              <>
                <Moon className="size-4" aria-hidden="true" /> Dark
              </>
            )}
          </Button>
        </div>

        <div className="mt-5">
          <p className="text-sm font-semibold">Daily XP goal</p>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {DAILY_GOAL_OPTIONS.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={progress.dailyGoal === value}
                onClick={() => {
                  setDailyGoal(value);
                  toast.success(`Daily goal set to ${value} XP.`);
                }}
                className={`h-11 rounded-2xl border border-border text-sm font-semibold transition-colors ${
                  progress.dailyGoal === value
                    ? "border-transparent bg-primary text-primary-foreground"
                    : "bg-card"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        <Button asChild variant="outline" className="mt-5 h-12 w-full rounded-2xl">
          <Link to="/insights">
            <LineChart className="size-4" aria-hidden="true" /> View learning insights
          </Link>
        </Button>
      </section>

      <Button variant="outline" className="mt-4 h-12 w-full rounded-2xl" onClick={handleSignOut}>
        <LogOut className="size-4" aria-hidden="true" />
        Sign out
      </Button>
    </AppShell>
  );
}
