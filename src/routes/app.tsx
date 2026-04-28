import { createFileRoute, useNavigate, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useProfile } from "@/lib/store";
import { AppShell } from "@/components/AppShell";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  const { user, loading } = useAuth();
  const [profile] = useProfile(user?.id ?? null);
  const nav = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) { nav({ to: "/" }); return; }
    if (!profile) { nav({ to: "/onboarding" }); }
  }, [user, loading, profile, nav]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!profile) return null;

  return <AppShell />;
}

// Default child route for /app handled by app.index.tsx
export function AppOutlet() { return <Outlet />; }