export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect x="2" y="2" width="36" height="36" rx="9" fill="var(--primary)" />
      <path d="M11 14h13a4 4 0 0 1 4 4v0a4 4 0 0 1-4 4h-9v6" stroke="var(--gold)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="20" cy="20" r="1.6" fill="var(--gold)" />
    </svg>
  );
}