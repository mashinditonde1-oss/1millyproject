import type { Currency } from "@/lib/types";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

export function Money({ amount, currency, className, big }: { amount: number; currency: Currency; className?: string; big?: boolean }) {
  return (
    <span className={cn("money", big && "text-2xl", className)}>{formatMoney(amount, currency)}</span>
  );
}