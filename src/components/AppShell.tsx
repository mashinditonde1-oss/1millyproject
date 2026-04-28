import type { ReactNode } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/" as const, label: "Home", icon: Home },
  { to: "/app" as const, label: "Dashboard", icon: LayoutDashboard },
];

export function AppShell({ children }: { children: ReactNode }) {
  const loc = useLocation();
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 pb-24">{children}</main>
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border safe-bottom">
        <ul className="grid grid-cols-2 max-w-screen-md mx-auto">
          {items.map((it) => {
            const active = loc.pathname === it.to;
            const Icon = it.icon;
            return (
              <li key={it.to}>
                <Link to={it.to} className={cn("flex flex-col items-center justify-center gap-1 py-2.5 min-h-[56px] text-xs font-medium transition-colors", active ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                  <span>{it.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
