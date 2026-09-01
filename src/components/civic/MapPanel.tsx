import { Suspense, lazy, useEffect, useState } from "react";
import type { MapPoint } from "./CivicMap.client";

const CivicMap = lazy(() => import("./CivicMap.client"));

function Skeleton({ height }: { height: number }) {
  return (
    <div
      className="grid animate-pulse place-items-center rounded-2xl bg-surface text-sm text-muted-foreground"
      style={{ height }}
    >
      Loading civic map…
    </div>
  );
}

export function MapPanel({
  points,
  height = 420,
  center,
  zoom,
  onSelect,
}: {
  points: MapPoint[];
  height?: number;
  center?: [number, number];
  zoom?: number;
  onSelect?: (id: string) => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <Skeleton height={height} />;
  return (
    <Suspense fallback={<Skeleton height={height} />}>
      <CivicMap points={points} height={height} center={center} zoom={zoom} onSelect={onSelect} />
    </Suspense>
  );
}

export function MapLegend() {
  const items = [
    ["Low", "var(--sev-low)"],
    ["Moderate", "var(--sev-moderate)"],
    ["High", "var(--sev-high)"],
    ["Critical", "var(--sev-critical)"],
  ] as const;
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
      {items.map(([label, color]) => (
        <span key={label} className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full" style={{ backgroundColor: color }} aria-hidden />
          {label}
        </span>
      ))}
    </div>
  );
}

export type { MapPoint };
