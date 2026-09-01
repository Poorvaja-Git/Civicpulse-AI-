import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Layers,
  Brain,
  ListOrdered,
  ArrowRight,
  MapPinned,
  Gauge,
  ShieldCheck,
  Clock,
} from "lucide-react";
import heroImg from "@/assets/civic-hero.jpg";
import { AppShell } from "@/components/civic/AppShell";
import { Button } from "@/components/ui/button";
import { PrototypeTag } from "@/components/civic/bits";
import { useCivic } from "@/lib/civic/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CivicPulse — From Civic Complaints to Civic Intelligence" },
      {
        name: "description",
        content:
          "CivicPulse is an AI-powered civic intelligence layer that unifies, clusters and prioritises citizen reports so authorities act on real problems, not ticket counts.",
      },
      { property: "og:title", content: "CivicPulse — Civic Intelligence Platform" },
      {
        property: "og:description",
        content:
          "Unify, understand and prioritise civic complaints with clustering, hotspot detection and transparent priority scoring.",
      },
    ],
  }),
  component: Landing,
});

const USP = [
  {
    icon: Layers,
    title: "UNIFY",
    text: "Connect fragmented civic signals from complaint portals, helplines and field reports into one stream.",
  },
  {
    icon: Brain,
    title: "UNDERSTAND",
    text: "Cluster duplicate and related reports into the single underlying problem they describe.",
  },
  {
    icon: ListOrdered,
    title: "PRIORITIZE",
    text: "Rank issues by severity, public impact, recurrence and location sensitivity — with a visible breakdown.",
  },
];

const STEPS = [
  ["Report", "Citizens submit an issue with photo, description and location."],
  ["Analyze", "Text and image signals produce category, severity and impact."],
  ["Cluster", "Related and duplicate reports are grouped by geography and meaning."],
  ["Detect", "Growing clusters are flagged as emerging civic hotspots."],
  ["Prioritize", "A transparent 0–100 score ranks what the city should fix first."],
  ["Act", "Authorities assign a department and move the issue to resolved."],
];

const BENEFITS = [
  [MapPinned, "One map, one truth", "Every ward's civic load visible in a single command centre."],
  [Gauge, "Explainable priority", "No black box — each point of the score is traceable."],
  [Clock, "Earlier intervention", "Hotspots surface while they are still growing."],
  [ShieldCheck, "Works alongside existing systems", "An intelligence layer, not a replacement."],
] as const;

function Landing() {
  const { reports, clusters, hotspots } = useCivic();

  return (
    <AppShell>
      {/* Hero */}
      <section className="surface-grid border-b border-border bg-lavender-soft">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-20">
          <div>
            <PrototypeTag label="Hackathon prototype · synthetic dataset" />
            <h1 className="mt-4 font-display text-4xl font-extrabold leading-[1.08] sm:text-5xl">
              From Civic Complaints to{" "}
              <span className="text-primary">Civic Intelligence</span>
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
              Cities do not lack complaints — they lack clarity. CivicPulse reads every citizen
              report, groups the ones describing the same problem, detects where issues are
              concentrating, and ranks them so limited civic resources go where they matter most.
            </p>
            <p className="mt-4 max-w-xl rounded-xl border border-border bg-card/70 p-4 font-display text-base font-semibold">
              “We don't just count complaints. We discover the problems behind them.”
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/report">
                  Report an Issue <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/authority">Authority Dashboard</Link>
              </Button>
            </div>
            <dl className="mt-9 grid max-w-lg grid-cols-3 gap-4">
              {[
                ["Reports", reports.length],
                ["Clusters", clusters.length],
                ["Hotspots", hotspots.length],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-xl border border-border bg-card p-4">
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="font-display text-2xl font-bold">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="relative">
            <img
              src={heroImg}
              alt="Illustration of a smart city skyline with civic data points and map pins"
              width={1280}
              height={960}
              className="w-full rounded-3xl border border-border bg-card shadow-[var(--shadow-lift)]"
            />
          </div>
        </div>
      </section>

      {/* USP */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-5 md:grid-cols-3">
          {USP.map(({ icon: Icon, title, text }) => (
            <article
              key={title}
              className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-lift)]"
            >
              <span className="grid size-11 place-items-center rounded-xl bg-secondary text-primary">
                <Icon className="size-5" aria-hidden />
              </span>
              <h2 className="mt-4 font-display text-sm font-bold tracking-[0.16em] text-primary">
                {title}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">{text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Pipeline */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
          <h2 className="font-display text-2xl font-bold">How CivicPulse works</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            One pipeline turns scattered citizen signals into a single ranked civic action list.
          </p>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {STEPS.map(([title, text], i) => (
              <li key={title} className="rounded-2xl border border-border bg-card p-5">
                <span className="font-display text-xs font-bold text-primary">
                  STEP {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-1 font-display text-lg font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Benefits */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="font-display text-2xl font-bold">Key benefits</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map(([Icon, title, text]) => (
            <article key={title} className="rounded-2xl border border-border bg-card p-6">
              <Icon className="size-5 text-primary" aria-hidden />
              <h3 className="mt-3 font-display text-base font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Positioning */}
      <section className="border-t border-border bg-lavender-soft">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-start gap-6 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl font-bold">
              An intelligence layer, not a replacement
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Existing government platforms already collect and manage complaints well. CivicPulse
              sits on top of them and adds what they were never built to do: unify, analyse,
              cluster, detect and prioritise.
            </p>
          </div>
          <Button asChild size="lg">
            <Link to="/authority">See the command centre</Link>
          </Button>
        </div>
      </section>
    </AppShell>
  );
}
