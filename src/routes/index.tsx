import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Loader2, Zap, BarChart3, WifiOff, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GetPaid — Get paid faster. Built for Zimbabwe." },
      { name: "description", content: "Quotes, invoices and payment tracking for Zimbabwean small businesses. Free to start." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user, signInWithGoogle, loading } = useAuth();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) nav({ to: "/app" });
  }, [user, nav]);

  const onGoogle = async () => {
    setBusy(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setBusy(false);
      toast.error("Sign in failed. Check your connection and try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-center gap-2">
          <Logo className="h-7 w-7" />
          <span className="font-semibold tracking-tight">GetPaid</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        <section className="space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
            Free to start · No credit card
          </div>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.05]">
            Get paid faster.
            <br />
            <span className="text-muted-foreground">Look more professional.</span>
          </h1>
          <p className="text-base text-foreground/80 max-w-md leading-relaxed">
            Create quotes your clients can sign on WhatsApp. Turn them into invoices in one tap. Track every cent owed to your business.
          </p>
          <ul className="grid gap-3 pt-2 max-w-sm">
            <Bullet icon={<Zap className="h-4 w-4" />}>
              Quote today, invoice today — one tap, zero re-typing
            </Bullet>
            <Bullet icon={<BarChart3 className="h-4 w-4" />}>
              See exactly who owes you what, in real time
            </Bullet>
            <Bullet icon={<span className="text-sm">🇿🇼</span>}>
              ZIMRA-ready VAT in ZiG, USD and ZAR
            </Bullet>
            <Bullet icon={<WifiOff className="h-4 w-4" />}>
              Works offline — load shedding can't stop you
            </Bullet>
          </ul>
        </section>

        <section>
          <div className="rounded-2xl border border-border bg-card shadow-sm p-6 sm:p-8 space-y-5">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold tracking-tight">Start for free</h2>
              <p className="text-sm text-muted-foreground">
                Sign in with your Google account — the one already on your Android. One tap, done.
              </p>
            </div>

            <Button
              onClick={onGoogle}
              disabled={busy || loading}
              className="w-full h-12 text-base gap-3"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
              Continue with Google
            </Button>

            <p className="text-center text-[11px] text-muted-foreground leading-relaxed">
              We only use your Google account to sign you in.
              <br />
              We never see your password or share your data.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <TrustBadge icon={<ShieldCheck className="h-3.5 w-3.5" />}>
                Your data is yours. Always.
              </TrustBadge>
              <TrustBadge icon={<span>🇿🇼</span>}>
                Built for Zimbabwe
              </TrustBadge>
            </div>
          </div>

          <p className="mt-4 text-center text-[11px] text-muted-foreground px-6">
            By continuing you agree to our{" "}
            <a href="/terms" className="underline underline-offset-2">Terms</a> and{" "}
            <a href="/privacy" className="underline underline-offset-2">Privacy Policy</a>.
          </p>
        </section>
      </main>

      <footer className="border-t border-border mt-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 text-xs text-muted-foreground flex flex-col items-center gap-1 text-center">
          <span>© {new Date().getFullYear()} GetPaid</span>
          <span>Built for Zimbabwean hustlers. 🇿🇼</span>
        </div>
      </footer>
    </div>
  );
}

function Bullet({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3 text-sm">
      <span className="h-7 w-7 rounded-md bg-secondary flex items-center justify-center shrink-0 border border-border">
        {icon}
      </span>
      <span className="text-foreground/90 text-left">{children}</span>
    </li>
  );
}

function TrustBadge({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-secondary border border-border px-3 py-2 text-[11px] text-muted-foreground">
      {icon}
      <span>{children}</span>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}
