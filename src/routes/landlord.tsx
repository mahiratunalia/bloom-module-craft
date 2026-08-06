import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { Signal, TrustBar, VerifiedBadge } from "@/components/trust";
import {
  applicants,
  bdt,
  formatDate,
  getLandlord,
  listings,
  rankApplicants,
} from "@/data/module1";

export const Route = createFileRoute("/landlord")({
  head: () => ({
    meta: [
      { title: "Landlord desk — listings & ranked applicants | BasaKhuji" },
      {
        name: "description",
        content:
          "Manage rental listings and review applicants ranked by verification, payment history, dispute record and Trust Score instead of who applied first.",
      },
      { property: "og:title", content: "Landlord desk — listings & ranked applicants" },
      {
        property: "og:description",
        content: "Ranked applications replace the first-come queue on BasaKhuji.",
      },
    ],
  }),
  component: LandlordDesk,
});

function LandlordDesk() {
  const owner = getLandlord("ll-1");
  const myListings = listings;
  const [selected, setSelected] = useState("bk-1041");
  const [explained, setExplained] = useState<string | null>(null);

  const ranked = useMemo(
    () => rankApplicants(applicants.filter((a) => a.listingId === selected)),
    [selected],
  );

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <header className="flex flex-wrap items-end justify-between gap-6 border-b border-border pb-8">
        <div>
          <p className="eyebrow">Landlord desk</p>
          <h1 className="mt-3 text-4xl sm:text-5xl">{owner.name}</h1>
          <div className="mt-4">
            <VerifiedBadge since={owner.verifiedSince} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-8">
          <Signal label="Response rate" value={`${owner.responseRate}%`} />
          <Signal label="Active listings" value={`${myListings.filter((l) => l.status === "Active").length}`} />
          <Signal label="Completed rentals" value={`${owner.completedRentals}`} />
        </div>
      </header>

      <section className="mt-12">
        <h2 className="text-2xl">Listings</h2>
        <table className="mt-5 w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-y border-border">
              {["Ref", "Listing", "Rent", "Available", "Applicants", "Status"].map((h) => (
                <th key={h} className="py-2 pr-4 font-mono text-[10px] font-normal uppercase tracking-widest text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {myListings.map((l) => (
              <tr key={l.id} className="border-b border-border align-top">
                <td className="py-4 pr-4 font-mono text-xs text-muted-foreground">{l.id}</td>
                <td className="max-w-sm py-4 pr-4">
                  <Link
                    to="/listings/$listingId"
                    params={{ listingId: l.id }}
                    className="hover:underline"
                  >
                    {l.title}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {l.roomType} · {l.area}
                  </p>
                </td>
                <td className="py-4 pr-4 font-mono tabular-nums">{bdt(l.rent)}</td>
                <td className="py-4 pr-4 font-mono text-xs">{formatDate(l.availableFrom)}</td>
                <td className="py-4 pr-4">
                  <button
                    type="button"
                    onClick={() => setSelected(l.id)}
                    className={`font-mono text-xs underline-offset-4 hover:underline ${
                      selected === l.id ? "text-accent" : ""
                    }`}
                  >
                    {l.applicants} · review
                  </button>
                </td>
                <td className="py-4 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  {l.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-16">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-2xl">Ranked applicants</h2>
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            {selected} · verification → payments → disputes → trust
          </p>
        </div>

        {ranked.length === 0 ? (
          <p className="mt-6 border border-border p-8 text-center text-sm text-muted-foreground">
            No applications on this listing yet.
          </p>
        ) : (
          <ol className="mt-6 space-y-px">
            {ranked.map((a, i) => (
              <li key={a.id} className="grid gap-6 border border-border p-6 sm:grid-cols-[auto_1fr_180px]">
                <div className="font-mono text-3xl tabular-nums text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div>
                  <h3 className="text-xl">{a.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{a.occupation}</p>
                  <div className="mt-3 flex flex-wrap gap-2 font-mono text-[11px]">
                    <Tag ok={a.nidVerified}>NID {a.nidVerified ? "verified" : "pending"}</Tag>
                    <Tag ok={a.phoneVerified}>Phone {a.phoneVerified ? "verified" : "pending"}</Tag>
                    <Tag ok={a.disputes === 0}>
                      {a.disputes} dispute{a.disputes === 1 ? "" : "s"}
                    </Tag>
                    <Tag ok={a.onTimePaymentRate >= 85}>{a.onTimePaymentRate}% on-time</Tag>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {a.note} Applied {formatDate(a.appliedOn)}.
                  </p>
                </div>
                <div>
                  <div className="flex items-baseline justify-between">
                    <span className="eyebrow">Trust</span>
                    <span className="font-mono text-2xl tabular-nums">{a.score}</span>
                  </div>
                  <div className="mt-2">
                    <TrustBar value={a.score} />
                  </div>
                  <button
                    type="button"
                    onClick={() => setExplained(explained === a.id ? null : a.id)}
                    className="mt-4 w-full border border-border px-3 py-2 text-xs hover:bg-secondary"
                  >
                    {explained === a.id ? "Hide ranking" : "Why this ranked"}
                  </button>
                  <div className="mt-4 flex gap-2">
                    <button className="flex-1 bg-foreground px-3 py-2 text-xs text-paper hover:opacity-90">
                      Accept
                    </button>
                    <button className="flex-1 border border-border px-3 py-2 text-xs hover:bg-secondary">
                      Decline
                    </button>
                  </div>
                </div>
                {explained === a.id && (
                  <div className="border-t border-border pt-5 sm:col-span-3">
                    <p className="eyebrow">
                      Why {a.name.split(" ")[0]} sits at position {String(i + 1).padStart(2, "0")}
                    </p>
                    <dl className="mt-4 divide-y divide-border border-y border-border">
                      {a.signals.map((s) => (
                        <div key={s.label} className="grid grid-cols-[1fr_auto] gap-x-6 py-3">
                          <dt className="text-sm">
                            {s.label}
                            <span className="ml-2 font-mono text-[11px] text-muted-foreground">
                              {s.formula}
                            </span>
                            <p className="mt-0.5 text-xs text-muted-foreground">{s.detail}</p>
                          </dt>
                          <dd
                            className={`font-mono text-sm tabular-nums ${
                              s.tone === "up"
                                ? "text-trust-high"
                                : s.tone === "down"
                                  ? "text-trust-low"
                                  : "text-muted-foreground"
                            }`}
                          >
                            {s.points > 0 ? "+" : ""}
                            {s.points}
                          </dd>
                        </div>
                      ))}
                      <div className="grid grid-cols-[1fr_auto] gap-x-6 py-3">
                        <dt className="text-sm font-medium">Ranking value</dt>
                        <dd className="font-mono text-sm tabular-nums">{a.rankValue}</dd>
                      </div>
                    </dl>
                    <p className="mt-3 text-xs text-muted-foreground">
                      Application time is not an input. Verification dominates the ordering, then
                      payment history, then dispute record, with the Trust Score breaking ties.
                    </p>
                  </div>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function Tag({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`border px-2 py-0.5 ${
        ok ? "border-primary/40 text-primary" : "border-destructive/40 text-destructive"
      }`}
    >
      {children}
    </span>
  );
}