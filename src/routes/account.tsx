import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { CloudCheck, CloudOff, LogOut } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, useProfile } from "@/hooks/use-auth";
import { useProgress } from "@/hooks/use-progress";
import { supabase } from "@/integrations/supabase/client";
import { getLevel } from "@/lib/progress";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Your account — Lernexa" },
      {
        name: "description",
        content:
          "Manage your Lernexa account, update your display name and keep your German learning progress synced to the cloud.",
      },
      { property: "og:title", content: "Your account — Lernexa" },
      {
        property: "og:description",
        content: "Manage your Lernexa profile and cloud-synced German learning progress.",
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
  const { progress } = useProgress();
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

      <Button
        variant="outline"
        className="mt-4 h-12 w-full rounded-2xl"
        onClick={handleSignOut}
      >
        <LogOut className="size-4" aria-hidden="true" />
        Sign out
      </Button>
    </AppShell>
  );
}
