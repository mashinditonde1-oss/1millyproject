import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, FileText, Receipt, Users, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
const items = [
  { to: "/app" as const, label: "Dashboard", icon: LayoutDashboard },
  { to: "/" as const, label: "Quotes", icon: FileText },
  { to: "/" as const, label: "Invoices", icon: Receipt },
  { to: "/" as const, label: "Clients", icon: Users },
  { to: "/" as const, label: "More", icon: MoreHorizontal },
];
export function AppShell() {
  const loc = useLocation();
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 pb-24"><Outlet /></main>
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border safe-bottom">
        <ul className="grid grid-cols-5 max-w-screen-md mx-auto">
          {items.map((it, idx) => {
            const active = loc.pathname === it.to;
            const Icon = it.icon;
            return (
              <li key={idx}>
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
