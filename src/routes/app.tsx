import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useProfile, useDocs, useClients } from "@/lib/store";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { Money } from "@/components/Money";
import { computeTotals } from "@/lib/calc";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app")({
  component: AppRoute,
});

function AppRoute() {
  const { user, loading, signOut } = useAuth();
  const [profile] = useProfile(user?.id ?? null);
  const { docs } = useDocs(user?.id ?? null);
  const { clients } = useClients(user?.id ?? null);
  const nav = useNavigate();

  useEffect(() => {
    if (!loading && !user) nav({ to: "/" });
  }, [user, loading, nav]);

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <h2 className="text-xl font-bold">Welcome to GetPaid</h2>
          <p className="text-sm text-muted-foreground mt-2">Your business profile setup will appear here. Coming in the next iteration — for now you can sign out and back in.</p>
          <Button onClick={() => signOut()} variant="outline" className="mt-4">Sign out</Button>
        </div>
      </div>
    );
  }

  const invoices = docs.filter((d) => d.type === "invoice");
  const outstanding = invoices.reduce((s, d) => s + computeTotals(d).balance, 0);

  return (
    <AppShell>
      <div>
        <PageHeader title={`Hello, ${profile.businessName.split(" ")[0]}`} subtitle="Welcome to GetPaid" />
        <div className="px-4 grid grid-cols-2 gap-3">
          <Stat label="Outstanding"><Money amount={outstanding} currency={profile.primaryCurrency} big /></Stat>
          <Stat label="Clients"><span className="money text-2xl">{clients.length}</span></Stat>
          <Stat label="Documents"><span className="money text-2xl">{docs.length}</span></Stat>
          <Stat label="Plan"><span className="text-2xl font-bold capitalize">{profile.plan}</span></Stat>
        </div>
        <div className="px-4 mt-6 text-sm text-muted-foreground">
          Foundation is set up. The full app — quotes, invoices, BI charts, marketing, and the rest — will be added in follow-up iterations.
        </div>
        <div className="px-4 mt-4 flex gap-2">
          <Link to="/"><Button variant="outline" size="sm">Home</Button></Link>
          <Button onClick={() => signOut()} variant="ghost" size="sm">Sign out</Button>
        </div>
      </div>
    </AppShell>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-card border border-border p-4 shadow-sm">
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <div className="mt-1 text-foreground">{children}</div>
    </div>
  );
}
