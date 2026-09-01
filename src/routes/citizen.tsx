import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { FileText, CheckCircle2, Clock, Layers } from "lucide-react";
import { AppShell, PageHeader } from "@/components/civic/AppShell";
import { MapPanel, MapLegend } from "@/components/civic/MapPanel";
import {
  EmptyState,
  PrototypeTag,
  SeverityBadge,
  StatCard,
  StatusBadge,
} from "@/components/civic/bits";
import { Button } from "@/components/ui/button";
import { useCivic } from "@/lib/civic/store";
import type { Status } from "@/lib/civic/types";

export const Route = createFileRoute("/citizen")({
  head: () => ({
    meta: [
      { title: "Citizen Dashboard — CivicPulse" },
      {
        name: "description",
        content:
          "Track your civic reports, their status journey, severity and the wider issue they belong to.",
      },
      { property: "og:title", content: "Citizen Dashboard — CivicPulse" },
      {
        property: "og:description",
        content: "Follow every report you filed from submission through to resolution.",
      },
    ],
  }),
  component: CitizenPage,
});

const FILTERS: (Status | "All")[] = [
  "All",
  "Submitted",
  "Verified",
  "Assigned",
  "In Progress",
  "Resolved",
];

function CitizenPage() {
  const { reports, session } = useCivic();
  const [filter, setFilter] = useState<Status | "All">("All");

  const mine = useMemo(() => {
    if (!session) return reports.slice(0, 12);
    return reports.filter(
      (r) => r.reporter === session.name || r.reporter === "You" || r.reporter === "Anonymous",
    );
  }, [reports, session]);

  const visible = filter === "All" ? mine : mine.filter((r) => r.status === filter);
  const resolved = mine.filter((r) => r.status === "Resolved").length;
  const inFlight = mine.filter((r) => r.status !== "Resolved").length;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Citizen"
        title={session ? `Welcome, ${session.name}` : "Citizen dashboard"}
        description="Every report you file is analysed, matched against nearby reports and given a transparent priority score."
        actions={
          <>
            <PrototypeTag />
            <Button asChild size="sm">
              <Link to="/report">Report an issue</Link>
            </Button>
          </>
        }
      />

      <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-10 sm:px-6">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Reports filed" value={mine.length} icon={<FileText className="size-4" />} />
          <StatCard label="Open" value={inFlight} icon={<Clock className="size-4" />} />
          <StatCard
            label="Resolved"
            value={resolved}
            tone="success"
            icon={<CheckCircle2 className="size-4" />}
          />
          <StatCard
            label="Avg. priority"
            value={
              mine.length
                ? Math.round(mine.reduce((s, r) => s + r.priorityScore, 0) / mine.length)
                : 0
            }
            hint="Explainable 0–100 score"
            icon={<Layers className="size-4" />}
          />
        </section>

        <section className="rounded-3xl border border-border bg-card p-4 shadow-[var(--shadow-card)] sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold">Your reports on the map</h2>
            <MapLegend />
          </div>
          <MapPanel
            points={mine.map((r) => ({
              id: r.id,
              lat: r.lat,
              lng: r.lng,
              title: r.description.slice(0, 60),
              category: r.category,
              location: `${r.landmark}, ${r.ward}`,
              severity: r.severity,
              reports: 1 + r.recurrence,
              priority: r.priorityScore,
              status: r.status,
              department: r.department,
            }))}
            height={380}
          />
        </section>

        <section>
          <div className="mb-4 flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  filter === f
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:bg-secondary"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <EmptyState
              title="No reports here yet"
              description="File your first civic report and CivicPulse will classify, cluster and prioritise it."
            />
          ) : (
            <ul className="grid gap-4 md:grid-cols-2">
              {visible.map((r) => (
                <li
                  key={r.id}
                  className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <SeverityBadge severity={r.severity} />
                    <StatusBadge status={r.status} />
                    <span className="ml-auto text-xs text-muted-foreground">{r.id}</span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm font-medium">{r.description}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {r.category} · {r.landmark}, {r.ward} ·{" "}
                    {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Priority <b className="text-foreground">{r.priorityScore}</b>/100
                    </span>
                    <Button asChild variant="outline" size="sm">
                      <Link to="/issues/$id" params={{ id: r.id }}>
                        View details
                      </Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}
