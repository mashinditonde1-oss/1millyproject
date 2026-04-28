import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Loader2, Zap, BarChart3, ShieldCheck, WifiOff } from "lucide-react";
import { toast } from "sonner";
import zimraLogo from "@/assets/zimra-logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GetPaid — Get paid faster. Built for Zimbabwe." },
      {
        name: "description",
        content:
          "Quotes, invoices and payment tracking for Zimbabwean small businesses. Free to start.",
      },
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
      toast.error("Sign in failed. Please check your connection and try again.");
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
        {/* Hero */}
        <section className="space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
            Free to start · No credit card
          </div>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.05] text-foreground">
            Get paid faster.
            <br />
            <span className="text-muted-foreground">Look more professional.</span>
          </h1>
          <p className="text-base text-foreground/80 max-w-md leading-relaxed">
            Create quotes your clients can sign on WhatsApp. Turn them into invoices in one
            tap. Track every cent owed to your business.
          </p>

          <ul className="grid gap-3 pt-2 max-w-sm">
            <Bullet icon={<Zap className="h-4 w-4" />}>
              Quote today, invoice today — one tap, zero re-typing
            </Bullet>
            <Bullet icon={<BarChart3 className="h-4 w-4" />}>
              See exactly who owes you what, in real time
            </Bullet>
            <Bullet
              icon={<img src={zimraLogo} alt="ZIMRA" className="h-4 w-4 object-contain" />}
            >
              ZIMRA-ready VAT & receipts in ZiG and USD
            </Bullet>
            <Bullet icon={<WifiOff className="h-4 w-4" />}>
              Works offline — load shedding can't stop you
            </Bullet>
          </ul>
        </section>

        {/* Auth card */}
        <section>
          <div className="rounded-2xl border border-border bg-card shadow-sm p-6 sm:p-8 space-y-5">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold tracking-tight">Start for free</h2>
              <p className="text-sm text-muted-foreground">
                Sign in with your Google account — the one already on your Android.
              </p>
            </div>

            <Button
              onClick={onGoogle}
              disabled={busy || loading}
              className="w-full h-12 text-base gap-3"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              Continue with Google
            </Button>

            <p className="text-center text-[11px] text-muted-foreground leading-relaxed">
              We only use your Google account to sign you in.
              <br />
              We never see your password or share your data.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
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
          <span>Built for Zimbabwean hustlers.</span>
        </div>
      </footer>
    </div>
  );
}

function Bullet({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3 text-sm">
      <span className="h-7 w-7 rounded-md bg-secondary text-foreground flex items-center justify-center shrink-0 border border-border">
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
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.5 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"
        transform="scale(0.5)"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.7 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
        transform="scale(0.5)"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.4 0 10.3-2.1 14-5.4l-6.5-5.5c-2 1.5-4.6 2.4-7.5 2.4-5.3 0-9.7-3.5-11.3-8.4l-6.5 5C9.4 39.6 16.1 44 24 44z"
        transform="scale(0.5)"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.2 5.6l6.5 5.5C40.7 36 44 30.6 44 24c0-1.3-.1-2.3-.4-3.5z"
        transform="scale(0.5)"
      />
    </svg>
  );
}
