import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useClients, useDocs, useProfile } from "@/lib/store";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { Money } from "@/components/Money";
import { computeTotals } from "@/lib/calc";
import { canCreateDoc, docsThisMonth, FREE_DOC_LIMIT, isPro } from "@/lib/freemium";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, FileText, Loader2, ChevronRight } from "lucide-react";
import { formatDate } from "@/lib/format";
import type { DocType } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/app/docs/")({
  component: DocsList,
});

const TABS: { value: "all" | DocType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "quote", label: "Quotes" },
  { value: "invoice", label: "Invoices" },
  { value: "proforma", label: "Proforma" },
];

function DocsList() {
  const { user, loading } = useAuth();
  const [profile] = useProfile(user?.id ?? null);
  const { docs } = useDocs(user?.id ?? null);
  const { clients } = useClients(user?.id ?? null);
  const nav = useNavigate();
  const [tab, setTab] = useState<"all" | DocType>("all");

  useEffect(() => {
    if (!loading && !user) nav({ to: "/" });
    if (user && !profile) nav({ to: "/app/onboarding" });
  }, [user, loading, profile, nav]);

  const filtered = useMemo(
    () => (tab === "all" ? docs : docs.filter((d) => d.type === tab)).slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [docs, tab],
  );

  if (loading || !user || !profile) {
    return <div className="min-h-screen grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const startNew = () => {
    if (!canCreateDoc(profile, docs)) {
      toast.error(`Free plan limit: ${FREE_DOC_LIMIT} documents per month. Upgrade for unlimited.`);
      return;
    }
    nav({ to: "/app/docs/new" });
  };

  return (
    <AppShell>
      <PageHeader
        title="Documents"
        subtitle={isPro(profile) ? "Unlimited" : `${docsThisMonth(docs)} of ${FREE_DOC_LIMIT} this month`}
        action={<Button onClick={startNew} size="sm" className="gap-1"><Plus className="h-4 w-4" /> New</Button>}
      />
      <div className="px-4">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList className="grid grid-cols-4 w-full">
            {TABS.map((t) => <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>)}
          </TabsList>
        </Tabs>
      </div>
      <div className="px-4 mt-4 space-y-2">
        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <FileText className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">No documents yet</p>
            <p className="text-xs text-muted-foreground mt-1">Create your first quote or invoice.</p>
            <Button onClick={startNew} className="mt-4">Create document</Button>
          </div>
        )}
        {filtered.map((d) => {
          const client = clients.find((c) => c.id === d.clientId);
          const t = computeTotals(d);
          return (
            <Link key={d.id} to="/app/docs/$id" params={{ id: d.id }} className="block">
              <div className="rounded-xl border border-border bg-card p-4 active:scale-[0.99] transition-transform">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">{d.type}</span>
                      <span className="text-xs text-muted-foreground">{d.number}</span>
                    </div>
                    <p className="font-semibold mt-1 truncate">{client?.companyName || client?.fullName || "Unknown client"}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatDate(d.date)} · <StatusPill status={d.status} /></p>
                  </div>
                  <div className="text-right shrink-0">
                    <Money amount={t.total} currency={d.currency} />
                    {t.balance > 0 && d.type === "invoice" && (
                      <p className="text-xs text-warning mt-0.5">Owed: <Money amount={t.balance} currency={d.currency} /></p>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground inline-block mt-1" />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: "text-muted-foreground",
    sent: "text-primary",
    accepted: "text-success",
    paid: "text-success",
    partially_paid: "text-warning",
    overdue: "text-destructive",
    declined: "text-destructive",
    expired: "text-muted-foreground",
  };
  return <span className={`font-medium ${map[status] ?? ""}`}>{status.replace("_", " ")}</span>;
}
