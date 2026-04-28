import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useProfile, useDocs, useClients } from "@/lib/store";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import {
  Settings, MessageCircle, Share2, Download, FileText,
  Shield, LogOut, ChevronRight, Loader2, Copy, Check,
} from "lucide-react";
import { toast } from "sonner";
import { computeTotals } from "@/lib/calc";
import { formatMoney, formatDate } from "@/lib/format";

export const Route = createFileRoute("/app/more")({
  component: MorePage,
});

function MorePage() {
  const { user, loading, signOut } = useAuth();
  const [profile, , profileLoading] = useProfile(user?.id ?? null);
  const { docs } = useDocs(user?.id ?? null);
  const { clients } = useClients(user?.id ?? null);
  const nav = useNavigate();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/" });
  }, [user, loading, nav]);

  if (loading || profileLoading || !user || !profile) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const copyReferral = () => {
    const msg = `Hey! I've been using GetPaid to manage my invoices and quotes — it's built for Zimbabwean businesses. Try it free: https://getpaid.co.zw?ref=${profile.referralCode}`;
    navigator.clipboard.writeText(msg).then(() => {
      setCopied(true);
      toast.success("Referral link copied!");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareReferral = () => {
    const msg = `Hey! I've been using GetPaid to manage my invoices and quotes — it's built for Zimbabwean businesses. Try it free: https://getpaid.co.zw?ref=${profile.referralCode}`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, "_blank");
  };

  const exportData = () => {
    // Build CSV content
    const lines: string[] = [];

    // Clients CSV
    lines.push("=== CLIENTS ===");
    lines.push("Name,Company,WhatsApp,Email,Address");
    clients.forEach((c) => {
      lines.push(`"${c.fullName}","${c.companyName ?? ""}","${c.whatsapp}","${c.email ?? ""}","${c.address ?? ""}"`);
    });

    lines.push("");
    lines.push("=== DOCUMENTS ===");
    lines.push("Number,Type,Date,Status,Client,Currency,Total,Paid,Balance");
    docs.forEach((d) => {
      const t = computeTotals(d);
      const c = clients.find((x) => x.id === d.clientId);
      lines.push(
        `"${d.number}","${d.type}","${formatDate(d.date)}","${d.status}","${c?.companyName || c?.fullName || ""}","${d.currency}","${t.total.toFixed(2)}","${t.paid.toFixed(2)}","${t.balance.toFixed(2)}"`,
      );
    });

    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `getpaid-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Data exported successfully");
  };

  const isPro = profile.plan === "pro";

  return (
    <AppShell>
      <div className="px-4 pt-6 pb-4">
        {/* Profile card */}
        <div className="rounded-2xl border border-border bg-card p-4 mb-5 flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg shrink-0">
            {profile.businessName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold truncate">{profile.businessName}</p>
            <p className="text-xs text-muted-foreground">{profile.businessType}</p>
            <span className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              isPro ? "bg-[var(--gold)]/20 text-[var(--gold)]" : "bg-secondary text-muted-foreground"
            }`}>
              {isPro ? "GetPaid Pro" : "Free Plan"}
            </span>
          </div>
        </div>

        {/* Upgrade banner for free users */}
        {!isPro && (
          <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 mb-5 space-y-2">
            <p className="text-sm font-semibold">Upgrade to GetPaid Pro</p>
            <p className="text-xs text-muted-foreground">Unlimited documents, WhatsApp reminders, analytics, marketing tools & more.</p>
            <div className="flex gap-2 pt-1">
              <div className="flex-1 rounded-lg border border-border bg-card p-2 text-center">
                <p className="text-sm font-bold">$9</p>
                <p className="text-[10px] text-muted-foreground">per month</p>
              </div>
              <div className="flex-1 rounded-lg border border-primary bg-primary/5 p-2 text-center relative">
                <p className="text-sm font-bold">$81</p>
                <p className="text-[10px] text-muted-foreground">per year</p>
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[9px] px-1.5 py-0.5 rounded-full font-bold">3 MONTHS FREE</span>
              </div>
            </div>
            <Button className="w-full h-10 mt-1" size="sm">
              Upgrade Now
            </Button>
          </div>
        )}

        {/* Menu items */}
        <div className="space-y-2">
          <MenuItem
            icon={<Settings className="h-4 w-4" />}
            label="Settings"
            sub="Business profile, payment details"
            to="/app/settings"
          />
          <MenuItem
            icon={<MessageCircle className="h-4 w-4" />}
            label="Marketing Messages"
            sub="Send promotions to clients"
            to="/app/marketing"
          />

          {/* Referral section */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center gap-3">
              <span className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center">
                <Share2 className="h-4 w-4 text-foreground" />
              </span>
              <div>
                <p className="text-sm font-medium">Refer a Business</p>
                <p className="text-xs text-muted-foreground">Both get 1 month free</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2">
              <code className="text-xs flex-1 font-mono text-muted-foreground">
                REF: {profile.referralCode}
              </code>
              <button type="button" onClick={copyReferral} className="text-primary">
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
            <Button variant="outline" size="sm" className="w-full gap-2" onClick={shareReferral}>
              <MessageCircle className="h-3.5 w-3.5" />
              Share via WhatsApp
            </Button>
          </div>

          {/* Data export */}
          <button
            type="button"
            onClick={exportData}
            className="w-full rounded-xl border border-border bg-card p-4 flex items-center gap-3 text-left hover:bg-secondary/50 transition-colors"
          >
            <span className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
              <Download className="h-4 w-4 text-foreground" />
            </span>
            <div>
              <p className="text-sm font-medium">Export My Data</p>
              <p className="text-xs text-muted-foreground">Download all clients & documents as CSV</p>
            </div>
          </button>

          {/* Legal */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <a href="/terms" className="flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors">
              <span className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <FileText className="h-4 w-4 text-foreground" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium">Terms of Service</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </a>
            <div className="border-t border-border" />
            <a href="/privacy" className="flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors">
              <span className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <Shield className="h-4 w-4 text-foreground" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium">Privacy Policy</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </a>
          </div>

          {/* Sign out */}
          <button
            type="button"
            onClick={() => { signOut(); nav({ to: "/" }); }}
            className="w-full rounded-xl border border-border bg-card p-4 flex items-center gap-3 text-left hover:bg-destructive/5 transition-colors"
          >
            <span className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
              <LogOut className="h-4 w-4 text-destructive" />
            </span>
            <p className="text-sm font-medium text-destructive">Sign Out</p>
          </button>
        </div>

        <p className="text-center text-[10px] text-muted-foreground mt-6">
          GetPaid v1.0 · Built for Zimbabwe 🇿🇼
        </p>
      </div>
    </AppShell>
  );
}

function MenuItem({
  icon, label, sub, to,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  to: string;
}) {
  return (
    <Link
      to={to as any}
      className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:bg-secondary/50 transition-colors"
    >
      <span className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </Link>
  );
}
