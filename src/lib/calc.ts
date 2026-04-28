import type { BusinessDocument, PaymentRecord } from "./types";

export interface DocTotals {
  subtotal: number;
  discount: number;
  taxable: number;
  vat: number;
  total: number;
  deposit: number;
  paid: number;
  balance: number;
}

export function computeTotals(doc: BusinessDocument): DocTotals {
  const subtotal = doc.items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0);
  let discount = 0;
  if (doc.discountValue && doc.discountValue > 0) {
    discount = doc.discountType === "percent" ? (subtotal * doc.discountValue) / 100 : doc.discountValue;
  }
  const taxable = Math.max(0, subtotal - discount);
  const vat = doc.vatEnabled ? taxable * 0.15 : 0;
  const total = taxable + vat;
  const deposit = doc.depositRequired ?? 0;
  const paid = (doc.payments ?? []).reduce((s: number, p: PaymentRecord) => s + p.amount, 0);
  const balance = total - paid;
  return { subtotal, discount, taxable, vat, total, deposit, paid, balance };
}