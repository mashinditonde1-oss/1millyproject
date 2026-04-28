import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { useProfile, useDocs, useClients } from "@/lib/store";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { computeTotals } from "@/lib/calc";
import { formatMoney } from "@/lib/format";
import { Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

export const Route = createFileRoute("/app/analytics")({
  component: AnalyticsPage,
});

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function AnalyticsPage() {
  const { user, loading } = useAuth();
  const [profile, , profileLoading] = useProfile(user?.id ?? null);
  const { docs } = useDocs(user?.id ?? null);
  const { clients } = useClients(user?.id ?? null);
  const nav = useNavigate();

  useEffect(() => {
    if (!loading && !user) nav({ to: "/" });
    if (!loading && !profileLoading && user && !profile) nav({ to: "/app/onboarding" });
  }, [user, loading, profile, profileLoading, nav]);

  const invoices = useMemo(() => docs.filter((d) => d.type === "invoice"), [docs]);
  const quotes = useMemo(() => docs.filter((d) => d.type === "quote"), [docs]);

  // Monthly revenue — last 12 months
  const monthlyRevenue = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const month = MONTHS[d.getMonth()];
      const revenue = invoices.reduce((sum, inv) => {
        const t = computeTotals(inv);
        return sum + inv.payments.filter((p) => {
          const pd = new Date(p.date);
          return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear();
        }).reduce((s, p) => s + p.amount, 0);
      }, 0);
      return { month, revenue };
    });
  }, [invoices]);

  // Top 5 clients by total invoiced
  const topClients = useMemo(() => {
    const map = new Map<string, number>();
    invoices.forEach((inv) => {
      const t = computeTotals(inv);
      map.set(inv.clientId, (map.get(inv.clientId) ?? 0) + t.total);
    });
    return Array.from(map.entries())
      .map(([clientId, total]) => {
        const c = clients.find((x) => x.id === clientId);
        return { name: c?.companyName || c?.fullName || "Unknown", total };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [invoices, clients]);

  // Top 5 services by revenue
  const topServices = useMemo(() => {
    const map = new Map<string, number>();
    invoices.forEach((inv) => {
      inv.items.forEach((item) => {
        const key = item.description.trim();
        if (!key) return;
        const val = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
        map.set(key, (map.get(key) ?? 0) + val);
      });
    });
    return Array.from(map.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [invoices]);

  // Avg payment time per client (days between invoice date and first payment)
  const avgPaymentTime = useMemo(() => {
    const map = new Map<string, number[]>();
    invoices.forEach((inv) => {
      if (!inv.payments.length) return;
      const invDate = new Date(inv.date).getTime();
      const firstPay = new Date(inv.payments[0].date).getTime();
      const days = Math.max(0, Math.round((firstPay - invDate) / 86400000));
      const c = clients.find((x) => x.id === inv.clientId);
      const name = c?.companyName || c?.fullName || "Unknown";
      if (!map.has(name)) map.set(name, []);
      map.get(name)!.push(days);
    });
    return Array.from(map.entries())
      .map(([name, days]) => ({
        name,
        avg: Math.round(days.reduce((a, b) => a + b, 0) / days.length),
      }))
      .sort((a, b) => a.avg - b.avg)
      .slice(0, 5);
  }, [invoices, clients]);

  // Quote conversion rate
  const conversionRate = useMemo(() => {
    if (!quotes.length) return null;
    const converted = quotes.filter((q) => q.linkedInvoiceId || q.status === "accepted").length;
    return Math.round((converted / quotes.length) * 100);
  }, [quotes]);

  // Debt age analysis
  const debtAge = useMemo(() => {
    const buckets = { "0-30": 0, "31-60": 0, "61-90": 0, "90+": 0 };
    const now = Date.now();
    invoices.forEach((inv) => {
      const t = computeTotals(inv);
      if (t.balance <= 0) return;
      const daysOld = Math.floor((now - new Date(inv.date).getTime()) / 86400000);
      if (daysOld <= 30) buckets["0-30"] += t.balance;
      else if (daysOld <= 60) buckets["31-60"] += t.balance;
      else if (daysOld <= 90) buckets["61-90"] += t.balance;
      else buckets["90+"] += t.balance;
    });
    return [
      { label: "0-30 days", value: buckets["0-30"], color: "#22c55e" },
      { label: "31-60 days", value: buckets["31-60"], color: "#eab308" },
      { label: "61-90 days", value: buckets["61-90"], color: "#f97316" },
      { label: "90+ days", value: buckets["90+"], color: "#ef4444" },
    ];
  }, [invoices]);

  // Plain English insights
  const insights = useMemo(() => {
    const list: { type: "warn" | "info" | "good"; text: string }[] = [];
    const cur = profile?.primaryCurrency ?? "USD";

    if (conversionRate !== null && conversionRate < 40) {
      list.push({ type: "warn", text: `Your quote conversion rate is ${conversionRate}%. Following up within 48 hours can double your conversions.` });
    }
    if (conversionRate !== null && conversionRate >= 70) {
      list.push({ type: "good", text: `Strong quote conversion at ${conversionRate}%. Clients trust your pricing.` });
    }

    const topClientRevShare = topClients.length
      ? (topClients.slice(0, 3).reduce((s, c) => s + c.total, 0) /
          Math.max(1, topClients.reduce((s, c) => s + c.total, 0))) * 100
      : 0;
    if (topClientRevShare > 75 && topClients.length >= 3) {
      list.push({ type: "warn", text: `80% of your revenue comes from ${topClients.slice(0, 3).map((c) => c.name).join(", ")}. Consider diversifying.` });
    }

    const overdueBalance = debtAge[2].value + debtAge[3].value;
    if (overdueBalance > 0) {
      list.push({ type: "warn", text: `You have ${formatMoney(overdueBalance, cur)} outstanding for over 60 days. Time to follow up firmly.` });
    }

    const totalRevenue = monthlyRevenue.reduce((s, m) => s + m.revenue, 0);
    const avgInvoice = invoices.length ? totalRevenue / invoices.length : 0;
    if (avgInvoice > 0 && avgInvoice < 200) {
      list.push({ type: "info", text: `Your average invoice is ${formatMoney(avgInvoice, cur)}. Businesses in your category often charge more — review your pricing.` });
    }

    const slowestMonth = [...monthlyRevenue].sort((a, b) => a.revenue - b.revenue)[0];
    if (slowestMonth && slowestMonth.revenue === 0) {
      list.push({ type: "info", text: `${slowestMonth.month} had zero revenue recorded. Consider running promotions during slow months.` });
    }

    if (!list.length) {
      list.push({ type: "good", text: "Everything looks healthy. Keep sending those quotes!" });
    }
    return list;
  }, [conversionRate, topClients, debtAge, monthlyRevenue, invoices, profile]);

  if (loading || profileLoading || !user || !profile) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const cur = profile.primaryCurrency;
  const totalRevenue = monthlyRevenue.reduce((s, m) => s + m.revenue, 0);
  const totalOutstanding = invoices.reduce((s, inv) => s + Math.max(0, computeTotals(inv).balance), 0);

  return (
    <AppShell>
      <PageHeader title="Analytics" subtitle="Business intelligence" />
      <div className="px-4 space-y-5 pb-6">

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card label="Total collected">
            <span className="money text-xl font-bold">{formatMoney(totalRevenue, cur)}</span>
            <span className="text-xs text-muted-foreground">last 12 months</span>
          </Card>
          <Card label="Outstanding">
            <span className="money text-xl font-bold text-warning">{formatMoney(totalOutstanding, cur)}</span>
            <span className="text-xs text-muted-foreground">unpaid invoices</span>
          </Card>
          <Card label="Quote conversion">
            <span className="money text-xl font-bold">
              {conversionRate !== null ? `${conversionRate}%` : "—"}
            </span>
            <span className="text-xs text-muted-foreground">quotes → invoices</span>
          </Card>
          <Card label="Total invoices">
            <span className="money text-xl font-bold">{invoices.length}</span>
            <span className="text-xs text-muted-foreground">all time</span>
          </Card>
        </div>

        {/* Monthly revenue chart */}
        <Section title="Monthly Revenue (12 months)">
          {totalRevenue === 0 ? (
            <Empty text="No payments recorded yet." />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={monthlyRevenue} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => formatMoney(v, cur)} />
                <Bar dataKey="revenue" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Section>

        {/* Top clients */}
        <Section title="Top Clients by Revenue">
          {!topClients.length ? (
            <Empty text="No invoice data yet." />
          ) : (
            <div className="space-y-2">
              {topClients.map((c, i) => (
                <Bar2 key={i} label={c.name} value={formatMoney(c.total, cur)}
                  pct={topClients[0].total > 0 ? (c.total / topClients[0].total) * 100 : 0} />
              ))}
            </div>
          )}
        </Section>

        {/* Top services */}
        <Section title="Top Services by Revenue">
          {!topServices.length ? (
            <Empty text="No line item data yet." />
          ) : (
            <div className="space-y-2">
              {topServices.map((s, i) => (
                <Bar2 key={i} label={s.name} value={formatMoney(s.total, cur)}
                  pct={topServices[0].total > 0 ? (s.total / topServices[0].total) * 100 : 0} />
              ))}
            </div>
          )}
        </Section>

        {/* Debt age */}
        <Section title="Outstanding Debt by Age">
          {totalOutstanding === 0 ? (
            <Empty text="No outstanding debt. Nice work!" good />
          ) : (
            <div className="space-y-2">
              {debtAge.map((b) => (
                <div key={b.label} className="flex items-center gap-3">
                  <div className="w-20 shrink-0 text-xs text-muted-foreground">{b.label}</div>
                  <div className="flex-1 bg-secondary rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${totalOutstanding > 0 ? (b.value / totalOutstanding) * 100 : 0}%`,
                        backgroundColor: b.color,
                      }}
                    />
                  </div>
                  <span className="money text-xs w-20 text-right">{formatMoney(b.value, cur)}</span>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Avg payment time */}
        {avgPaymentTime.length > 0 && (
          <Section title="Fastest Paying Clients">
            <div className="space-y-2">
              {avgPaymentTime.map((c, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="truncate text-foreground">{c.name}</span>
                  <span className={`font-medium tabular-nums ${c.avg <= 7 ? "text-success" : c.avg <= 30 ? "text-warning" : "text-destructive"}`}>
                    {c.avg} days
                  </span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Insights */}
        <Section title="Insights">
          <div className="space-y-2">
            {insights.map((ins, i) => (
              <div key={i} className={`rounded-lg p-3 text-sm flex items-start gap-2 ${
                ins.type === "warn" ? "bg-warning/10 text-warning-foreground border border-warning/20" :
                ins.type === "good" ? "bg-success/10 text-success-foreground border border-success/20" :
                "bg-secondary border border-border"
              }`}>
                {ins.type === "warn" ? <TrendingDown className="h-4 w-4 mt-0.5 shrink-0 text-warning" /> :
                 ins.type === "good" ? <TrendingUp className="h-4 w-4 mt-0.5 shrink-0 text-success" /> :
                 <Minus className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />}
                <p>{ins.text}</p>
              </div>
            ))}
          </div>
        </Section>

      </div>
    </AppShell>
  );
}

function Card({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-card border border-border p-4 flex flex-col gap-1">
      <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">{label}</p>
      {children}
    </div>
  );
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}
function Bar2({ label, value, pct }: { label: string; value: string; pct: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="truncate text-foreground max-w-[60%]">{label}</span>
        <span className="money text-xs">{value}</span>
      </div>
      <div className="bg-secondary rounded-full h-1.5 overflow-hidden">
        <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
function Empty({ text, good }: { text: string; good?: boolean }) {
  return (
    <p className={`text-sm text-center py-2 ${good ? "text-success" : "text-muted-foreground"}`}>{text}</p>
  );
}
