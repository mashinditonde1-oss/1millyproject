import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";
import type { BusinessProfile, Client, BusinessDocument, DocType } from "./types";

// ── uid & helpers ─────────────────────────────────────────────────────────────

export function uid(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function nextDocNumber(docs: BusinessDocument[], type: DocType): string {
  const prefix = { quote: "QUO", proforma: "PRO", invoice: "INV", credit_note: "CN" }[type];
  const year = new Date().getFullYear();
  const same = docs.filter((d) => d.type === type);
  return `${prefix}-${year}-${String(same.length + 1).padStart(4, "0")}`;
}

// ── mappers: DB row <-> TypeScript types ──────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function profileFromDb(r: any): BusinessProfile {
  return {
    id: r.id,
    businessName: r.business_name,
    businessType: r.business_type,
    logoDataUrl: r.logo_url ?? undefined,
    phone: r.phone ?? undefined,
    email: r.email ?? undefined,
    address: r.address ?? undefined,
    vatNumber: r.zimra_vat_number ?? undefined,
    poBox: r.po_box ?? undefined,
    bankName: r.bank_name ?? undefined,
    bankAccountName: r.bank_account_name ?? undefined,
    bankAccountNumber: r.bank_account_number ?? undefined,
    bankBranchCode: r.branch_code ?? undefined,
    ecocash: r.ecocash ?? undefined,
    innbucks: r.innbucks ?? undefined,
    primaryCurrency: r.primary_currency,
    vatDefault: r.vat_default,
    defaultPaymentTerms: r.default_payment_terms,
    tagline: r.tagline ?? undefined,
    footerMessage: r.footer_message ?? undefined,
    brandColor: r.brand_color,
    plan: r.plan,
    referralCode: r.referral_code,
    createdAt: r.created_at,
  };
}

function profileToDb(p: BusinessProfile) {
  return {
    id: p.id,
    business_name: p.businessName,
    business_type: p.businessType,
    logo_url: p.logoDataUrl ?? null,
    phone: p.phone ?? null,
    email: p.email ?? null,
    address: p.address ?? null,
    zimra_vat_number: p.vatNumber ?? null,
    po_box: p.poBox ?? null,
    bank_name: p.bankName ?? null,
    bank_account_name: p.bankAccountName ?? null,
    bank_account_number: p.bankAccountNumber ?? null,
    branch_code: p.bankBranchCode ?? null,
    ecocash: p.ecocash ?? null,
    innbucks: p.innbucks ?? null,
    primary_currency: p.primaryCurrency,
    vat_default: p.vatDefault,
    default_payment_terms: p.defaultPaymentTerms,
    tagline: p.tagline ?? null,
    footer_message: p.footerMessage ?? null,
    brand_color: p.brandColor,
    plan: p.plan,
    referral_code: p.referralCode,
    created_at: p.createdAt,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function clientFromDb(r: any): Client {
  return {
    id: r.id,
    fullName: r.full_name,
    companyName: r.company_name ?? undefined,
    whatsapp: r.whatsapp_number,
    email: r.email ?? undefined,
    address: r.address ?? undefined,
    poBox: r.po_box ?? undefined,
    creditLimit: r.credit_limit ?? undefined,
    notes: r.internal_notes ?? undefined,
    paymentPreference: r.payment_preference ?? undefined,
    deletedAt: r.deleted_at ?? undefined,
    createdAt: r.created_at,
  };
}

function clientToDb(c: Client, userId: string) {
  return {
    id: c.id,
    user_id: userId,
    full_name: c.fullName,
    company_name: c.companyName ?? null,
    whatsapp_number: c.whatsapp,
    email: c.email ?? null,
    address: c.address ?? null,
    po_box: c.poBox ?? null,
    credit_limit: c.creditLimit ?? null,
    internal_notes: c.notes ?? null,
    payment_preference: c.paymentPreference ?? null,
    deleted_at: c.deletedAt ?? null,
    created_at: c.createdAt,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function docFromDb(r: any): BusinessDocument {
  return {
    id: r.id,
    type: r.type,
    number: r.number,
    clientId: r.client_id,
    date: r.date,
    dueDate: r.due_date ?? undefined,
    expiryDate: r.expiry_date ?? undefined,
    poNumber: r.po_number ?? undefined,
    currency: r.currency,
    exchangeRate: r.exchange_rate ?? undefined,
    rateOverridden: r.rate_overridden ?? undefined,
    items: r.items ?? [],
    vatEnabled: r.vat_enabled,
    discountType: r.discount_type ?? undefined,
    discountValue: r.discount_value ?? undefined,
    depositRequired: r.deposit_required ?? undefined,
    notes: r.notes ?? undefined,
    status: r.status,
    payments: r.payments ?? [],
    signature: r.signature ?? undefined,
    declineReason: r.decline_reason ?? undefined,
    linkedInvoiceId: r.linked_invoice_id ?? undefined,
    shareToken: r.share_token,
    deletedAt: r.deleted_at ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function docToDb(d: BusinessDocument, userId: string) {
  return {
    id: d.id,
    user_id: userId,
    type: d.type,
    number: d.number,
    client_id: d.clientId,
    date: d.date,
    due_date: d.dueDate ?? null,
    expiry_date: d.expiryDate ?? null,
    po_number: d.poNumber ?? null,
    currency: d.currency,
    exchange_rate: d.exchangeRate ?? null,
    rate_overridden: d.rateOverridden ?? null,
    items: d.items,
    vat_enabled: d.vatEnabled,
    discount_type: d.discountType ?? null,
    discount_value: d.discountValue ?? null,
    deposit_required: d.depositRequired ?? null,
    notes: d.notes ?? null,
    status: d.status,
    payments: d.payments,
    signature: d.signature ?? null,
    decline_reason: d.declineReason ?? null,
    linked_invoice_id: d.linkedInvoiceId ?? null,
    share_token: d.shareToken,
    deleted_at: d.deletedAt ?? null,
    created_at: d.createdAt,
    updated_at: new Date().toISOString(),
  };
}

// ── useProfile ────────────────────────────────────────────────────────────────

export function useProfile(userId: string | null) {
  const [profile, setProfileState] = useState<BusinessProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setProfileLoading(false);
      return;
    }
    setProfileLoading(true);
    supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        setProfileState(data ? profileFromDb(data) : null);
        setProfileLoading(false);
      });
  }, [userId]);

  const setProfile = useCallback(async (p: BusinessProfile) => {
    setProfileState(p);
    await supabase.from("profiles").upsert(profileToDb(p));
  }, []);

  return [profile, setProfile, profileLoading] as const;
}

// ── useClients ────────────────────────────────────────────────────────────────

export function useClients(userId: string | null) {
  const [all, setAll] = useState<Client[]>([]);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("clients")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .then(({ data }) => setAll((data ?? []).map(clientFromDb)));
  }, [userId]);

  const upsert = useCallback(async (c: Client) => {
    if (!userId) return;
    setAll((prev) => {
      const idx = prev.findIndex((x) => x.id === c.id);
      const next = [...prev];
      if (idx >= 0) next[idx] = c;
      else next.unshift(c);
      return next;
    });
    await supabase.from("clients").upsert(clientToDb(c, userId));
  }, [userId]);

  const softDelete = useCallback(async (id: string) => {
    if (!userId) return;
    const deletedAt = new Date().toISOString();
    setAll((prev) => prev.map((c) => (c.id === id ? { ...c, deletedAt } : c)));
    await supabase.from("clients").update({ deleted_at: deletedAt }).eq("id", id).eq("user_id", userId);
  }, [userId]);

  const restore = useCallback(async (id: string) => {
    if (!userId) return;
    setAll((prev) => prev.map((c) => (c.id === id ? { ...c, deletedAt: undefined } : c)));
    await supabase.from("clients").update({ deleted_at: null }).eq("id", id).eq("user_id", userId);
  }, [userId]);

  const purge = useCallback(async (id: string) => {
    if (!userId) return;
    setAll((prev) => prev.filter((c) => c.id !== id));
    await supabase.from("clients").delete().eq("id", id).eq("user_id", userId);
  }, [userId]);

  return {
    clients: all.filter((c) => !c.deletedAt),
    trashed: all.filter((c) => c.deletedAt),
    all,
    upsert,
    softDelete,
    restore,
    purge,
  };
}

// ── useDocs ───────────────────────────────────────────────────────────────────

export function useDocs(userId: string | null) {
  const [all, setAll] = useState<BusinessDocument[]>([]);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("documents")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .then(({ data }) => setAll((data ?? []).map(docFromDb)));
  }, [userId]);

  const upsert = useCallback(async (d: BusinessDocument) => {
    if (!userId) return;
    const updated = { ...d, updatedAt: new Date().toISOString() };
    setAll((prev) => {
      const idx = prev.findIndex((x) => x.id === d.id);
      const next = [...prev];
      if (idx >= 0) next[idx] = updated;
      else next.unshift(updated);
      return next;
    });
    await supabase.from("documents").upsert(docToDb(updated, userId));
  }, [userId]);

  const softDelete = useCallback(async (id: string) => {
    if (!userId) return;
    const deletedAt = new Date().toISOString();
    setAll((prev) => prev.map((d) => (d.id === id ? { ...d, deletedAt } : d)));
    await supabase.from("documents").update({ deleted_at: deletedAt }).eq("id", id).eq("user_id", userId);
  }, [userId]);

  const restore = useCallback(async (id: string) => {
    if (!userId) return;
    setAll((prev) => prev.map((d) => (d.id === id ? { ...d, deletedAt: undefined } : d)));
    await supabase.from("documents").update({ deleted_at: null }).eq("id", id).eq("user_id", userId);
  }, [userId]);

  const purge = useCallback(async (id: string) => {
    if (!userId) return;
    setAll((prev) => prev.filter((d) => d.id !== id));
    await supabase.from("documents").delete().eq("id", id).eq("user_id", userId);
  }, [userId]);

  return {
    docs: all.filter((d) => !d.deletedAt),
    all,
    upsert,
    softDelete,
    restore,
    purge,
  };
}

// ── Public share-token lookup (works for unauthenticated clients) ──────────────

export async function findDocByShareToken(
  token: string,
): Promise<{ doc: BusinessDocument; userId: string } | null> {
  const { data } = await supabase
    .from("documents")
    .select("*")
    .eq("share_token", token)
    .maybeSingle();
  if (!data) return null;
  return { doc: docFromDb(data), userId: data.user_id };
}

export async function readProfileFor(userId: string): Promise<BusinessProfile | null> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  return data ? profileFromDb(data) : null;
}

export async function updateDocFor(userId: string, doc: BusinessDocument): Promise<void> {
  await supabase.from("documents").upsert(docToDb(doc, userId));
}
