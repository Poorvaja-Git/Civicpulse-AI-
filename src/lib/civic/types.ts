export type Category =
  | "Pothole"
  | "Garbage"
  | "Waterlogging"
  | "Drainage"
  | "Streetlight"
  | "Road Damage"
  | "Other";

export const CATEGORIES: Category[] = [
  "Pothole",
  "Garbage",
  "Waterlogging",
  "Drainage",
  "Streetlight",
  "Road Damage",
  "Other",
];

export type Severity = "Low" | "Moderate" | "High" | "Critical";
export const SEVERITIES: Severity[] = ["Low", "Moderate", "High", "Critical"];

export type Status = "Submitted" | "Verified" | "Assigned" | "In Progress" | "Resolved";
export const STATUS_FLOW: Status[] = [
  "Submitted",
  "Verified",
  "Assigned",
  "In Progress",
  "Resolved",
];

export type Impact = "Low" | "Medium" | "High";

export interface StatusEvent {
  id: string;
  from: Status | null;
  to: Status;
  changedBy: string;
  at: string;
  note?: string;
}

export interface Report {
  id: string;
  description: string;
  category: Category;
  imageUrl?: string;
  landmark: string;
  ward: string;
  lat: number;
  lng: number;
  severity: Severity;
  severityScore: number;
  priorityScore: number;
  impact: Impact;
  recurrence: number;
  status: Status;
  department: string;
  reporter: string;
  anonymous: boolean;
  createdAt: string;
  history: StatusEvent[];
  notes: { id: string; author: string; text: string; at: string }[];
}

export interface Cluster {
  id: string;
  title: string;
  category: Category;
  ward: string;
  landmark: string;
  lat: number;
  lng: number;
  reportIds: string[];
  severity: Severity;
  severityScore: number;
  priorityScore: number;
  trendPct: number;
  weekly: { week: string; reports: number }[];
  department: string;
}

export const DEPARTMENTS: { name: string; contact: string; handles: Category[] }[] = [
  {
    name: "Roads & Infrastructure",
    contact: "roads@citycorp.gov.in",
    handles: ["Pothole", "Road Damage"],
  },
  { name: "Solid Waste Management", contact: "swm@citycorp.gov.in", handles: ["Garbage"] },
  {
    name: "Storm Water & Drainage",
    contact: "drainage@citycorp.gov.in",
    handles: ["Waterlogging", "Drainage"],
  },
  { name: "Electrical & Lighting", contact: "lighting@citycorp.gov.in", handles: ["Streetlight"] },
  { name: "General Civic Services", contact: "civic@citycorp.gov.in", handles: ["Other"] },
];

export function departmentFor(category: Category): string {
  return (
    DEPARTMENTS.find((d) => d.handles.includes(category))?.name ?? "General Civic Services"
  );
}
