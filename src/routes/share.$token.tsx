import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { findDocByShareToken, readProfileFor, updateDocFor } from "@/lib/store";
import type { BusinessDocument, BusinessProfile } from "@/lib/types";
import { computeTotals } from "@/lib/calc";
import { formatMoney, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/Logo";
import { Loader2, Check, X } from "lucide-react";

export const Route = createFileRoute("/share/$token")({
  component: ShareView,
});

function ShareView() {
  const { token } = useParams({ from: "/share/$token" });
  const [state, setState] = useState<
    { doc: BusinessDocument; profile: BusinessProfile; userId: string } | null | "loading" | "missing"
  >("loading");
  const [signing, setSigning] = useState(false);
  const [signerName, setSignerName] = useState("");

  useEffect(() => {
    async function load() {
      const found = await findDocByShareToken(token);
      if (!found) { setState("missing"); return; }
      const profile = await readProfileFor(found.userId);
      if (!profile) { setState("missing"); return; }
      setState({ doc: found.doc, profile, userId: found.userId });
    }
    load();
  }, [token]);

  if (state === "loading") {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (state === "missing" || !state) {
    return (
      <div className="min-h-screen grid place-items-center bg-background px-4">
        <div className="text-center">
          <h1 className="text-xl font-bold">Document not found</h1>
          <p className="text-sm text-muted-foreground mt-1">
            This link may be expired or invalid.
          </p>
        </div>
      </div>
    );
  }

  const { doc, profile, userId } = state;
  const totals = computeTotals(doc);

  const accept = async () => {
    if (!signerName.trim()) return;
    const updated: BusinessDocument = {
      ...doc,
      status: "accepted",
      signature: {
        dataUrl: "",
        fullName: signerName.trim(),
        date: new Date().toISOString(),
      },
    };
    await updateDocFor(userId, updated);
    setState({ ...state, doc: updated });
    setSigning(false);
  };

  const decline = async () => {
    const updated: BusinessDocument = { ...doc, status: "declined" };
    await updateDocFor(userId, updated);
    setState({ ...state, doc: updated });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="px-4 py-5 flex items-center gap-3 bg-primary text-primary-foreground">
        <Logo className="h-9 w-9" />
        <div className="min-w-0">
          <p className="font-bold truncate">{profile.businessName}</p>
          <p className="text-xs opacity-90 truncate">
            {doc.type === "invoice" ? "Invoice" : "Quotation"} {doc.number}
          </p>
        </div>
      </header>

      <div className="max-w-md mx-auto p-4 space-y-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Total</p>
          <p className="money text-3xl mt-1">{formatMoney(totals.total, doc.currency)}</p>
          <p className="text-xs text-muted-foreground mt-1">Date: {formatDate(doc.date)}</p>
          {doc.dueDate && (
            <p className="text-xs text-muted-foreground">Due: {formatDate(doc.dueDate)}</p>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card divide-y divide-border">
          {doc.items.map((it) => (
            <div key={it.id} className="p-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">{it.description}</p>
                <p className="text-xs text-muted-foreground">
                  {it.quantity} × {formatMoney(it.unitPrice, doc.currency)}
                </p>
              </div>
              <span className="money text-sm">
                {formatMoney(it.quantity * it.unitPrice, doc.currency)}
              </span>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border bg-card p-4 space-y-1.5 text-sm">
          <Row label="Subtotal">{formatMoney(totals.subtotal, doc.currency)}</Row>
          {doc.vatEnabled && (
            <Row label="VAT (15%)">{formatMoney(totals.vat, doc.currency)}</Row>
          )}
          <div className="border-t border-border pt-2 mt-1">
            <Row label={<span className="font-semibold">Total</span>}>
              {formatMoney(totals.total, doc.currency)}
            </Row>
          </div>
        </div>

        {(profile.bankName || profile.ecocash || profile.innbucks) && (
          <div className="rounded-xl border border-border bg-card p-4 text-sm space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
              How to pay
            </p>
            {profile.bankName && (
              <p>
                {profile.bankName} · {profile.bankAccountName ?? ""} ·{" "}
                {profile.bankAccountNumber ?? ""}
              </p>
            )}
            {profile.ecocash && <p>EcoCash: {profile.ecocash}</p>}
            {profile.innbucks && <p>InnBucks: {profile.innbucks}</p>}
            <p className="text-xs text-muted-foreground mt-2">
              Reference: <strong>{doc.number}</strong>
            </p>
          </div>
        )}

        {doc.type === "quote" &&
          doc.status !== "accepted" &&
          doc.status !== "declined" && (
            <div className="space-y-2 pt-2">
              {!signing ? (
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={() => setSigning(true)} className="h-12 gap-2">
                    <Check className="h-4 w-4" /> Accept
                  </Button>
                  <Button onClick={decline} variant="outline" className="h-12 gap-2">
                    <X className="h-4 w-4" /> Decline
                  </Button>
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-card p-3 space-y-2">
                  <p className="text-sm font-medium">Type your full name to accept</p>
                  <Input
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    placeholder="Your full name"
                  />
                  <Button
                    onClick={accept}
                    disabled={!signerName.trim()}
                    className="w-full h-11"
                  >
                    Confirm acceptance
                  </Button>
                </div>
              )}
            </div>
          )}

        {doc.status === "accepted" && (
          <div className="rounded-xl border border-success bg-success/10 p-3 text-sm text-center text-success font-medium">
            Accepted by {doc.signature?.fullName} on{" "}
            {doc.signature ? formatDate(doc.signature.date) : ""}
          </div>
        )}
        {doc.status === "declined" && (
          <div className="rounded-xl border border-destructive bg-destructive/10 p-3 text-sm text-center text-destructive font-medium">
            Declined
          </div>
        )}

        <p className="text-center text-[10px] text-muted-foreground py-6">
          Powered by GetPaid
        </p>
      </div>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="money">{children}</span>
    </div>
  );
}
