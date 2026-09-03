import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield, ChevronLeft } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Yours Germanly" },
      {
        name: "description",
        content:
          "Learn how Yours Germanly collects, uses, and protects your personal data, AI usage, and leaderboard information.",
      },
      { property: "og:title", content: "Privacy Policy — Yours Germanly" },
      {
        property: "og:description",
        content:
          "How Yours Germanly handles your data, AI processing, and leaderboard scores.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <AppShell title="Privacy Policy" subtitle="How we keep your learning data safe.">
      <Card className="shadow-soft rounded-3xl border-none p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-secondary/25 text-primary">
            <Shield className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-bold">Your data belongs to you</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Yours Germanly is designed to help you learn German. We only collect the data we
              need to make that experience personal, synced, and fun.
            </p>
          </div>
        </div>
      </Card>

      <section className="mt-5 space-y-5">
        <PolicySection title="What we collect">
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Account information:</strong> your email,
              display name, and optional avatar when you sign up or sign in.
            </li>
            <li>
              <strong className="text-foreground">Learning progress:</strong> XP, streaks, daily
              goals, quiz results, completed lessons, vocabulary reviews, and achievement unlocks.
            </li>
            <li>
              <strong className="text-foreground">Translations and tutor chats:</strong> text you
              translate and messages you send to Chinnu, the AI tutor, so we can show history and
              improve replies.
            </li>
            <li>
              <strong className="text-foreground">Voice recordings:</strong> short audio clips you
              record for pronunciation practice. These are sent to our speech-to-text provider and
              are not stored permanently.
            </li>
            <li>
              <strong className="text-foreground">Device preferences:</strong> light/dark theme
              and daily XP goal, kept locally on your device for speed.
            </li>
          </ul>
        </PolicySection>

        <PolicySection title="How we use AI (OpenAI / Lovable AI Gateway)">
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            <li>
              AI features — translation, quizzes, grammar lessons, vocabulary packs, tutor replies,
              speaking feedback, and study plans — are processed through server-side AI services.
            </li>
            <li>
              Your OpenAI API key, if provided, is stored securely as a server secret and is never
              exposed to the browser or other users.
            </li>
            <li>
              The default AI provider is the Lovable AI Gateway. We do not train AI models on your
              personal data.
            </li>
            <li>
              Voice recordings are converted to text by an AI transcription service and then
              discarded.
            </li>
          </ul>
        </PolicySection>

        <PolicySection title="Leaderboard scores">
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            <li>
              The leaderboard shows your <strong className="text-foreground">display name</strong>
              , <strong className="text-foreground">avatar</strong>,{" "}
              <strong className="text-foreground">total XP</strong>, and{" "}
              <strong className="text-foreground">current streak</strong> to other signed-in
              learners.
            </li>
            <li>
              Your email address and detailed learning history are never shown on the leaderboard.
            </li>
            <li>
              Only users with a positive XP total appear on the board. You can update your display
              name anytime in account settings.
            </li>
          </ul>
        </PolicySection>

        <PolicySection title="Data storage and security">
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            <li>
              Your account and progress data are stored in Lovable Cloud (powered by Supabase) with
              industry-standard encryption and Row-Level Security policies.
            </li>
            <li>
              We use secure, authenticated server functions for any operation that reads or writes
              shared data.
            </li>
            <li>
              Local progress on your device is backed up to the cloud automatically when you are
              signed in and online.
            </li>
          </ul>
        </PolicySection>

        <PolicySection title="Your rights">
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            <li>
              You can update your display name, daily goal, and theme in{" "}
              <Link to="/account" className="font-semibold text-primary underline">
                account settings
              </Link>
              .
            </li>
            <li>
              You can sign out or delete your account at any time. Deleting your account removes
              your profile and cloud progress permanently.
            </li>
            <li>
              If you have questions about your data, contact us through the app or at the support
              email shown in your account settings.
            </li>
          </ul>
        </PolicySection>

        <PolicySection title="Changes to this policy">
          <p className="text-sm text-muted-foreground">
            We may update this Privacy Policy as the app grows. The latest version will always be
            available at this page, and we will notify you of any significant changes.
          </p>
        </PolicySection>
      </section>

      <div className="mt-8 text-center">
        <Link
          to="/account"
          className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-transform active:scale-95"
        >
          <ChevronLeft className="size-4" aria-hidden="true" /> Back to account
        </Link>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Last updated: 3 September 2026
      </p>
    </AppShell>
  );
}

function PolicySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="shadow-soft rounded-3xl border-none p-5">
      <h3 className="text-base font-bold">{title}</h3>
      <div className="mt-3">{children}</div>
    </Card>
  );
}
