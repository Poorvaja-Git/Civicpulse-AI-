import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, MapPin } from "lucide-react";
import { AppShell, PageHeader } from "@/components/civic/AppShell";
import { MapPanel } from "@/components/civic/MapPanel";
import {
  EmptyState,
  PriorityBreakdownList,
  PriorityRing,
  PrototypeTag,
  SectionHeading,
  SeverityBadge,
  StatusBadge,
} from "@/components/civic/bits";
import { Button } from "@/components/ui/button";
import { useCivic } from "@/lib/civic/store";
import { computePriority, findRelated } from "@/lib/civic/intelligence";
import { STATUS_FLOW, type Status } from "@/lib/civic/types";

export const Route = createFileRoute("/issues/$id")({
  head: () => ({
    meta: [
      { title: "Issue Details — CivicPulse" },
      {
        name: "description",
        content:
          "Full civic issue record: classification, related reports, explainable priority breakdown and status timeline.",
      },
      { property: "og:title", content: "Issue Details — CivicPulse" },
      {
        property: "og:description",
        content: "See exactly why a civic issue received its priority score.",
      },
    ],
  }),
  component: IssueDetailPage,
});

function IssueDetailPage() {
  const { id } = useParams({ from: "/issues/$id" });
  const { reports, session, updateStatus, addNote, assignDepartment } = useCivic();
  const [note, setNote] = useState("");

  const report = reports.find((r) => r.id === id);
  const isAuthority = session?.role === "authority" || session?.role === "admin";

  if (!report) {
    return (
      <AppShell>
        <PageHeader eyebrow="Issue" title="Issue not found" />
        <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
          <EmptyState
            title={`No report matches ${id}`}
            description="The report may have been removed, or the demo dataset was reset."
          />
          <div className="mt-6 text-center">
            <Button asChild variant="outline">
              <Link to="/authority">
                <ArrowLeft className="size-4" /> Back to command centre
              </Link>
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  const related = findRelated(
    {
      category: report.category,
      description: report.description,
      lat: report.lat,
      lng: report.lng,
      createdAt: report.createdAt,
    },
    reports.filter((r) => r.id !== report.id),
    12,
  );

  const breakdown = computePriority({
    severityScore: report.severityScore,
    relatedReports: related.length + 1,
    recurrence: report.recurrence,
    impact: report.impact,
    locationSensitive: /school|hospital|gate|junction|market|station|chowk/i.test(report.landmark),
  });

  const nextStatus: Status | undefined =
    STATUS_FLOW[Math.min(STATUS_FLOW.length - 1, STATUS_FLOW.indexOf(report.status) + 1)];

  return (
    <AppShell>
      <PageHeader
        eyebrow={`Issue ${report.id}`}
        title={report.description.slice(0, 80)}
        description={`${report.category} · ${report.landmark}, ${report.ward} · reported by ${report.reporter}`}
        actions={<PrototypeTag label="Transparent scoring" />}
      />

      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="flex flex-wrap items-center gap-2">
              <SeverityBadge severity={report.severity} />
              <StatusBadge status={report.status} />
              <span className="text-xs text-muted-foreground">
                Filed {new Date(report.createdAt).toLocaleString()}
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed">{report.description}</p>
            {report.imageUrl ? (
              <img
                src={report.imageUrl}
                alt={`Civic issue reported at ${report.landmark}`}
                loading="lazy"
                className="mt-4 max-h-72 w-full rounded-xl object-cover"
              />
            ) : null}
            <p className="mt-4 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-4" aria-hidden /> {report.landmark}, {report.ward} · assigned
              to {report.department}
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <SectionHeading
              title="Related reports"
              description="Duplicate and nearby reports that describe the same underlying civic problem."
            />
            {related.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No related reports detected within the matching window.
              </p>
            ) : (
              <ul className="space-y-2">
                {related.slice(0, 8).map((m) => {
                  const r = reports.find((x) => x.id === m.report.id);
                  if (!r) return null;
                  return (
                    <li
                      key={r.id}
                      className="flex flex-wrap items-center gap-3 rounded-xl bg-surface p-3"
                    >
                      <span className="text-xs font-semibold text-primary">
                        {Math.round(m.score * 100)}% match
                      </span>
                      <span className="min-w-[180px] flex-1 truncate text-sm">{r.description}</span>
                      <Link
                        to="/issues/$id"
                        params={{ id: r.id }}
                        className="text-xs font-semibold text-primary underline-offset-2 hover:underline"
                      >
                        Open {r.id}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <SectionHeading title="Status timeline" />
            <ol className="space-y-4">
              {report.history.map((h) => (
                <li key={h.id} className="flex gap-3">
                  <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-primary" aria-hidden />
                  <div>
                    <p className="text-sm font-medium">
                      {h.from ? `${h.from} → ${h.to}` : h.to}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {h.changedBy} · {new Date(h.at).toLocaleString()}
                    </p>
                    {h.note ? <p className="mt-1 text-xs text-muted-foreground">{h.note}</p> : null}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {report.notes.length ? (
            <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
              <SectionHeading title="Internal notes" />
              <ul className="space-y-3">
                {report.notes.map((n) => (
                  <li key={n.id} className="rounded-xl bg-surface p-3">
                    <p className="text-sm">{n.text}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {n.author} · {new Date(n.at).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-4">
              <PriorityRing score={report.priorityScore} size={84} />
              <div>
                <p className="font-display text-base font-semibold">Priority score</p>
                <p className="text-xs text-muted-foreground">
                  Rule-based and fully explainable — every point is attributable.
                </p>
              </div>
            </div>
            <div className="mt-5">
              <PriorityBreakdownList breakdown={breakdown} />
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
            <SectionHeading title="Location" />
            <MapPanel
              points={[
                {
                  id: report.id,
                  lat: report.lat,
                  lng: report.lng,
                  title: report.description.slice(0, 50),
                  category: report.category,
                  location: `${report.landmark}, ${report.ward}`,
                  severity: report.severity,
                  reports: related.length + 1,
                  priority: report.priorityScore,
                  status: report.status,
                  department: report.department,
                },
              ]}
              height={240}
              center={[report.lat, report.lng]}
              zoom={15}
            />
          </section>

          {isAuthority ? (
            <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
              <SectionHeading title="Authority actions" />
              <div className="space-y-3">
                <Button
                  className="w-full"
                  disabled={report.status === "Resolved"}
                  onClick={() =>
                    nextStatus &&
                    nextStatus !== report.status &&
                    updateStatus(report.id, nextStatus, "Updated from issue details.")
                  }
                >
                  {report.status === "Resolved" ? "Resolved" : `Move to ${nextStatus}`}
                </Button>

                <input
                  value={report.department}
                  onChange={(e) => assignDepartment(report.id, e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  aria-label="Assigned department"
                />

                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add an internal note…"
                  rows={3}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={note.trim().length < 3}
                  onClick={() => {
                    addNote(report.id, note.trim());
                    setNote("");
                  }}
                >
                  Save note
                </Button>
              </div>
            </section>
          ) : (
            <p className="rounded-2xl border border-dashed border-border bg-surface/60 p-4 text-xs text-muted-foreground">
              Sign in with an authority or admin role to update status, reassign the department and
              add internal notes.
            </p>
          )}
        </aside>
      </div>
    </AppShell>
  );
}
