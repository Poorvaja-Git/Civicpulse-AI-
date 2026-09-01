import type { Severity } from "@/lib/civic/types";

export interface MapPoint {
  id: string;
  lat: number;
  lng: number;
  title: string;
  category: string;
  location: string;
  severity: Severity;
  reports: number;
  priority: number;
  status: string;
  department: string;
}
