import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { BarChart3, MapPin, Sparkles, Timer } from "lucide-react";
import { AppShell, PageHeader } from "@/components/civic/AppShell";
import { PrototypeTag, SectionHeading, StatCard } from "@/components/civic/bits";
import { useCivic } from "@/lib/civic/store";
import { weeklyBuckets } from "@/lib/civic/intelligence";
import { CATEGORIES, SEVERITIES } from "@/lib/civic/types";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Civic Analytics — CivicPulse" },
      {
        name: "description",
        content:
          "Category mix, severity distribution, ward load and weekly report trend across the CivicPulse dataset.",
      },
      { property: "og:title", content: "Civic Analytics — CivicPulse" },
      {
        property: "og:description",
        content: "Understand where civic pressure builds across categories, wards and weeks.",
      },
    ],
  }),
  component: AnalyticsPage,
});

function Bar({ label, value, max, tint }: { label: string; value: number; max: number; tint?: string | undefined }) {
  return (
    <li>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-muted-foreground">{value}</span>
      </div>
      <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${max ? (value / max) * 100 : 0}%`,
            backgroundColor: tint ?? "var(--primary)",
          }}
        />
      </div>
    </li>
  );
}

function AnalyticsPage() {
  const { reports, clusters, hotspots } = useCivic();

  const byCategory = useMemo(
    () => CATEGORIES.map((c) => ({ label: c, value: reports.filter((r) => r.category === c).length })),
    [reports],
  );
  const bySeverity = useMemo(
    () => SEVERITIES.map((s) => ({ label: s, value: reports.filter((r) => r.severity === s).length })),
    [reports],
  );
  const byWard = useMemo(() => {
    const map = new Map<string, number>();
    reports.forEach((r) => map.set(r.ward, (map.get(r.ward) ?? 0) + 1));
    return Array.from(map, ([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  }, [reports]);
  const weekly = useMemo(() => weeklyBuckets(reports), [reports]);

  const maxCat = Math.max(...byCategory.map((x) => x.value), 1);
  const maxSev = Math.max(...bySeverity.map((x) => x.value), 1);
  const maxWard = Math.max(...byWard.map((x) => x.value), 1);
  const maxWeek = Math.max(...weekly.map((x) => x.reports), 1);

  const dedupRate = reports.length
    ? Math.round(((reports.length - clusters.length) / reports.length) * 100)
    : 0;

  const sevTint: Record<string, string> = {
    Low: "var(--sev-low)",
    Moderate: "var(--sev-moderate)",
    High: "var(--sev-high)",
    Critical: "var(--sev-critical)",
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Understand"
        title="Civic analytics"
        description="How fragmented complaints collapse into a smaller set of real civic problems — and where those problems concentrate."
        actions={<PrototypeTag />}
      />

      <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-10 sm:px-6">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Raw reports" value={reports.length} icon={<BarChart3 className="size-4" />} />
          <StatCard
            label="Underlying issues"
            value={clusters.length}
            hint="After clustering"
            icon={<Sparkles className="size-4" />}
          />
          <StatCard
            label="Noise reduction"
            value={`${dedupRate}%`}
            hint="Duplicate/related collapse rate"
            icon={<Timer className="size-4" />}
          />
          <StatCard
            label="Hotspots"
            value={hotspots.length}
            tone="critical"
            icon={<MapPin className="size-4" />}
          />
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <SectionHeading title="Reports by category" />
            <ul className="space-y-3">
              {byCategory.map((c) => (
                <Bar key={c.label} label={c.label} value={c.value} max={maxCat} />
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <SectionHeading title="Severity distribution" />
            <ul className="space-y-3">
              {bySeverity.map((s) => (
                <Bar
                  key={s.label}
                  label={s.label}
                  value={s.value}
                  max={maxSev}
                  tint={sevTint[s.label]}
                />
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <SectionHeading title="Ward load" description="Where civic pressure is highest." />
            <ul className="space-y-3">
              {byWard.map((w) => (
                <Bar key={w.label} label={w.label} value={w.value} max={maxWard} />
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <SectionHeading title="Weekly trend" description="Last four weeks of report volume." />
            <div className="flex h-48 items-end gap-3">
              {weekly.map((w) => (
                <div key={w.week} className="flex-1 text-center">
                  <div
                    className="mx-auto w-full rounded-t-lg bg-primary/75 transition-all duration-700"
                    style={{ height: `${12 + (w.reports / maxWeek) * 150}px` }}
                  />
                  <span className="mt-1 block text-xs text-muted-foreground">{w.week}</span>
                  <span className="text-xs font-semibold">{w.reports}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <p className="text-xs text-muted-foreground">
          All figures are computed live from the synthetic prototype dataset using the transparent
          rule-based intelligence engine — no trained model is involved.
        </p>
      </div>
    </AppShell>
  );
}
