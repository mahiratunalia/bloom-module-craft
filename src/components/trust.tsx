import { TRUST_WEIGHTS, trustScore, type TrustBreakdown } from "@/data/module1";

function toneFor(score: number) {
  if (score >= 85) return "text-trust-high";
  if (score >= 70) return "text-trust-mid";
  return "text-trust-low";
}

export function TrustScoreBadge({
  breakdown,
  size = "md",
}: {
  breakdown: TrustBreakdown;
  size?: "sm" | "md" | "lg";
}) {
  const score = trustScore(breakdown);
  const dims = size === "lg" ? "text-5xl" : size === "sm" ? "text-xl" : "text-3xl";
  return (
    <div className="flex items-baseline gap-2">
      <span className={`font-mono tabular-nums leading-none ${dims} ${toneFor(score)}`}>{score}</span>
      <span className="eyebrow">Trust</span>
    </div>
  );
}

export function TrustBar({ value }: { value: number }) {
  return (
    <div className="h-[3px] w-full bg-border">
      <div
        className="h-full bg-foreground"
        style={{ width: `${Math.max(2, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function TrustBreakdownTable({ breakdown }: { breakdown: TrustBreakdown }) {
  return (
    <dl className="divide-y divide-border border-y border-border">
      {TRUST_WEIGHTS.map((w) => (
        <div key={w.key} className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-2 py-3">
          <dt className="text-sm">
            {w.label}
            <span className="ml-2 font-mono text-[11px] text-muted-foreground">
              {Math.round(w.weight * 100)}%
            </span>
            <p className="mt-0.5 text-xs text-muted-foreground">{w.measures}</p>
          </dt>
          <dd className="font-mono text-sm tabular-nums">{breakdown[w.key]}</dd>
          <div className="col-span-2">
            <TrustBar value={breakdown[w.key]} />
          </div>
        </div>
      ))}
    </dl>
  );
}

export function VerifiedBadge({ since }: { since?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 border border-primary/40 bg-primary/5 px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider text-primary">
      <span aria-hidden>✓</span> Verified{since ? ` · ${since}` : ""}
    </span>
  );
}

export function Signal({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="eyebrow">{label}</div>
      <div className="mt-1 font-mono text-sm tabular-nums">{value}</div>
    </div>
  );
}