import { Link } from "@tanstack/react-router";
import { GraduationCap, Home, Languages } from "lucide-react";

const NAV_ITEMS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/translate", label: "Translate", icon: Languages },
  { to: "/quiz", label: "Quiz", icon: GraduationCap },
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
  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="bg-brand-gradient px-5 pb-8 pt-10 text-primary-foreground">
        <div className="mx-auto max-w-md">
          <h1 className="text-2xl">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm opacity-90">{subtitle}</p> : null}
        </div>
      </header>
      <main className="mx-auto -mt-5 max-w-md px-5">{children}</main>
      <BottomNav />
    </div>
  );
}
