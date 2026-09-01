/**
 * CivicPulse Intelligence Engine — PROTOTYPE IMPLEMENTATION
 *
 * This is a transparent, deterministic rule-based engine (keyword NLP +
 * geo/temporal clustering + weighted priority scoring). It is NOT a trained
 * machine-learning model. Every function below is a pluggable seam: swap the
 * body for a real model/API call without touching the UI layer.
 */
import type { Category, Cluster, Impact, Report, Severity } from "./types";
import { departmentFor } from "./types";

const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  Pothole: ["pothole", "pot hole", "crater", "hole in the road", "sunken"],
  "Road Damage": ["road damage", "cracked road", "broken road", "damaged road", "tar", "asphalt"],
  Garbage: ["garbage", "trash", "waste", "dump", "litter", "rubbish", "stink", "smell"],
  Waterlogging: ["waterlog", "water logging", "flood", "knee deep", "stagnant water", "rain water"],
  Drainage: ["drain", "sewage", "manhole", "gutter", "overflow", "clogged"],
  Streetlight: ["streetlight", "street light", "lamp", "dark", "lighting", "pole"],
  Other: [],
};

const HIGH_URGENCY = [
  "accident",
  "danger",
  "dangerous",
  "injur",
  "urgent",
  "huge",
  "massive",
  "school",
  "hospital",
  "ambulance",
  "child",
  "every morning",
  "daily",
  "months",
  "weeks",
  "unusable",
  "blocked",
];
const MODERATE_URGENCY = ["struggl", "difficult", "slow", "inconvenien", "repeated", "again"];

export interface TextAnalysis {
  category: Category;
  confidence: number;
  severity: Severity;
  severityScore: number;
  impact: Impact;
  urgency: Impact;
  locationContext: string | null;
  matchedSignals: string[];
}

const LOCATION_HINTS = [
  "main gate",
  "college entrance",
  "market",
  "bus stop",
  "junction",
  "crossing",
  "school",
  "hospital",
  "station",
  "circle",
  "flyover",
  "bridge",
];

export function analyzeText(text: string): TextAnalysis {
  const t = text.toLowerCase();
  const matched: string[] = [];

  let best: Category = "Other";
  let bestHits = 0;
  (Object.keys(CATEGORY_KEYWORDS) as Category[]).forEach((cat) => {
    const hits = CATEGORY_KEYWORDS[cat].filter((k) => t.includes(k));
    if (hits.length > bestHits) {
      bestHits = hits.length;
      best = cat;
    }
    hits.forEach((h) => matched.push(h));
  });

  const highHits = HIGH_URGENCY.filter((k) => t.includes(k));
  const modHits = MODERATE_URGENCY.filter((k) => t.includes(k));
  matched.push(...highHits, ...modHits);

  let score = 35 + bestHits * 8 + highHits.length * 14 + modHits.length * 6;
  score = Math.max(20, Math.min(98, score));

  const severity = scoreToSeverity(score);
  const confidence = Math.min(96, 52 + bestHits * 16 + (highHits.length ? 6 : 0));

  const locationContext = LOCATION_HINTS.find((h) => t.includes(h)) ?? null;

  return {
    category: best,
    confidence: bestHits === 0 ? 44 : confidence,
    severity,
    severityScore: score,
    impact: score >= 70 ? "High" : score >= 45 ? "Medium" : "Low",
    urgency: highHits.length >= 2 ? "High" : highHits.length ? "Medium" : "Low",
    locationContext: locationContext ? titleCase(locationContext) : null,
    matchedSignals: Array.from(new Set(matched)).slice(0, 6),
  };
}

/**
 * Image analysis — PROTOTYPE. No vision model runs here. We derive a plausible
 * visual confirmation from the text signal and file metadata so the demo is
 * deterministic. Replace with a real vision endpoint later.
 */
export function analyzeImage(
  fileName: string | null,
  textAnalysis: TextAnalysis,
): { category: Category; confidence: number; severity: Severity; simulated: true } {
  const nameHit = fileName
    ? (Object.keys(CATEGORY_KEYWORDS) as Category[]).find((c) =>
        CATEGORY_KEYWORDS[c].some((k) => fileName.toLowerCase().includes(k.split(" ")[0] ?? k)),
      )
    : undefined;
  const category = nameHit ?? textAnalysis.category;
  return {
    category,
    confidence: Math.min(94, textAnalysis.confidence + (nameHit ? 8 : 2)),
    severity: textAnalysis.severity,
    simulated: true,
  };
}

export function scoreToSeverity(score: number): Severity {
  if (score >= 82) return "Critical";
  if (score >= 65) return "High";
  if (score >= 45) return "Moderate";
  return "Low";
}

export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(la1) * Math.cos(la2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

function tokens(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3),
  );
}

export function textSimilarity(a: string, b: string): number {
  const ta = tokens(a);
  const tb = tokens(b);
  if (!ta.size || !tb.size) return 0;
  let inter = 0;
  ta.forEach((w) => {
    if (tb.has(w)) inter += 1;
  });
  return inter / new Set([...ta, ...tb]).size;
}

export interface DuplicateMatch {
  report: Report;
  score: number;
  reasons: string[];
}

/** Duplicate / relatedness detection: category + geo proximity + text + recency. */
export function findRelated(
  candidate: Pick<Report, "category" | "description" | "lat" | "lng" | "createdAt">,
  reports: Report[],
  limit = 8,
): DuplicateMatch[] {
  return reports
    .map((r) => {
      const reasons: string[] = [];
      let score = 0;
      if (r.category === candidate.category) {
        score += 0.35;
        reasons.push(`Same category (${r.category})`);
      }
      const km = haversineKm(candidate, r);
      if (km < 0.6) {
        score += 0.35 * (1 - km / 0.6);
        reasons.push(`${(km * 1000).toFixed(0)} m away`);
      }
      const sim = textSimilarity(candidate.description, r.description);
      if (sim > 0.05) {
        score += sim * 0.6;
        reasons.push(`${Math.round(sim * 100)}% text overlap`);
      }
      const days =
        Math.abs(new Date(candidate.createdAt).getTime() - new Date(r.createdAt).getTime()) /
        86400000;
      if (days < 30) {
        score += 0.15 * (1 - days / 30);
        reasons.push(`${Math.round(days)} days apart`);
      }
      return { report: r, score: Math.min(1, score), reasons };
    })
    .filter((m) => m.score >= 0.45)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export interface PriorityBreakdown {
  total: number;
  factors: { label: string; value: number; max: number; detail: string }[];
}

/** Transparent 0–100 priority score. Every point is traceable to a factor. */
export function computePriority(input: {
  severityScore: number;
  relatedReports: number;
  recurrence: number;
  impact: Impact;
  locationSensitive: boolean;
}): PriorityBreakdown {
  const severity = Math.round((input.severityScore / 100) * 35);
  const volume = Math.round(Math.min(1, input.relatedReports / 30) * 25);
  const recurrence = Math.round(Math.min(1, input.recurrence / 4) * 15);
  const impact = input.impact === "High" ? 15 : input.impact === "Medium" ? 9 : 4;
  const location = input.locationSensitive ? 10 : 4;
  const total = Math.min(100, severity + volume + recurrence + impact + location);
  return {
    total,
    factors: [
      {
        label: "Severity",
        value: severity,
        max: 35,
        detail: `Severity index ${input.severityScore}/100`,
      },
      {
        label: "Related reports",
        value: volume,
        max: 25,
        detail: `${input.relatedReports} linked citizen reports`,
      },
      {
        label: "Recurrence",
        value: recurrence,
        max: 15,
        detail: `Reported ${input.recurrence}× in this location before`,
      },
      { label: "Public impact", value: impact, max: 15, detail: `${input.impact} estimated impact` },
      {
        label: "Location sensitivity",
        value: location,
        max: 10,
        detail: input.locationSensitive
          ? "Near school / hospital / major junction"
          : "Standard residential or arterial road",
      },
    ],
  };
}

/** Geo + category clustering. Greedy agglomeration within a 450 m radius. */
export function buildClusters(reports: Report[]): Cluster[] {
  const RADIUS_KM = 0.45;
  const used = new Set<string>();
  const clusters: Cluster[] = [];

  const sorted = [...reports].sort((a, b) => b.severityScore - a.severityScore);

  for (const seed of sorted) {
    if (used.has(seed.id)) continue;
    const members = sorted.filter(
      (r) =>
        !used.has(r.id) && r.category === seed.category && haversineKm(seed, r) <= RADIUS_KM,
    );
    if (members.length < 2) continue;
    members.forEach((m) => used.add(m.id));

    const severityScore = Math.round(
      members.reduce((s, m) => s + m.severityScore, 0) / members.length,
    );
    const weekly = weeklyBuckets(members);
    const trendPct = growth(weekly);
    const locationSensitive = members.some((m) =>
      /school|hospital|gate|junction|market|station/i.test(m.landmark),
    );
    const priority = computePriority({
      severityScore,
      relatedReports: members.length,
      recurrence: Math.min(5, Math.ceil(members.length / 6)),
      impact: severityScore >= 70 ? "High" : severityScore >= 45 ? "Medium" : "Low",
      locationSensitive,
    });

    clusters.push({
      id: `CL-${clusters.length + 1}`.padStart(5, "0"),
      title: `${seed.category} Cluster — ${seed.landmark}`,
      category: seed.category,
      ward: seed.ward,
      landmark: seed.landmark,
      lat: members.reduce((s, m) => s + m.lat, 0) / members.length,
      lng: members.reduce((s, m) => s + m.lng, 0) / members.length,
      reportIds: members.map((m) => m.id),
      severity: scoreToSeverity(severityScore),
      severityScore,
      priorityScore: priority.total,
      trendPct,
      weekly,
      department: departmentFor(seed.category),
    });
  }

  return clusters.sort((a, b) => b.priorityScore - a.priorityScore);
}

/** Hotspots = clusters that are both large and accelerating. */
export function detectHotspots(clusters: Cluster[]): Cluster[] {
  return clusters
    .filter((c) => c.reportIds.length >= 3 && (c.trendPct > 0 || c.priorityScore >= 70))
    .sort((a, b) => b.priorityScore - a.priorityScore);
}

export function weeklyBuckets(reports: Report[]): { week: string; reports: number }[] {
  const now = Date.now();
  const buckets = [0, 0, 0, 0];
  reports.forEach((r) => {
    const weeksAgo = Math.floor((now - new Date(r.createdAt).getTime()) / (7 * 86400000));
    if (weeksAgo >= 0 && weeksAgo < 4) buckets[3 - weeksAgo] = (buckets[3 - weeksAgo] ?? 0) + 1;
  });
  return buckets.map((reports, i) => ({ week: `Week ${i + 1}`, reports }));
}

function growth(weekly: { reports: number }[]): number {
  const prev = weekly[weekly.length - 2]?.reports ?? 0;
  const last = weekly[weekly.length - 1]?.reports ?? 0;
  if (prev === 0) return last > 0 ? 100 : 0;
  return Math.round(((last - prev) / prev) * 100);
}

function titleCase(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}
