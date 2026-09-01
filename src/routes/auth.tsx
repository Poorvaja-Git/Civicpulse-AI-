import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/civic/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCivic, type Role } from "@/lib/civic/store";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — CivicPulse" },
      {
        name: "description",
        content:
          "Sign in to CivicPulse as a citizen, authority or admin to report and manage civic issues.",
      },
      { property: "og:title", content: "Sign in — CivicPulse" },
      {
        property: "og:description",
        content: "Role-based access for citizens, authorities and administrators.",
      },
    ],
  }),
  component: AuthPage,
});

const DEMO: Record<Role, { name: string; email: string; blurb: string }> = {
  citizen: {
    name: "Ananya Rao",
    email: "citizen@civicpulse.demo",
    blurb: "Submit reports and track their status.",
  },
  authority: {
    name: "Ward Officer Deshmukh",
    email: "authority@civicpulse.demo",
    blurb: "Triage clusters, assign departments, update status.",
  },
  admin: {
    name: "City Admin",
    email: "admin@civicpulse.demo",
    blurb: "System overview across all wards and departments.",
  },
};

function AuthPage() {
  const { signIn, session } = useCivic();
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("citizen");
  const [name, setName] = useState(DEMO.citizen.name);
  const [email, setEmail] = useState(DEMO.citizen.email);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function pick(r: Role) {
    setRole(r);
    setName(DEMO[r].name);
    setEmail(DEMO[r].email);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.includes("@")) {
      setError("Enter a valid name and email address.");
      return;
    }
    if (password.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }
    setError(null);
    signIn({ name: name.trim(), email: email.trim(), role });
    toast.success(`Signed in as ${role}`);
    navigate({ to: role === "citizen" ? "/citizen" : "/authority" });
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Access"
        title="Sign in to CivicPulse"
        description="Prototype authentication. Sessions are stored in your browser only — no credentials leave this device and no real accounts are created."
      />
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_420px]">
        <div className="space-y-4">
          <h2 className="font-display text-lg font-semibold">Choose a role</h2>
          {(Object.keys(DEMO) as Role[]).map((r) => (
            <button
              key={r}
              onClick={() => pick(r)}
              className={`w-full rounded-2xl border p-5 text-left transition-colors ${
                role === r ? "border-primary bg-lavender-soft" : "border-border bg-card"
              }`}
            >
              <p className="font-display font-semibold capitalize">{r}</p>
              <p className="mt-1 text-sm text-muted-foreground">{DEMO[r].blurb}</p>
              <p className="mt-2 text-xs text-muted-foreground">{DEMO[r].email} · any password</p>
            </button>
          ))}
          {session ? (
            <p className="text-sm text-muted-foreground">
              Currently signed in as {session.name} ({session.role}).
            </p>
          ) : null}
        </div>

        <form
          onSubmit={submit}
          className="h-fit space-y-4 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]"
        >
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Any value (demo)"
              required
            />
          </div>
          {error ? (
            <p role="alert" className="text-sm font-medium text-destructive">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full">
            Sign in as {role}
          </Button>
          <p className="text-xs text-muted-foreground">
            In production this screen calls a hashed-password auth API with role-based
            authorisation; the prototype keeps the session client-side.
          </p>
        </form>
      </div>
    </AppShell>
  );
}
