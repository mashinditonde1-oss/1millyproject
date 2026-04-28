import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useClients, useProfile, uid } from "@/lib/store";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { canAddClient, FREE_CLIENT_LIMIT, isPro } from "@/lib/freemium";
import { whatsappLink } from "@/lib/format";
import type { Client } from "@/lib/types";
import { Plus, MessageCircle, Mail, MapPin, Loader2, UserRound } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/clients")({
  component: ClientsPage,
});

function ClientsPage() {
  const { user, loading } = useAuth();
  const [profile] = useProfile(user?.id ?? null);
  const { clients, upsert } = useClients(user?.id ?? null);
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/" });
    if (user && !profile) nav({ to: "/app/onboarding" });
  }, [user, loading, profile, nav]);

  if (loading || !user || !profile) {
    return <div className="min-h-screen grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const startNew = () => {
    if (!canAddClient(profile, clients)) {
      toast.error(`Free plan limit: ${FREE_CLIENT_LIMIT} clients. Upgrade for unlimited.`);
      return;
    }
    setEditing(null);
    setOpen(true);
  };

  return (
    <AppShell>
      <PageHeader
        title="Clients"
        subtitle={isPro(profile) ? "Unlimited" : `${clients.length} of ${FREE_CLIENT_LIMIT} on free plan`}
        action={<Button onClick={startNew} size="sm" className="gap-1"><Plus className="h-4 w-4" /> Add</Button>}
      />
      <div className="px-4 space-y-2">
        {clients.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <UserRound className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">No clients yet</p>
            <p className="text-xs text-muted-foreground mt-1">Add your first client to start sending quotes and invoices.</p>
            <Button onClick={startNew} className="mt-4">Add your first client</Button>
          </div>
        )}
        {clients.map((c) => (
          <div key={c.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold truncate">{c.companyName || c.fullName}</p>
                {c.companyName && <p className="text-xs text-muted-foreground truncate">{c.fullName}</p>}
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {c.whatsapp && <div className="flex items-center gap-1.5"><MessageCircle className="h-3.5 w-3.5" /> {c.whatsapp}</div>}
                  {c.email && <div className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {c.email}</div>}
                  {c.address && <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {c.address}</div>}
                </div>
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                {c.whatsapp && (
                  <a href={whatsappLink(c.whatsapp, `Hello ${c.fullName}`)} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="outline" className="h-8 gap-1"><MessageCircle className="h-3.5 w-3.5" /> Chat</Button>
                  </a>
                )}
                <Button size="sm" variant="ghost" className="h-8" onClick={() => { setEditing(c); setOpen(true); }}>Edit</Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild><span className="hidden" /></DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit client" : "New client"}</DialogTitle></DialogHeader>
          <ClientForm
            initial={editing}
            onSubmit={(c) => { upsert(c); setOpen(false); toast.success(editing ? "Client updated" : "Client added"); }}
          />
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function ClientForm({ initial, onSubmit }: { initial: Client | null; onSubmit: (c: Client) => void }) {
  const [fullName, setFullName] = useState(initial?.fullName ?? "");
  const [companyName, setCompanyName] = useState(initial?.companyName ?? "");
  const [whatsapp, setWhatsapp] = useState(initial?.whatsapp ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !whatsapp.trim()) { toast.error("Name and WhatsApp are required"); return; }
    onSubmit({
      id: initial?.id ?? uid(),
      fullName: fullName.trim(),
      companyName: companyName.trim() || undefined,
      whatsapp: whatsapp.trim(),
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      notes: notes.trim() || undefined,
      deletedAt: null,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
    });
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="space-y-1.5"><Label>Full name *</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} required /></div>
      <div className="space-y-1.5"><Label>Company (optional)</Label><Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} /></div>
      <div className="space-y-1.5"><Label>WhatsApp *</Label><Input type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="0772 ..." required /></div>
      <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      <div className="space-y-1.5"><Label>Address</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} /></div>
      <div className="space-y-1.5"><Label>Notes</Label><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
      <Button type="submit" className="w-full h-11">{initial ? "Save changes" : "Add client"}</Button>
    </form>
  );
}
