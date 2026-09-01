import { createFileRoute, Link } from "@tanstack/react-router";
import { TrendingUp, MapPin } from "lucide-react";
import { AppShell, PageHeader } from "@/components/civic/AppShell";
import { MapPanel, MapLegend } from "@/components/civic/MapPanel";
import { PriorityRing, SeverityBadge, PrototypeTag, EmptyState } from "@/components/civic/bits";
import { Button } from "@/components/ui/button";
import { useCivic } from "@/lib/civic/store";

export const Route = createFileRoute("/hotspots")({
  head: () => ({
    meta: [
      { title: "Civic Hotspots — CivicPulse" },
      {
        name: "description",
        content:
          "Geographic and temporal clustering surfaces emerging civic hotspots with growth trend and priority score.",
      },
      { property: "og:title", content: "Civic Hotspots — CivicPulse" },
      {
        property: "og:description",
        content: "Where civic issues are concentrating and accelerating across the city.",
      },
    ],
  }),
  component: HotspotsPage,
});

function HotspotsPage() {
  const { hotspots, reports } = useCivic();

  const points = hotspots.map((h) => ({
    id: h.id,
    lat: h.lat,
    lng: h.lng,
    title: h.title,
    category: h.category,
    location: `${h.landmark}, ${h.ward}`,
    severity: h.severity,
    reports: h.reportIds.length,
    priority: h.priorityScore,
    status: "Hotspot",
    department: h.department,
  }));

  return (
    <AppShell>
      <PageHeader
        eyebrow="Detect"
        title="Emerging civic hotspots"
        description="Hotspots are clusters that are both large and accelerating — detected by grouping reports within a 450 m radius of the same category and comparing weekly volume."
        actions={<PrototypeTag />}
      />

      <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-10 sm:px-6">
        <section className="rounded-3xl border border-border bg-card p-4 shadow-[var(--shadow-card)] sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold">Hotspot map</h2>
            <MapLegend />
          </div>
          <MapPanel points={points} height={460} />
        </section>

        {hotspots.length === 0 ? (
          <EmptyState
            title="No hotspots detected"
            description="Hotspots appear once at least three related reports occur near each other."
          />
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {hotspots.map((h) => {
              const open = h.reportIds.filter(
                (id) => reports.find((r) => r.id === id)?.status !== "Resolved",
              ).length;
              return (
                <article
                  key={h.id}
                  className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <SeverityBadge severity={h.severity} />
                      <h3 className="mt-2 font-display text-base font-semibold">{h.title}</h3>
                      <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="size-3.5" aria-hidden /> {h.ward}
                      </p>
                    </div>
                    <PriorityRing score={h.priorityScore} />
                  </div>

                  <dl className="mt-4 grid grid-cols-3 gap-3 rounded-xl bg-surface p-3 text-center">
                    <div>
                      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Reports
                      </dt>
                      <dd className="font-display text-lg font-bold">{h.reportIds.length}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Open
                      </dt>
                      <dd className="font-display text-lg font-bold">{open}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Growth
                      </dt>
                      <dd
                        className="font-display text-lg font-bold"
                        style={{ color: h.trendPct > 0 ? "var(--sev-high)" : "var(--sev-low)" }}
                      >
                        {h.trendPct > 0 ? "+" : ""}
                        {h.trendPct}%
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-4 flex items-end gap-1" aria-hidden>
                    {h.weekly.map((w) => {
                      const max = Math.max(...h.weekly.map((x) => x.reports), 1);
                      return (
                        <div key={w.week} className="flex-1 text-center">
                          <div
                            className="mx-auto w-full rounded-t bg-primary/70"
                            style={{ height: `${8 + (w.reports / max) * 46}px` }}
                          />
                          <span className="text-[10px] text-muted-foreground">{w.week}</span>
                        </div>
                      );
                    })}
                  </div>

                  <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <TrendingUp className="size-3.5" aria-hidden /> Recommended: {h.department}
                  </p>

                  <Button asChild variant="outline" className="mt-4">
                    <Link to="/issues/$id" params={{ id: h.reportIds[0] ?? "" }}>
                      Open lead report
                    </Link>
                  </Button>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </AppShell>
  );
}
