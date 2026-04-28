import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useProfile, useDocs, useClients } from "@/lib/store";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { Money } from "@/components/Money";
import { computeTotals } from "@/lib/calc";
import { Loader2, Plus, FileText, Users, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { docsThisMonth, FREE_DOC_LIMIT, isPro } from "@/lib/freemium";

export const Route = createFileRoute("/app")({
  component: AppRoute,
});

function AppRoute() {
  const { user, loading } = useAuth();
  const [profile] = useProfile(user?.id ?? null);
  const { docs } = useDocs(user?.id ?? null);
  const { clients } = useClients(user?.id ?? null);
  const nav = useNavigate();

  useEffect(() => {
    if (!loading && !user) nav({ to: "/" });
    if (user && !loading && !profile) nav({ to: "/app/onboarding" });
  }, [user, loading, profile, nav]);

  if (loading || !user || !profile) {
    return <div className="min-h-screen grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const invoices = docs.filter((d) => d.type === "invoice");
  const outstanding = invoices.reduce((s, d) => s + Math.max(0, computeTotals(d).balance), 0);
  const paidThisMonth = invoices.reduce((s, d) => {
    const now = new Date();
    return s + d.payments.filter((p) => {
      const dt = new Date(p.date);
      return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
    }).reduce((x, p) => x + p.amount, 0);
  }, 0);
  const recent = docs.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);

  return (
    <AppShell>
      <PageHeader
        title={`Hello, ${profile.businessName.split(" ")[0]}`}
        subtitle={isPro(profile) ? "GetPaid Pro" : `Free plan · ${docsThisMonth(docs)}/${FREE_DOC_LIMIT} docs this month`}
      />

      <div className="px-4 grid grid-cols-2 gap-3">
        <Stat label="Outstanding" tone="warning"><Money amount={outstanding} currency={profile.primaryCurrency} big /></Stat>
        <Stat label="Paid this month" tone="success"><Money amount={paidThisMonth} currency={profile.primaryCurrency} big /></Stat>
        <Stat label="Clients"><span className="money text-2xl text-foreground">{clients.length}</span></Stat>
        <Stat label="Documents"><span className="money text-2xl text-foreground">{docs.length}</span></Stat>
      </div>

      <div className="px-4 mt-5 grid grid-cols-2 gap-3">
        <Link to="/app/docs/new">
          <Button className="w-full h-14 gap-2 justify-start text-base"><Plus className="h-5 w-5" /> New document</Button>
        </Link>
        <Link to="/app/clients">
          <Button variant="outline" className="w-full h-14 gap-2 justify-start text-base"><Users className="h-5 w-5" /> Clients</Button>
        </Link>
      </div>

      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Recent</h2>
          <Link to="/app/docs" className="text-xs text-primary inline-flex items-center gap-0.5">View all <ArrowUpRight className="h-3 w-3" /></Link>
        </div>
        {recent.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-6 text-center">
            <FileText className="h-7 w-7 mx-auto text-muted-foreground" />
            <p className="text-sm font-medium mt-2">Nothing yet</p>
            <p className="text-xs text-muted-foreground mt-1">Create your first quote or invoice.</p>
          </div>
        )}
        <div className="space-y-2">
          {recent.map((d) => {
            const t = computeTotals(d);
            const client = clients.find((c) => c.id === d.clientId);
            return (
              <Link key={d.id} to="/app/docs/$id" params={{ id: d.id }} className="block">
                <div className="rounded-xl border border-border bg-card p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground uppercase">{d.type} · {d.number}</p>
                    <p className="text-sm font-semibold truncate">{client?.companyName || client?.fullName || "—"}</p>
                  </div>
                  <Money amount={t.total} currency={d.currency} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}

function Stat({ label, children, tone }: { label: string; children: React.ReactNode; tone?: "success" | "warning" }) {
  const dot = tone === "success" ? "bg-[var(--success)]" : tone === "warning" ? "bg-[var(--warning)]" : "bg-muted-foreground/40";
  return (
    <div className="rounded-xl bg-card border border-border p-4">
      <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium flex items-center gap-1.5">
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        {label}
      </p>
      <div className="mt-2 text-foreground">{children}</div>
    </div>
  );
}
