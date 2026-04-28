import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useProfile } from "@/lib/store";
import { BUSINESS_TYPES, type BusinessProfile, type Currency } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Logo } from "@/components/Logo";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/onboarding")({
  component: Onboarding,
});

function Onboarding() {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useProfile(user?.id ?? null);
  const nav = useNavigate();

  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState<string>("General and Other");
  const [phone, setPhone] = useState("");
  const [primaryCurrency, setPrimaryCurrency] = useState<Currency>("USD");
  const [vatDefault, setVatDefault] = useState(false);
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [ecocash, setEcocash] = useState("");

  useEffect(() => {
    if (!loading && !user) nav({ to: "/" });
    if (profile) nav({ to: "/app" });
  }, [user, loading, profile, nav]);

  if (loading || !user) {
    return <div className="min-h-screen grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim()) { toast.error("Business name is required"); return; }
    const p: BusinessProfile = {
      id: user.id,
      businessName: businessName.trim(),
      businessType,
      phone: phone.trim() || undefined,
      email: user.email ?? undefined,
      primaryCurrency,
      vatDefault,
      defaultPaymentTerms: "Payment due within 14 days.",
      brandColor: "#1e5f3a",
      plan: "free",
      referralCode: user.id.slice(0, 8).toUpperCase(),
      bankName: bankName.trim() || undefined,
      bankAccountNumber: bankAccountNumber.trim() || undefined,
      ecocash: ecocash.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    setProfile(p);
    toast.success("You're all set!");
    nav({ to: "/app" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="px-4 py-6 flex items-center gap-3 border-b border-border">
        <Logo className="h-9 w-9" />
        <div>
          <h1 className="text-lg font-bold">Welcome to GetPaid</h1>
          <p className="text-xs text-muted-foreground">Tell us about your business</p>
        </div>
      </header>
      <form onSubmit={submit} className="max-w-md mx-auto p-4 space-y-5">
        <Field label="Business name *">
          <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g. Tendai Welding Services" required />
        </Field>
        <Field label="What do you do?">
          <Select value={businessType} onValueChange={setBusinessType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {BUSINESS_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="WhatsApp number">
          <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0772 123 456" />
        </Field>
        <Field label="Primary currency">
          <Select value={primaryCurrency} onValueChange={(v) => setPrimaryCurrency(v as Currency)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD — United States Dollar</SelectItem>
              <SelectItem value="ZiG">ZiG — Zimbabwe Gold</SelectItem>
              <SelectItem value="ZAR">ZAR — South African Rand</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <div className="flex items-center justify-between rounded-xl border border-border p-4">
          <div>
            <p className="text-sm font-medium">Charge VAT (15%) by default</p>
            <p className="text-xs text-muted-foreground">You can override per document</p>
          </div>
          <Switch checked={vatDefault} onCheckedChange={setVatDefault} />
        </div>
        <div className="space-y-3 pt-3 border-t border-border">
          <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">Payment details (optional)</p>
          <Field label="Bank name"><Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g. CABS" /></Field>
          <Field label="Account number"><Input value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} /></Field>
          <Field label="EcoCash number"><Input value={ecocash} onChange={(e) => setEcocash(e.target.value)} placeholder="0772 ..." /></Field>
        </div>
        <Button type="submit" className="w-full h-12 text-base">Get started</Button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  );
}
