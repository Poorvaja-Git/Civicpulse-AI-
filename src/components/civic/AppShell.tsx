import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Menu, X, Activity, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCivic } from "@/lib/civic/store";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/citizen", label: "Citizen" },
  { to: "/report", label: "Report Issue" },
  { to: "/authority", label: "Authority" },
  { to: "/hotspots", label: "Hotspots" },
  { to: "/analytics", label: "Analytics" },
] as const;

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
        <Activity className="size-5" aria-hidden />
      </span>
      <span className="font-display text-lg font-bold tracking-tight">
        Civic<span className="text-primary">Pulse</span>
      </span>
    </span>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { session, signOut } = useCivic();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" aria-label="CivicPulse home">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground",
                  pathname === n.to && "bg-secondary text-secondary-foreground",
                )}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            {session ? (
              <>
                <span className="text-sm text-muted-foreground">
                  {session.name} · <span className="capitalize">{session.role}</span>
                </span>
                <Button variant="ghost" size="sm" onClick={signOut}>
                  <LogOut className="size-4" /> Sign out
                </Button>
              </>
            ) : (
              <Button asChild variant="outline" size="sm">
                <Link to="/auth">Sign in</Link>
              </Button>
            )}
            <Button asChild size="sm">
              <Link to="/report">Report an Issue</Link>
            </Button>
          </div>

          <button
            className="grid size-10 place-items-center rounded-lg border border-border lg:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {open ? (
          <div className="border-t border-border bg-background lg:hidden">
            <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3" aria-label="Mobile">
              {NAV.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground",
                    pathname === n.to && "bg-secondary text-secondary-foreground",
                  )}
                >
                  {n.label}
                </Link>
              ))}
              <Link
                to="/auth"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground"
              >
                {session ? `Signed in as ${session.name}` : "Sign in"}
              </Link>
            </nav>
          </div>
        ) : null}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <Logo />
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              An AI-powered intelligence layer that integrates with existing civic grievance
              platforms. CivicPulse does not replace government systems — it makes their data
              actionable.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Prototype build · synthetic demo dataset · not a production civic system.
          </p>
        </div>
      </footer>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="border-b border-border bg-lavender-soft">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-end justify-between gap-4 px-4 py-8 sm:px-6 sm:py-10">
        <div>
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="mt-1.5 font-display text-2xl font-bold sm:text-3xl">{title}</h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
