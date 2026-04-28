const FALLBACK_RATE = 26.5;
const CACHE_KEY = "getpaid:zimrate";

export interface RateInfo {
  rate: number;
  source: "live" | "cache" | "fallback";
  fetchedAt: string;
}

export async function getZigRate(): Promise<RateInfo> {
  const cached = readCache();
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch("https://open.er-api.com/v6/latest/USD", { signal: ctrl.signal });
    clearTimeout(t);
    if (res.ok) {
      const data = (await res.json()) as { rates?: Record<string, number> };
      const rate = data.rates?.ZWG ?? data.rates?.ZWL ?? cached?.rate ?? FALLBACK_RATE;
      const info: RateInfo = { rate, source: "live", fetchedAt: new Date().toISOString() };
      writeCache(info);
      return info;
    }
  } catch {}
  if (cached) return { ...cached, source: "cache" };
  return { rate: FALLBACK_RATE, source: "fallback", fetchedAt: new Date().toISOString() };
}

function readCache(): RateInfo | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(CACHE_KEY);
    return v ? (JSON.parse(v) as RateInfo) : null;
  } catch { return null; }
}
function writeCache(info: RateInfo) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CACHE_KEY, JSON.stringify(info));
}