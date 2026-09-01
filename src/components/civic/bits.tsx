import { cn } from "@/lib/utils";
import type { Severity, Status } from "@/lib/civic/types";
import type { PriorityBreakdown } from "@/lib/civic/intelligence";
import type { ReactNode } from "react";

export const severityColor: Record<Severity, string> = {
  Low: "var(--sev-low)",
  Moderate: "var(--sev-moderate)",
  High: "var(--sev-high)",
  Critical: "var(--sev-critical)",
};

export function SeverityBadge({ severity, className }: { severity: Severity; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        className,
      )}
      style={{
        color: severityColor[severity],
        backgroundColor: `color-mix(in oklab, ${severityColor[severity]} 14%, transparent)`,
      }}
    >
      <span
        className="size-1.5 rounded-full"
        style={{ backgroundColor: severityColor[severity] }}
        aria-hidden
      />
      {severity}
    </span>
  );
}

const statusStyles: Record<Status, string> = {
  Submitted: "bg-muted text-muted-foreground",
  Verified: "bg-accent text-accent-foreground",
  Assigned: "bg-secondary text-secondary-foreground",
  "In Progress": "bg-primary/12 text-primary",
  Resolved: "bg-[color-mix(in_oklab,var(--sev-low)_16%,transparent)] text-[var(--sev-low)]",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        statusStyles[status],
      )}
    >
      {status}
    </span>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  tone?: "default" | "critical" | "success";
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {icon ? (
          <span
            className="grid size-9 place-items-center rounded-xl bg-secondary text-primary"
            aria-hidden
          >
            {icon}
          </span>
        ) : null}
      </div>
      <p
        className="mt-3 font-display text-3xl font-bold"
        style={
          tone === "critical"
            ? { color: "var(--sev-critical)" }
            : tone === "success"
              ? { color: "var(--sev-low)" }
              : undefined
        }
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function PriorityRing({ score, size = 72 }: { score: number; size?: number }) {
  const r = size / 2 - 6;
  const c = 2 * Math.PI * r;
  const tone =
    score >= 82
      ? "var(--sev-critical)"
      : score >= 65
        ? "var(--sev-high)"
        : score >= 45
          ? "var(--sev-moderate)"
          : "var(--sev-low)";
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--muted)" strokeWidth="6" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * score) / 100}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="font-display text-lg font-bold">{score}</span>
      </div>
      <span className="sr-only">Priority score {score} out of 100</span>
    </div>
  );
}

export function PriorityBreakdownList({ breakdown }: { breakdown: PriorityBreakdown }) {
  return (
    <ul className="space-y-3">
      {breakdown.factors.map((f) => (
        <li key={f.label}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="font-medium">{f.label}</span>
            <span className="tabular-nums text-muted-foreground">
              {f.value}/{f.max}
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700"
              style={{ width: `${(f.value / f.max) * 100}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{f.detail}</p>
        </li>
      ))}
    </ul>
  );
}

export function SectionHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface/60 p-10 text-center">
      <p className="font-display font-semibold">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function PrototypeTag({ label = "Prototype dataset" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-lavender-soft px-2.5 py-1 text-[11px] font-semibold text-secondary-foreground">
      <span className="size-1.5 rounded-full bg-lavender" aria-hidden />
      {label}
    </span>
  );
}
