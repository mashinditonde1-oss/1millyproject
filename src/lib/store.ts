import { useEffect, useSyncExternalStore } from "react";
import type { BusinessProfile, Client, BusinessDocument, DocType } from "./types";

/**
 * Local-first store keyed by user id.
 * Works offline. When wired to Supabase tables this can sync transparently.
 */

type Listener = () => void;
const listeners = new Set<Listener>();
const emit = () => listeners.forEach((l) => l());

function key(userId: string, k: string) {
  return `getpaid:${userId}:${k}`;
}

function read<T>(userId: string, k: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = window.localStorage.getItem(key(userId, k));
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write<T>(userId: string, k: string, v: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key(userId, k), JSON.stringify(v));
  emit();
}

function subscribe(l: Listener) {
  listeners.add(l);
  return () => listeners.delete(l);
}

function useLocal<T>(userId: string | null, k: string, fallback: T): [T, (v: T) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => (userId ? read(userId, k, fallback) : fallback),
    () => fallback,
  );
  const set = (v: T) => {
    if (!userId) return;
    write(userId, k, v);
  };
  // Re-render when userId arrives
  useEffect(() => emit(), [userId]);
  return [value, set];
}

export function useProfile(userId: string | null) {
  return useLocal<BusinessProfile | null>(userId, "profile", null);
}

export function useClients(userId: string | null) {
  const [clients, setClients] = useLocal<Client[]>(userId, "clients", []);
  return {
    clients: clients.filter((c) => !c.deletedAt),
    trashed: clients.filter((c) => c.deletedAt),
    all: clients,
    upsert: (c: Client) => {
      const existing = clients.findIndex((x) => x.id === c.id);
      const next = [...clients];
      if (existing >= 0) next[existing] = c;
      else next.unshift(c);
      setClients(next);
    },
    softDelete: (id: string) => {
      setClients(clients.map((c) => (c.id === id ? { ...c, deletedAt: new Date().toISOString() } : c)));
    },
    restore: (id: string) => {
      setClients(clients.map((c) => (c.id === id ? { ...c, deletedAt: null } : c)));
    },
    purge: (id: string) => setClients(clients.filter((c) => c.id !== id)),
  };
}

export function useDocs(userId: string | null) {
  const [docs, setDocs] = useLocal<BusinessDocument[]>(userId, "docs", []);
  return {
    docs: docs.filter((d) => !d.deletedAt),
    all: docs,
    upsert: (d: BusinessDocument) => {
      const idx = docs.findIndex((x) => x.id === d.id);
      const next = [...docs];
      const updated = { ...d, updatedAt: new Date().toISOString() };
      if (idx >= 0) next[idx] = updated;
      else next.unshift(updated);
      setDocs(next);
    },
    softDelete: (id: string) => {
      setDocs(docs.map((d) => (d.id === id ? { ...d, deletedAt: new Date().toISOString() } : d)));
    },
    restore: (id: string) => setDocs(docs.map((d) => (d.id === id ? { ...d, deletedAt: null } : d))),
    purge: (id: string) => setDocs(docs.filter((d) => d.id !== id)),
  };
}

export function nextDocNumber(docs: BusinessDocument[], type: DocType): string {
  const prefix = { quote: "QUO", proforma: "PRO", invoice: "INV", credit_note: "CN" }[type];
  const year = new Date().getFullYear();
  const same = docs.filter((d) => d.type === type);
  const n = same.length + 1;
  return `${prefix}-${year}-${String(n).padStart(4, "0")}`;
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/** Public lookup of a doc by share token across all users (offline-friendly). */
export function findDocByShareToken(token: string): { doc: BusinessDocument; userId: string } | null {
  if (typeof window === "undefined") return null;
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i);
    if (!k) continue;
    const m = k.match(/^getpaid:([^:]+):docs$/);
    if (!m) continue;
    try {
      const arr = JSON.parse(window.localStorage.getItem(k) || "[]") as BusinessDocument[];
      const found = arr.find((d) => d.shareToken === token);
      if (found) return { doc: found, userId: m[1] };
    } catch {}
  }
  return null;
}

export function readProfileFor(userId: string): BusinessProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(key(userId, "profile"));
    return v ? (JSON.parse(v) as BusinessProfile) : null;
  } catch {
    return null;
  }
}

export function updateDocFor(userId: string, doc: BusinessDocument) {
  const docs = read<BusinessDocument[]>(userId, "docs", []);
  const idx = docs.findIndex((d) => d.id === doc.id);
  if (idx >= 0) docs[idx] = { ...doc, updatedAt: new Date().toISOString() };
  else docs.unshift(doc);
  write(userId, "docs", docs);
}