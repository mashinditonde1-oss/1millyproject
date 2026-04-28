import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useProfile, useClients } from "@/lib/store";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { whatsappLink } from "@/lib/format";
import { Loader2, MessageCircle, ChevronDown, ChevronUp } from "lucide-react";

export const Route = createFileRoute("/app/marketing")({
  component: MarketingPage,
});

interface Template {
  title: string;
  emoji: string;
  message: (bizName: string) => string;
}

const TEMPLATES: Template[] = [
  {
    title: "End of Year Special",
    emoji: "🎉",
    message: (b) =>
      `Hello! ${b} is running a special offer this December — 10% off all services booked before 31 December. Reply to book your slot. Thank you for your continued support! 🙏`,
  },
  {
    title: "New Year Greeting",
    emoji: "🥳",
    message: (b) =>
      `Happy New Year from all of us at ${b}! We look forward to serving you in 2026. Feel free to reach out for any quotes or bookings. Let's make it a great year! 💪`,
  },
  {
    title: "We've Moved / New Details",
    emoji: "📍",
    message: (b) =>
      `Hello from ${b}! We have updated our contact details. Please save this number as our new primary contact. We look forward to continuing to serve you. Thank you!`,
  },
  {
    title: "Thank You for Your Business",
    emoji: "🙏",
    message: (b) =>
      `Hello! We just wanted to reach out and say thank you for choosing ${b}. Your support means everything to us. Please don't hesitate to get in touch for any future needs. We appreciate you!`,
  },
  {
    title: "Referral Request",
    emoji: "🤝",
    message: (b) =>
      `Hello! We hope we have been serving you well at ${b}. If you know anyone who could benefit from our services, we'd really appreciate a referral. We offer a 10% discount to anyone you refer. Thank you!`,
  },
  {
    title: "Slow Month Promotion",
    emoji: "📉",
    message: (b) =>
      `Hello from ${b}! We have some availability this month and are offering discounted rates for work booked before the end of the month. Get in touch to discuss your requirements. Limited slots!`,
  },
  {
    title: "Service Reminder",
    emoji: "🔔",
    message: (b) =>
      `Hello! This is a friendly reminder from ${b}. It has been a while since your last service. We'd love to hear from you — reach out to schedule your next appointment or request a quote!`,
  },
];

function MarketingPage() {
  const { user, loading } = useAuth();
  const [profile, , profileLoading] = useProfile(user?.id ?? null);
  const { clients } = useClients(user?.id ?? null);
  const nav = useNavigate();

  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [customMessage, setCustomMessage] = useState("");
  const [expandedTemplate, setExpandedTemplate] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/" });
    if (!loading && !profileLoading && user && !profile) nav({ to: "/app/onboarding" });
  }, [user, loading, profile, profileLoading, nav]);

  useEffect(() => {
    if (selectedTemplate !== null && profile) {
      setCustomMessage(TEMPLATES[selectedTemplate].message(profile.businessName));
    }
  }, [selectedTemplate, profile]);

  if (loading || profileLoading || !user || !profile) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const openWhatsApp = (phone: string) => {
    if (!customMessage.trim()) return;
    window.open(whatsappLink(phone, customMessage), "_blank");
  };

  return (
    <AppShell>
      <PageHeader title="Marketing" subtitle="Send messages to your clients" />
      <div className="px-4 space-y-4 pb-6">

        {/* Template picker */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Choose a template
          </p>
          {TEMPLATES.map((t, i) => {
            const isExpanded = expandedTemplate === i;
            const isSelected = selectedTemplate === i;
            return (
              <div
                key={i}
                className={`rounded-lg border transition-colors ${
                  isSelected ? "border-primary bg-primary/5" : "border-border bg-background"
                }`}
              >
                <button
                  type="button"
                  className="w-full flex items-center justify-between p-3 text-left"
                  onClick={() => {
                    setSelectedTemplate(i);
                    setExpandedTemplate(isExpanded ? null : i);
                  }}
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <span>{t.emoji}</span>
                    <span>{t.title}</span>
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                {isExpanded && (
                  <p className="px-3 pb-3 text-xs text-muted-foreground leading-relaxed">
                    {t.message(profile.businessName)}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Message editor */}
        {selectedTemplate !== null && (
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Customise your message
            </p>
            <Textarea
              rows={5}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Your message..."
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground">
              {customMessage.length} characters
            </p>
          </div>
        )}

        {/* Client list to send to */}
        {selectedTemplate !== null && customMessage.trim() && (
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Send to a client
            </p>
            <p className="text-xs text-muted-foreground">
              Messages open one at a time in WhatsApp to keep communication personal.
            </p>
            {clients.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-2">
                No clients added yet.
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {clients.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3 bg-background"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {c.companyName || c.fullName}
                      </p>
                      <p className="text-xs text-muted-foreground">{c.whatsapp}</p>
                    </div>
                    <Button
                      size="sm"
                      className="h-8 gap-1.5 shrink-0"
                      onClick={() => openWhatsApp(c.whatsapp)}
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      Send
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {selectedTemplate === null && (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <MessageCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Pick a template above to get started.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
