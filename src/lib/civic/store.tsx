import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { buildSeedReports } from "./data";
import { buildClusters, detectHotspots } from "./intelligence";
import type { Cluster, Report, Status } from "./types";

const STORAGE_KEY = "civicpulse.reports.v1";
const SESSION_KEY = "civicpulse.session.v1";

export type Role = "citizen" | "authority" | "admin";
export interface Session {
  name: string;
  email: string;
  role: Role;
}

interface Ctx {
  reports: Report[];
  clusters: Cluster[];
  hotspots: Cluster[];
  session: Session | null;
  signIn: (s: Session) => void;
  signOut: () => void;
  addReport: (r: Report) => void;
  updateStatus: (id: string, next: Status, note?: string) => void;
  addNote: (id: string, text: string) => void;
  assignDepartment: (id: string, department: string) => void;
  resetDemo: () => void;
}

const CivicContext = createContext<Ctx | null>(null);

export function CivicProvider({ children }: { children: ReactNode }) {
  const [reports, setReports] = useState<Report[]>(() => buildSeedReports());
  const [session, setSession] = useState<Session | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setReports(JSON.parse(raw) as Report[]);
      const s = localStorage.getItem(SESSION_KEY);
      if (s) setSession(JSON.parse(s) as Session);
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
    } catch {
      /* quota */
    }
  }, [reports, hydrated]);

  const signIn = useCallback((s: Session) => {
    setSession(s);
    localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  }, []);
  const signOut = useCallback(() => {
    setSession(null);
    localStorage.removeItem(SESSION_KEY);
  }, []);

  const addReport = useCallback((r: Report) => setReports((prev) => [r, ...prev]), []);

  const updateStatus = useCallback((id: string, next: Status, note?: string) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: next,
              history: [
                ...r.history,
                {
                  id: `${id}-h${r.history.length}`,
                  from: r.status,
                  to: next,
                  changedBy: "Authority · You",
                  at: new Date().toISOString(),
                  note,
                },
              ],
            }
          : r,
      ),
    );
  }, []);

  const addNote = useCallback((id: string, text: string) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              notes: [
                ...r.notes,
                {
                  id: `${id}-n${r.notes.length}`,
                  author: "Authority · You",
                  text,
                  at: new Date().toISOString(),
                },
              ],
            }
          : r,
      ),
    );
  }, []);

  const assignDepartment = useCallback((id: string, department: string) => {
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, department } : r)));
  }, []);

  const resetDemo = useCallback(() => {
    setReports(buildSeedReports());
  }, []);

  const clusters = useMemo(() => buildClusters(reports), [reports]);
  const hotspots = useMemo(() => detectHotspots(clusters), [clusters]);

  const value = useMemo(
    () => ({
      reports,
      clusters,
      hotspots,
      session,
      signIn,
      signOut,
      addReport,
      updateStatus,
      addNote,
      assignDepartment,
      resetDemo,
    }),
    [
      reports,
      clusters,
      hotspots,
      session,
      signIn,
      signOut,
      addReport,
      updateStatus,
      addNote,
      assignDepartment,
      resetDemo,
    ],
  );

  return <CivicContext.Provider value={value}>{children}</CivicContext.Provider>;
}

export function useCivic() {
  const ctx = useContext(CivicContext);
  if (!ctx) throw new Error("useCivic must be used inside CivicProvider");
  return ctx;
}
