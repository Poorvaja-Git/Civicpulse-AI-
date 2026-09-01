import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, Layers, ListChecks, Siren } from "lucide-react";
import { AppShell, PageHeader } from "@/components/civic/AppShell";
import { MapPanel, MapLegend } from "@/components/civic/MapPanel";
import {
  EmptyState,
  PriorityRing,
  PrototypeTag,
  SeverityBadge,
  StatCard,
  StatusBadge,
} from "@/components/civic/bits";
import { Button } from "@/components/ui/button";
import { useCivic } from "@/lib/civic/store";
import { CATEGORIES, STATUS_FLOW, type Category, type Status } from "@/lib/civic/types";

export const Route = createFileRoute("/authority")({
  head: () => ({
    meta: [
      { title: "Authority Command Centre — CivicPulse" },
      {
        name: "description",
        content:
          "Prioritised civic workload for city authorities: clustered issues, hotspot signals and one-click status progression.",
      },
      { property: "og:title", content: "Authority Command Centre — CivicPulse" },
      {
        property: "og:description",
        content: "Act on the highest-priority civic problems instead of triaging raw complaints.",
      },
    ],
  }),
  component: AuthorityPage,
});

function AuthorityPage() {
  const { reports, clusters, hotspots, updateStatus, resetDemo } = useCivic();
  const [category, setCategory] = useState<Category | "All">("All");
  const [status, setStatus] = useState<Status | "All">("All");

  const queue = useMemo(
    () =>
      reports
        .filter((r) => (category === "All" ? true : r.category === category))
        .filter((r) => (status === "All" ? true : r.status === status))
        .sort((a, b) => b.priorityScore - a.priorityScore),
    [reports, category, status],
  );

  const open = reports.filter((r) => r.status !== "Resolved").length;
  const critical = reports.filter((r) => r.severity === "Critical").length;

  function advance(id: string, current: Status) {
    const next = STATUS_FLOW[Math.min(STATUS_FLOW.length - 1, STATUS_FLOW.indexOf(current) + 1)];
    if (next && next !== current) updateStatus(id, next, "Advanced from the authority queue.");
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Act"
        title="Authority command centre"
        description="Reports are clustered into underlying civic problems and ranked by an explainable priority score, so limited crews go where impact is highest."
        actions={
          <>
            <PrototypeTag />
            <Button variant="outline" size="sm" onClick={resetDemo}>
              Reset demo data
            </Button>
          </>
        }
      />

      <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-10 sm:px-6">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total reports" value={reports.length} icon={<ListChecks className="size-4" />} />
          <StatCard label="Open issues" value={open} icon={<Layers className="size-4" />} />
          <StatCard
            label="Critical severity"
            value={critical}
            tone="critical"
            icon={<AlertTriangle className="size-4" />}
          />
          <StatCard
            label="Active hotspots"
            value={hotspots.length}
            hint="Large and accelerating clusters"
            icon={<Siren className="size-4" />}
          />
        </section>

        <section className="rounded-3xl border border-border bg-card p-4 shadow-[var(--shadow-card)] sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold">City-wide issue map</h2>
            <MapLegend />
          </div>
          <MapPanel
            points={clusters.map((c) => ({
              id: c.id,
              lat: c.lat,
              lng: c.lng,
              title: c.title,
              category: c.category,
              location: `${c.landmark}, ${c.ward}`,
              severity: c.severity,
              reports: c.reportIds.length,
              priority: c.priorityScore,
              status: "Clustered issue",
              department: c.department,
            }))}
            height={440}
          />
        </section>

        <section>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <h2 className="font-display text-lg font-semibold">Priority work queue</h2>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category | "All")}
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
              aria-label="Filter by category"
            >
              <option value="All">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Status | "All")}
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
              aria-label="Filter by status"
            >
              <option value="All">All statuses</option>
              {STATUS_FLOW.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {queue.length === 0 ? (
            <EmptyState
              title="Nothing matches these filters"
              description="Try widening the category or status filter to see the rest of the queue."
            />
          ) : (
            <ul className="space-y-3">
              {queue.slice(0, 30).map((r) => (
                <li
                  key={r.id}
                  className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]"
                >
                  <PriorityRing score={r.priorityScore} size={62} />
                  <div className="min-w-[220px] flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <SeverityBadge severity={r.severity} />
                      <StatusBadge status={r.status} />
                      <span className="text-xs text-muted-foreground">{r.id}</span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm font-medium">{r.description}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {r.category} · {r.landmark}, {r.ward} · {r.department}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link to="/issues/$id" params={{ id: r.id }}>
                        Details
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      disabled={r.status === "Resolved"}
                      onClick={() => advance(r.id, r.status)}
                    >
                      {r.status === "Resolved" ? "Resolved" : "Advance status"}
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
