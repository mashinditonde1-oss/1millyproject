import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useClients, useDocs, useProfile, uid, nextDocNumber } from "@/lib/store";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { Money } from "@/components/Money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { computeTotals } from "@/lib/calc";
import { canCreateDoc, FREE_DOC_LIMIT } from "@/lib/freemium";
import type { BusinessDocument, Currency, DocType, LineItem } from "@/lib/types";
import { SUGGESTED_LINE_ITEMS } from "@/lib/types";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/docs/new")({
  component: NewDoc,
});

function todayIso() { return new Date().toISOString().slice(0, 10); }
function plusDays(n: number) { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }

function NewDoc() {
  const { user, loading } = useAuth();
  const [profile] = useProfile(user?.id ?? null);
  const { docs, upsert } = useDocs(user?.id ?? null);
  const { clients } = useClients(user?.id ?? null);
  const nav = useNavigate();

  const [type, setType] = useState<DocType>("quote");
  const [clientId, setClientId] = useState<string>("");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [date, setDate] = useState(todayIso());
  const [dueDate, setDueDate] = useState(plusDays(14));
  const [vatEnabled, setVatEnabled] = useState(false);
  const [items, setItems] = useState<LineItem[]>([{ id: uid(), description: "", quantity: 1, unitPrice: 0 }]);
  const [notes, setNotes] = useState("");
  const [poNumber, setPoNumber] = useState("");

  useEffect(() => {
    if (!loading && !user) nav({ to: "/" });
    if (user && !profile) nav({ to: "/app/onboarding" });
    if (profile) {
      setCurrency(profile.primaryCurrency);
      setVatEnabled(profile.vatDefault);
      setNotes(profile.defaultPaymentTerms);
    }
  }, [user, loading, profile, nav]);

  const totals = useMemo(
    () => computeTotals({ items, vatEnabled, currency } as BusinessDocument),
    [items, vatEnabled, currency],
  );

  if (loading || !user || !profile) {
    return <div className="min-h-screen grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const suggestions = SUGGESTED_LINE_ITEMS[profile.businessType] ?? [];

  const addItem = () => setItems([...items, { id: uid(), description: "", quantity: 1, unitPrice: 0 }]);
  const updateItem = (id: string, patch: Partial<LineItem>) =>
    setItems(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  const removeItem = (id: string) => setItems(items.length > 1 ? items.filter((i) => i.id !== id) : items);

  const save = (status: "draft" | "sent") => {
    if (!canCreateDoc(profile, docs)) {
      toast.error(`Free plan limit: ${FREE_DOC_LIMIT} documents per month.`);
      return;
    }
    if (!clientId) { toast.error("Choose a client"); return; }
    if (items.every((i) => !i.description.trim())) { toast.error("Add at least one item"); return; }
    const now = new Date().toISOString();
    const doc: BusinessDocument = {
      id: uid(),
      type,
      number: nextDocNumber(docs, type),
      clientId,
      date,
      dueDate: type === "invoice" ? dueDate : undefined,
      expiryDate: type === "quote" ? plusDays(30) : undefined,
      poNumber: poNumber.trim() || undefined,
      currency,
      items: items.filter((i) => i.description.trim()),
      vatEnabled,
      notes: notes.trim() || undefined,
      status,
      payments: [],
      shareToken: uid() + uid(),
      createdAt: now,
      updatedAt: now,
    };
    upsert(doc);
    toast.success(`${type === "invoice" ? "Invoice" : "Quote"} created`);
    nav({ to: "/app/docs/$id", params: { id: doc.id } });
  };

  return (
    <AppShell>
      <PageHeader title="New document" subtitle="Quote or invoice" />
      <div className="px-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type">
            <Select value={type} onValueChange={(v) => setType(v as DocType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="quote">Quotation</SelectItem>
                <SelectItem value="proforma">Proforma</SelectItem>
                <SelectItem value="invoice">Invoice</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Currency">
            <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="ZiG">ZiG</SelectItem>
                <SelectItem value="ZAR">ZAR</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Field label="Client">
          {clients.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-3 text-center text-sm">
              <p className="text-muted-foreground">No clients yet.</p>
              <Button type="button" variant="link" className="h-auto p-0" onClick={() => nav({ to: "/app/clients" })}>Add a client first</Button>
            </div>
          ) : (
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger><SelectValue placeholder="Choose a client" /></SelectTrigger>
              <SelectContent>
                {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.companyName || c.fullName}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          {type === "invoice" && <Field label="Due date"><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></Field>}
          {type === "invoice" && <Field label="PO number (optional)"><Input value={poNumber} onChange={(e) => setPoNumber(e.target.value)} /></Field>}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Items</Label>
            <Button type="button" size="sm" variant="outline" onClick={addItem} className="h-8 gap-1"><Plus className="h-3.5 w-3.5" /> Add</Button>
          </div>
          {items.map((it, idx) => (
            <div key={it.id} className="rounded-lg border border-border p-3 space-y-2 bg-card">
              <div className="flex items-start gap-2">
                <Input
                  list={`sugg-${idx}`}
                  placeholder="Description"
                  value={it.description}
                  onChange={(e) => updateItem(it.id, { description: e.target.value })}
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(it.id)} className="h-9 w-9 shrink-0"><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
              {suggestions.length > 0 && (
                <datalist id={`sugg-${idx}`}>{suggestions.map((s) => <option key={s} value={s} />)}</datalist>
              )}
              <div className="grid grid-cols-3 gap-2">
                <Field label="Qty">
                  <Input type="number" inputMode="decimal" value={it.quantity} onChange={(e) => updateItem(it.id, { quantity: Number(e.target.value) })} />
                </Field>
                <Field label="Unit price">
                  <Input type="number" inputMode="decimal" value={it.unitPrice} onChange={(e) => updateItem(it.id, { unitPrice: Number(e.target.value) })} />
                </Field>
                <div className="space-y-1.5">
                  <Label className="text-sm">Total</Label>
                  <div className="h-9 flex items-center"><Money amount={(Number(it.quantity) || 0) * (Number(it.unitPrice) || 0)} currency={currency} /></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border p-3 bg-card">
          <div>
            <p className="text-sm font-medium">Charge VAT (15%)</p>
          </div>
          <Switch checked={vatEnabled} onCheckedChange={setVatEnabled} />
        </div>

        <Field label="Notes / terms"><Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>

        <div className="rounded-xl border border-border p-4 bg-card space-y-1.5">
          <Row label="Subtotal"><Money amount={totals.subtotal} currency={currency} /></Row>
          {vatEnabled && <Row label="VAT (15%)"><Money amount={totals.vat} currency={currency} /></Row>}
          <div className="border-t border-border pt-2 mt-1">
            <Row label={<span className="font-semibold">Total</span>}><Money amount={totals.total} currency={currency} big /></Row>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 h-11" onClick={() => save("draft")}>Save draft</Button>
          <Button className="flex-1 h-11" onClick={() => save("sent")}>Save & send</Button>
        </div>
      </div>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-sm">{label}</Label>{children}</div>;
}
function Row({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">{label}</span><span>{children}</span></div>;
}
