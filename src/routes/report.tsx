import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Upload, Sparkles } from "lucide-react";
import { AppShell, PageHeader } from "@/components/civic/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PriorityBreakdownList,
  PriorityRing,
  SeverityBadge,
  StatusBadge,
  PrototypeTag,
} from "@/components/civic/bits";
import { useCivic } from "@/lib/civic/store";
import { CATEGORIES, departmentFor, type Category, type Report } from "@/lib/civic/types";
import {
  analyzeImage,
  analyzeText,
  computePriority,
  findRelated,
  scoreToSeverity,
  type DuplicateMatch,
} from "@/lib/civic/intelligence";

export const Route = createFileRoute("/report")({
  head: () => ({
    meta: [
      { title: "Report a Civic Issue — CivicPulse" },
      {
        name: "description",
        content:
          "Submit a civic issue with photo, description and location. CivicPulse instantly analyses, classifies and links it to related reports.",
      },
      { property: "og:title", content: "Report a Civic Issue — CivicPulse" },
      {
        property: "og:description",
        content: "Photo, description, location — CivicPulse does the analysis.",
      },
    ],
  }),
  component: ReportPage,
});

const LOCATION_PRESETS = [
  { landmark: "Main Gate Road", ward: "Ward 12", lat: 18.5213, lng: 73.8563 },
  { landmark: "Sector 7 Market", ward: "Ward 4", lat: 18.5392, lng: 73.8411 },
  { landmark: "Lake Road", ward: "Ward 9", lat: 18.5123, lng: 73.87 },
  { landmark: "Gandhi Chowk", ward: "Ward 3", lat: 18.5502, lng: 73.8204 },
  { landmark: "Green Park", ward: "Ward 7", lat: 18.5289, lng: 73.8854 },
  { landmark: "Vidya School", ward: "Ward 1", lat: 18.5902, lng: 73.8803 },
  { landmark: "Station Road", ward: "Ward 15", lat: 18.5603, lng: 73.9012 },
];

interface Result {
  report: Report;
  related: DuplicateMatch[];
  breakdown: ReturnType<typeof computePriority>;
  image: ReturnType<typeof analyzeImage> | null;
  text: ReturnType<typeof analyzeText>;
}

function ReportPage() {
  const { reports, addReport, session } = useCivic();
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category | "auto">("auto");
  const [locationIdx, setLocationIdx] = useState("0");
  const [anonymous, setAnonymous] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const demoText = "Huge pothole near the main gate. Vehicles are struggling every morning.";
  const liveHint = useMemo(
    () => (description.trim().length > 12 ? analyzeText(description) : null),
    [description],
  );

  function onFile(f: File | null) {
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (description.trim().length < 12) {
      setError("Please describe the issue in at least a few words (12+ characters).");
      return;
    }
    setError(null);
    setBusy(true);
    await new Promise((r) => setTimeout(r, 900)); // visible analysis step for the demo

    const loc = LOCATION_PRESETS[Number(locationIdx)] ?? LOCATION_PRESETS[0]!;
    const text = analyzeText(description);
    const image = file ? analyzeImage(file.name, text) : null;
    const finalCategory: Category =
      category !== "auto" ? category : (image?.category ?? text.category);

    const createdAt = new Date().toISOString();
    const related = findRelated(
      { category: finalCategory, description, lat: loc.lat, lng: loc.lng, createdAt },
      reports,
      12,
    );

    const severityScore = Math.min(
      99,
      Math.round(text.severityScore + Math.min(12, related.length * 1.5)),
    );
    const locationSensitive = /school|hospital|gate|junction|market|station|chowk/i.test(
      loc.landmark,
    );
    const breakdown = computePriority({
      severityScore,
      relatedReports: related.length + 1,
      recurrence: Math.min(5, Math.ceil((related.length + 1) / 3)),
      impact: text.impact,
      locationSensitive,
    });

    const id = `CP-${Math.floor(2000 + Math.random() * 8000)}`;
    const report: Report = {
      id,
      description: description.trim(),
      category: finalCategory,
      imageUrl: preview ?? undefined,
      landmark: loc.landmark,
      ward: loc.ward,
      lat: loc.lat + (Math.random() - 0.5) * 0.0008,
      lng: loc.lng + (Math.random() - 0.5) * 0.0008,
      severity: scoreToSeverity(severityScore),
      severityScore,
      priorityScore: breakdown.total,
      impact: text.impact,
      recurrence: related.length,
      status: "Submitted",
      department: departmentFor(finalCategory),
      reporter: anonymous ? "Anonymous" : (session?.name ?? "You"),
      anonymous,
      createdAt,
      history: [
        {
          id: `${id}-h0`,
          from: null,
          to: "Submitted",
          changedBy: anonymous ? "Anonymous citizen" : (session?.name ?? "You"),
          at: createdAt,
          note: "Report submitted and analysed by the CivicPulse intelligence engine.",
        },
      ],
      notes: [],
    };

    addReport(report);
    setResult({ report, related, breakdown, image, text });
    setBusy(false);
    toast.success(`Report ${id} submitted`, { description: "Analysis complete." });
  }

  function reset() {
    setResult(null);
    setDescription("");
    setFile(null);
    setPreview(null);
    setCategory("auto");
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Report"
        title="Report a civic issue"
        description="Your report is analysed the moment you submit it — category, severity, related reports and priority are returned instantly."
        actions={<PrototypeTag label="Demo intelligence engine (rule-based)" />}
      />

      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* Form */}
        <form
          onSubmit={submit}
          className="h-fit space-y-5 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]"
        >
          <div className="space-y-2">
            <Label htmlFor="photo">Issue photo (optional)</Label>
            <label
              htmlFor="photo"
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border bg-surface p-4 text-sm text-muted-foreground hover:border-primary"
            >
              <Upload className="size-4" aria-hidden />
              {file ? file.name : "Upload a photo of the issue"}
            </label>
            <input
              id="photo"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            />
            {preview ? (
              <img
                src={preview}
                alt="Preview of the uploaded civic issue"
                className="mt-2 h-40 w-full rounded-xl object-cover"
              />
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Complaint description</Label>
            <Textarea
              id="description"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you see, where it is and how it affects people…"
              required
            />
            <button
              type="button"
              onClick={() => setDescription(demoText)}
              className="text-xs font-medium text-primary underline-offset-2 hover:underline"
            >
              Use demo complaint
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as Category | "auto")}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto-detect</SelectItem>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Select value={locationIdx} onValueChange={setLocationIdx}>
                <SelectTrigger id="location">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOCATION_PRESETS.map((l, i) => (
                    <SelectItem key={l.landmark} value={String(i)}>
                      {l.landmark} · {l.ward}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="anon"
              checked={anonymous}
              onCheckedChange={(v) => setAnonymous(Boolean(v))}
            />
            <Label htmlFor="anon" className="font-normal">
              Report anonymously
            </Label>
          </div>

          {liveHint ? (
            <p className="flex items-start gap-2 rounded-xl bg-lavender-soft p-3 text-xs text-secondary-foreground">
              <Sparkles className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              Live signal: likely <b>{liveHint.category}</b> · severity{" "}
              <b>{liveHint.severity}</b>
              {liveHint.locationContext ? ` · context: ${liveHint.locationContext}` : ""}
            </p>
          ) : null}

          {error ? (
            <p role="alert" className="text-sm font-medium text-destructive">
              {error}
            </p>
          ) : null}

          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Analysing report…
              </>
            ) : (
              "Submit report"
            )}
          </Button>
        </form>

        {/* Result */}
        <div className="space-y-5">
          {!result ? (
            <div className="rounded-2xl border border-dashed border-border bg-surface/60 p-8">
              <h2 className="font-display text-lg font-semibold">What happens after you submit</h2>
              <ol className="mt-4 space-y-3 text-sm text-muted-foreground">
                {[
                  "Text and photo signals are analysed for category and severity.",
                  "Your report is compared against nearby reports from the last 30 days.",
                  "Matching reports are clustered into one underlying civic problem.",
                  "A transparent 0–100 priority score is generated with its factor breakdown.",
                  "The cluster appears on the authority command centre for action.",
                ].map((s, i) => (
                  <li key={s} className="flex gap-3">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-secondary text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--sev-low)]">
                      <CheckCircle2 className="size-4" aria-hidden /> Submitted successfully
                    </span>
                    <h2 className="mt-2 font-display text-2xl font-bold">{result.report.id}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {result.report.landmark} · {result.report.ward}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <StatusBadge status={result.report.status} />
                      <SeverityBadge severity={result.report.severity} />
                      <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
                        {result.report.category}
                      </span>
                    </div>
                  </div>
                  <PriorityRing score={result.report.priorityScore} size={84} />
                </div>

                <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-surface p-3">
                    <dt className="text-xs text-muted-foreground">Text analysis</dt>
                    <dd className="font-medium">
                      {result.text.category} · {result.text.confidence}% confidence
                    </dd>
                  </div>
                  <div className="rounded-xl bg-surface p-3">
                    <dt className="text-xs text-muted-foreground">Image analysis</dt>
                    <dd className="font-medium">
                      {result.image
                        ? `${result.image.category} · ${result.image.confidence}%`
                        : "No photo provided"}
                    </dd>
                  </div>
                  <div className="rounded-xl bg-surface p-3">
                    <dt className="text-xs text-muted-foreground">Impact / urgency</dt>
                    <dd className="font-medium">
                      {result.text.impact} / {result.text.urgency}
                    </dd>
                  </div>
                  <div className="rounded-xl bg-surface p-3">
                    <dt className="text-xs text-muted-foreground">Routed to</dt>
                    <dd className="font-medium">{result.report.department}</dd>
                  </div>
                </dl>
                <p className="mt-3 text-xs text-muted-foreground">
                  Analysis produced by a rule-based prototype engine (keyword NLP + geo clustering),
                  not a trained ML model.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
                <h3 className="font-display text-base font-semibold">
                  Priority breakdown — {result.breakdown.total}/100
                </h3>
                <div className="mt-4">
                  <PriorityBreakdownList breakdown={result.breakdown} />
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
                <h3 className="font-display text-base font-semibold">
                  Related reports detected ({result.related.length})
                </h3>
                {result.related.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    No similar reports nearby — this looks like a new civic issue.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {result.related.slice(0, 6).map((m) => (
                      <li
                        key={m.report.id}
                        className="rounded-xl border border-border p-3 text-sm"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <Link
                            to="/issues/$id"
                            params={{ id: m.report.id }}
                            className="font-medium text-primary hover:underline"
                          >
                            {m.report.id}
                          </Link>
                          <span className="text-xs font-semibold text-muted-foreground">
                            {Math.round(m.score * 100)}% match
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-muted-foreground">
                          {m.report.description}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {m.reasons.join(" · ")}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link to="/issues/$id" params={{ id: result.report.id }}>
                    View issue details
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/authority">Open authority dashboard</Link>
                </Button>
                <Button variant="ghost" onClick={reset}>
                  Submit another
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
