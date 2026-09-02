import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  Flame,
  Home,
  Languages,
  MessageCircle,
  MessagesSquare,
  Mic,
  SpellCheck,
  UserRound,
} from "lucide-react";

import appLogo from "@/assets/app_logo.jpeg.asset.json";
import { useProgress } from "@/hooks/use-progress";
import { useTheme } from "@/hooks/use-theme";

const NAV_ITEMS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/translate", label: "Translate", icon: Languages },
  { to: "/vocabulary", label: "Words", icon: BookOpen },
  { to: "/grammar", label: "Grammar", icon: SpellCheck },
  { to: "/speak", label: "Speak", icon: Mic },
  { to: "/conversation", label: "Talks", icon: MessagesSquare },
  { to: "/tutor", label: "Tutor", icon: MessageCircle },
] as const;

export function BottomNav() {
  return (
    <nav
      aria-label="Main navigation"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur-md"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl py-2 text-xs font-medium text-muted-foreground transition-colors"
              activeProps={{ className: "text-primary" }}
            >
              <Icon className="size-5" aria-hidden="true" />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function AppShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const { progress } = useProgress();
  useTheme();

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="bg-brand-gradient px-5 pb-8 pt-10 text-primary-foreground">
        <div className="mx-auto flex max-w-md items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl">{title}</h1>
            {subtitle ? <p className="mt-1 text-sm opacity-90">{subtitle}</p> : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              to="/progress"
              aria-label={`Streak ${progress.streak} days, ${progress.totalXp} XP total`}
              className="flex items-center gap-2 rounded-full bg-primary-foreground/15 px-3 py-2 text-sm font-semibold backdrop-blur-sm transition-transform active:scale-95"
            >
              <Flame className="size-4" aria-hidden="true" />
              {progress.streak}
              <span className="opacity-70">·</span>
              {progress.totalXp} XP
            </Link>
            <Link
              to="/account"
              aria-label="Your account"
              className="flex size-10 items-center justify-center rounded-full bg-primary-foreground/15 backdrop-blur-sm transition-transform active:scale-95"
            >
              <UserRound className="size-5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto -mt-5 max-w-md px-5">{children}</main>
      <BottomNav />
    </div>
  );
}
