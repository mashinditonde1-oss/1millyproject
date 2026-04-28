import type { BusinessProfile, BusinessDocument, Client } from "./types";

export const FREE_DOC_LIMIT = 5;
export const FREE_CLIENT_LIMIT = 3;

export function isPro(profile: BusinessProfile | null): boolean {
  return profile?.plan === "pro";
}

export function docsThisMonth(docs: BusinessDocument[]): number {
  const now = new Date();
  return docs.filter((d) => {
    const dt = new Date(d.createdAt);
    return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
  }).length;
}

export function canCreateDoc(profile: BusinessProfile | null, docs: BusinessDocument[]): boolean {
  if (isPro(profile)) return true;
  return docsThisMonth(docs) < FREE_DOC_LIMIT;
}

export function canAddClient(profile: BusinessProfile | null, clients: Client[]): boolean {
  if (isPro(profile)) return true;
  return clients.length < FREE_CLIENT_LIMIT;
}