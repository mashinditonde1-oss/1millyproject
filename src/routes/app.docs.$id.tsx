import { createFileRoute, useNavigate, useParams, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useClients, useDocs, useProfile, uid } from "@/lib/store";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { Money } from "@/components/Money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { computeTotals } from "@/lib/calc";
import { downloadPdf } from "@/lib/pdf";
import { formatMoney, formatDate, whatsappLink } from "@/lib/format";
import type { PaymentRecord } from "@/lib/types";
import { Loader2, Download, MessageCircle, Check, FileText, ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/docs/$id")({
  component: DocView,
});

function DocView() {
  const { id } = useParams({ from: "/app/docs/$id" });
  const { user, loading } = useAuth();
  const [profile] = useProfile(user?.id ?? null);
  const { docs, upsert, softDelete } = useDocs(user?.id ?? null);
  const { clients } = useClients(user?.id ?? null);
  const nav = useNavigate();

  const doc = docs.find((d) => d.id === id);
  const client = doc ? clients.find((c) => c.id === doc.clientId) : null;
  const totals = doc ? computeTotals(doc) : null;

  const [payOpen, setPayOpen] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState<PaymentRecord["method"]>("EcoCash");

  useEffect(() => {
    if (!loading && !user) nav({ to: "/" });
  }, [user, loading, nav]);

  if (loading || !user || !profile) {
    return <div className="min-h-screen grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }
  if (!doc || !client || !totals) {
    return (
      <AppShell>
        <div className="p-6 text-center">
          <p className="text-sm text-muted-foreground">Document not found.</p>
          <Link to="/app/docs"><Button variant="outline" className="mt-4">Back to documents</Button></Link>
        </div>
      </AppShell>
    );
  }

  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/share/${doc.shareToken}`;
  const waMessage = `Hello ${client.fullName}, please find your ${doc.type} ${doc.number} from ${profile.businessName}.\n\nTotal: ${formatMoney(totals.total, doc.currency)}\n\nView & sign: ${shareUrl}`;

  const recordPayment = () => {
    const amt = Number(payAmount);
    if (!amt || amt <= 0) { toast.error("Enter a valid amount"); return; }
    const payments = [...doc.payments, { id: uid(), amount: amt, method: payMethod, date: new Date().toISOString() }];
    const newPaid = payments.reduce((s, p) => s + p.amount, 0);
    const status = newPaid >= totals.total ? "paid" : "partially_paid";
    upsert({ ...doc, payments, status });
    setPayOpen(false);
    setPayAmount("");
    toast.success("Payment recorded");
  };

  const convertToInvoice = () => {
    const inv = {
      ...doc,
      id: uid(),
      type: "invoice" as const,
      number: doc.number.replace(/^[A-Z]+/, "INV"),
      status: "sent" as const,
      payments: [],
      shareToken: uid() + uid(),
      linkedInvoiceId: undefined,
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    upsert(inv);
    upsert({ ...doc, linkedInvoiceId: inv.id });
    toast.success("Quote converted to invoice");
    nav({ to: "/app/docs/$id", params: { id: inv.id } });
  };

  const remove = () => {
    if (!confirm("Move this document to trash?")) return;
    softDelete(doc.id);
    toast.success("Moved to trash");
    nav({ to: "/app/docs" });
  };

  return (
    <AppShell>
      <div className="px-4 pt-4">
        <Link to="/app/docs" className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Back</Link>
      </div>
      <PageHeader
        title={`${doc.type === "invoice" ? "Invoice" : doc.type === "quote" ? "Quote" : "Proforma"} ${doc.number}`}
        subtitle={`${client.companyName || client.fullName} · ${formatDate(doc.date)}`}
      />
      <div className="px-4 space-y-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Total</p>
          <Money amount={totals.total} currency={doc.currency} className="text-3xl block mt-1" />
          {totals.paid > 0 && <p className="text-sm text-success mt-1">Paid: <Money amount={totals.paid} currency={doc.currency} /></p>}
          {doc.type === "invoice" && totals.balance > 0 && (
            <p className="text-sm text-warning mt-1">Outstanding: <Money amount={totals.balance} currency={doc.currency} /></p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <a href={whatsappLink(client.whatsapp, waMessage)} target="_blank" rel="noreferrer">
            <Button className="w-full h-11 gap-2"><MessageCircle className="h-4 w-4" /> Send on WhatsApp</Button>
          </a>
          <Button variant="outline" className="h-11 gap-2" onClick={() => downloadPdf(doc, profile, client)}>
            <Download className="h-4 w-4" /> PDF
          </Button>
        </div>

        {doc.type === "invoice" && totals.balance > 0 && (
          <Button variant="outline" className="w-full h-11 gap-2" onClick={() => setPayOpen(true)}>
            <Check className="h-4 w-4" /> Record payment
          </Button>
        )}
        {doc.type === "quote" && !doc.linkedInvoiceId && (
          <Button variant="outline" className="w-full h-11 gap-2" onClick={convertToInvoice}>
            <FileText className="h-4 w-4" /> Convert to invoice
          </Button>
        )}

        <div className="rounded-xl border border-border bg-card divide-y divide-border">
          {doc.items.map((it) => (
            <div key={it.id} className="p-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">{it.description}</p>
                <p className="text-xs text-muted-foreground">{it.quantity} × {formatMoney(it.unitPrice, doc.currency)}</p>
              </div>
              <Money amount={it.quantity * it.unitPrice} currency={doc.currency} className="text-sm" />
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border bg-card p-4 space-y-1.5 text-sm">
          <Row label="Subtotal"><Money amount={totals.subtotal} currency={doc.currency} /></Row>
          {doc.vatEnabled && <Row label="VAT (15%)"><Money amount={totals.vat} currency={doc.currency} /></Row>}
          <div className="border-t border-border pt-2 mt-1">
            <Row label={<span className="font-semibold">Total</span>}><Money amount={totals.total} currency={doc.currency} /></Row>
          </div>
        </div>

        {doc.payments.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payments</p>
            {doc.payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span>{formatDate(p.date)} · {p.method}</span>
                <Money amount={p.amount} currency={doc.currency} />
              </div>
            ))}
          </div>
        )}

        <Button variant="ghost" className="w-full text-destructive gap-2" onClick={remove}><Trash2 className="h-4 w-4" /> Delete</Button>
      </div>

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Record payment</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Amount ({doc.currency})</Label>
              <Input type="number" inputMode="decimal" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder={String(totals.balance.toFixed(2))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Method</Label>
              <Select value={payMethod} onValueChange={(v) => setPayMethod(v as PaymentRecord["method"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="EcoCash">EcoCash</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Swipe Card">Swipe Card</SelectItem>
                  <SelectItem value="InnBucks">InnBucks</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={recordPayment} className="w-full h-11">Save payment</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function Row({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return <div className="flex items-center justify-between"><span className="text-muted-foreground">{label}</span><span>{children}</span></div>;
}
