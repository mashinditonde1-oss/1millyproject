import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
});

function AuthCallback() {
  const nav = useNavigate();
  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Supabase JS auto-detects session in URL. Just wait for it.
      await supabase.auth.getSession();
      if (!cancelled) nav({ to: "/app" });
    })();
    return () => { cancelled = true; };
  }, [nav]);
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background">
      <Loader2 className="h-7 w-7 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Signing you in…</p>
    </div>
  );
}
