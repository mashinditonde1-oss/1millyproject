import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useProfile } from "@/lib/store";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user, loading, signOut } = useAuth();
  const [profile, setProfile] = useProfile(user?.id ?? null);
  const nav = useNavigate();

  useEffect(() => {
    if (!loading && !user) nav({ to: "/" });
    if (user && !profile) nav({ to: "/app/onboarding" });
  }, [user, loading, profile, nav]);

  const [businessName, setBusinessName] = useState(profile?.businessName ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [address, setAddress] = useState(profile?.address ?? "");
  const [bankName, setBankName] = useState(profile?.bankName ?? "");
  const [bankAccountNumber, setBankAccountNumber] = useState(profile?.bankAccountNumber ?? "");
  const [bankAccountName, setBankAccountName] = useState(profile?.bankAccountName ?? "");
  const [ecocash, setEcocash] = useState(profile?.ecocash ?? "");
  const [innbucks, setInnbucks] = useState(profile?.innbucks ?? "");
  const [vatDefault, setVatDefault] = useState(profile?.vatDefault ?? false);
  const [footerMessage, setFooterMessage] = useState(profile?.footerMessage ?? "");

  useEffect(() => {
    if (profile) {
      setBusinessName(profile.businessName);
      setPhone(profile.phone ?? "");
      setAddress(profile.address ?? "");
      setBankName(profile.bankName ?? "");
      setBankAccountNumber(profile.bankAccountNumber ?? "");
      setBankAccountName(profile.bankAccountName ?? "");
      setEcocash(profile.ecocash ?? "");
      setInnbucks(profile.innbucks ?? "");
      setVatDefault(profile.vatDefault);
      setFooterMessage(profile.footerMessage ?? "");
    }
  }, [profile]);

  if (loading || !user || !profile) {
    return <div className="min-h-screen grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    setProfile({
      ...profile,
      businessName: businessName.trim(),
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      bankName: bankName.trim() || undefined,
      bankAccountNumber: bankAccountNumber.trim() || undefined,
      bankAccountName: bankAccountName.trim() || undefined,
      ecocash: ecocash.trim() || undefined,
      innbucks: innbucks.trim() || undefined,
      vatDefault,
      footerMessage: footerMessage.trim() || undefined,
    });
    toast.success("Settings saved");
  };

  return (
    <AppShell>
      <PageHeader title="Settings" subtitle={profile.businessName} />
      <form onSubmit={save} className="px-4 space-y-4">
        <Section title="Business">
          <Field label="Business name"><Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} /></Field>
          <Field label="Phone / WhatsApp"><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
          <Field label="Address"><Textarea rows={2} value={address} onChange={(e) => setAddress(e.target.value)} /></Field>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium">Charge VAT (15%) by default</p>
              <p className="text-xs text-muted-foreground">Override per document</p>
            </div>
            <Switch checked={vatDefault} onCheckedChange={setVatDefault} />
          </div>
        </Section>
        <Section title="Payment details">
          <Field label="Bank name"><Input value={bankName} onChange={(e) => setBankName(e.target.value)} /></Field>
          <Field label="Account name"><Input value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} /></Field>
          <Field label="Account number"><Input value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} /></Field>
          <Field label="EcoCash"><Input value={ecocash} onChange={(e) => setEcocash(e.target.value)} /></Field>
          <Field label="InnBucks"><Input value={innbucks} onChange={(e) => setInnbucks(e.target.value)} /></Field>
        </Section>
        <Section title="Document footer">
          <Field label="Thank-you / footer message"><Textarea rows={2} value={footerMessage} onChange={(e) => setFooterMessage(e.target.value)} placeholder="Thank you for your business!" /></Field>
        </Section>
        <Button type="submit" className="w-full h-11">Save settings</Button>
        <Button type="button" variant="outline" className="w-full" onClick={() => signOut()}>Sign out</Button>
      </form>
    </AppShell>
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
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-sm">{label}</Label>{children}</div>;
}
