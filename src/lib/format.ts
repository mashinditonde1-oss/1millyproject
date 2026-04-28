import type { Currency } from "./types";

const SYMBOLS: Record<Currency, string> = { USD: "US$", ZiG: "ZiG ", ZAR: "R " };

export function formatMoney(amount: number, currency: Currency): string {
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(amount);
  return `${sign}${SYMBOLS[currency]}${abs.toLocaleString("en-ZW", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

export function whatsappLink(phone: string, message: string): string {
  const clean = phone.replace(/[^\d]/g, "").replace(/^0/, "263");
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}