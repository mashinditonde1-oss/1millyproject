import type { ReactNode } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Home, FileText, Users, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const items: { to: string; label: string; icon: typeof Home; exact?: boolean }[] = [
  { to: "/app", label: "Home", icon: Home, exact: true },
  { to: "/app/docs", label: "Docs", icon: FileText },
  { to: "/app/clients", label: "Clients", icon: Users },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const loc = useLocation();
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 pb-24 max-w-screen-md w-full mx-auto">{children}</main>
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border safe-bottom">
        <ul className="grid grid-cols-4 max-w-screen-md mx-auto">
          {items.map((it) => {
            const active = it.exact ? loc.pathname === it.to : loc.pathname.startsWith(it.to);
            const Icon = it.icon;
            return (
              <li key={it.to}>
                <Link
                  to={it.to as any}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 py-2.5 min-h-[56px] text-[11px] font-medium transition-colors",
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                >
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
