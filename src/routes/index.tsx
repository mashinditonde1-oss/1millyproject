import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import {
  ShieldCheck, MapPin, WifiOff, CreditCard, MessageSquare, Zap,
  BarChart3, DollarSign, FileCheck2, ArrowRight, Loader2
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GetPaid — Get paid faster. Built for Zimbabwe." },
      { name: "description", content: "Create quotes your clients can sign on WhatsApp. Turn them into invoices in one tap. Track every cent. Free to start." },
      { property: "og:title", content: "GetPaid — Get paid faster. Built for Zimbabwe." },
      { property: "og:description", content: "Quotes, invoices, payment tracking, BI and marketing — built for Zimbabwean small businesses." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user, signInWithGoogle, loading } = useAuth();
  const nav = useNavigate();
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (user) nav({ to: "/app" });
  }, [user, nav]);

  const onSignIn = async () => {
    setAuthError(null);
    setSigningIn(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setAuthError(error);
      setSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="px-4 py-4 flex items-center justify-between max-w-screen-md mx-auto">
        <div className="flex items-center gap-2">
          <Logo />
          <span className="font-bold text-lg">GetPaid</span>
        </div>
      </header>

      <section className="px-4 pt-8 pb-12 max-w-screen-md mx-auto">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-primary mb-5">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
          Built in Zimbabwe
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1]">
          Get paid faster.<br />
          Look more professional.<br />
          <span className="text-primary">Built for Zimbabwe.</span>
        </h1>
        <p className="mt-5 text-base text-muted-foreground leading-relaxed">
          Create quotes your clients can sign on WhatsApp. Turn them into invoices in one tap. Track every cent owed to your business. <span className="font-semibold text-foreground">Free to start.</span>
        </p>

        {authError && (
          <div role="alert" className="mt-6 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
            <p className="font-semibold text-destructive">Sign in failed</p>
            <p className="text-destructive/90 mt-1">{authError}</p>
            <Button onClick={onSignIn} variant="outline" size="sm" className="mt-3">Retry</Button>
          </div>
        )}

        <div className="mt-7">
          <Button
            onClick={onSignIn}
            disabled={signingIn || loading}
            size="lg"
            className="w-full h-14 text-base font-semibold shadow-md"
          >
            {signingIn ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> Connecting…</>
            ) : (
              <>
                <GoogleIcon />
                Continue with Google — it's free
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground mt-3 text-center px-2">
            We only use your Google account to sign you in. We never see your password or share your data.
          </p>
        </div>

        <ul className="mt-8 grid gap-2.5">
          <Trust icon={<ShieldCheck className="h-4 w-4" />}>Your data is yours. Always.</Trust>
          <Trust icon={<MapPin className="h-4 w-4" />}>Built in Zimbabwe for Zimbabwean businesses</Trust>
          <Trust icon={<WifiOff className="h-4 w-4" />}>Works offline — load shedding can't stop you</Trust>
          <Trust icon={<CreditCard className="h-4 w-4" />}>No credit card. No contract. Start free today.</Trust>
        </ul>
      </section>

      <section className="bg-secondary/40 py-12 px-4">
        <div className="max-w-screen-md mx-auto">
          <h2 className="text-2xl font-bold tracking-tight">Everything you need, nothing you don't</h2>
          <div className="mt-6 grid sm:grid-cols-2 gap-3">
            <Feature icon={<MessageSquare />} title="WhatsApp quote signing" desc="Send a quote on WhatsApp. Client signs on their phone. Done." />
            <Feature icon={<Zap />} title="One tap invoice creation" desc="Convert any accepted quote into an invoice instantly." />
            <Feature icon={<BarChart3 />} title="Business analytics" desc="Know who pays late, your top clients, and your cash flow." />
            <Feature icon={<WifiOff />} title="Offline mode" desc="View and create documents without internet. Syncs later." />
            <Feature icon={<DollarSign />} title="ZiG and USD" desc="Live exchange rate. Override anytime. Multi-currency invoices." />
            <Feature icon={<FileCheck2 />} title="ZIMRA VAT ready" desc="15% VAT toggle. VAT number on every document." />
          </div>
        </div>
      </section>

      <footer className="px-4 py-8 text-center text-xs text-muted-foreground space-x-4">
        <Link to="/" onClick={(e) => e.preventDefault()} className="hover:text-foreground">Terms of Service</Link>
        <Link to="/" onClick={(e) => e.preventDefault()} className="hover:text-foreground">Privacy Policy</Link>
        <p className="mt-3">© {new Date().getFullYear()} GetPaid Zimbabwe.</p>
      </footer>
    </div>
  );
}

function Trust({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2.5 text-sm">
      <span className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">{icon}</span>
      <span className="text-foreground/90">{children}</span>
    </li>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-xl bg-card p-4 border border-border/60 shadow-sm flex gap-3">
      <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <div className="h-5 w-5 [&>svg]:h-5 [&>svg]:w-5">{icon}</div>
      </div>
      <div>
        <h3 className="font-semibold text-sm">{title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.5 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.7 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.4 0 10.3-2.1 14-5.4l-6.5-5.5c-2 1.5-4.6 2.4-7.5 2.4-5.3 0-9.7-3.5-11.3-8.4l-6.5 5C9.4 39.6 16.1 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.2 5.6l6.5 5.5C40.7 36 44 30.6 44 24c0-1.3-.1-2.3-.4-3.5z"/>
    </svg>
  );
}
