import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";

import { Signal, TrustBreakdownTable, TrustScoreBadge, VerifiedBadge } from "@/components/trust";
import { bdt, formatDate, landlords, listings } from "@/data/module1";

export const Route = createFileRoute("/listings/$listingId")({
  loader: ({ params }) => {
    const listing = listings.find((l) => l.id === params.listingId);
    if (!listing) throw notFound();
    return { listing, owner: landlords[listing.landlordId] };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Listing unavailable — BasaKhuji" }, { name: "robots", content: "noindex" }] };
    }
    const { listing } = loaderData;
    const title = `${listing.title} — ${listing.area} | BasaKhuji`;
    const description = `${listing.roomType} in ${listing.area}, ${bdt(listing.rent)} per month. Verified landlord with trust signals and full house rules.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: ListingDetail,
});

function ListingDetail() {
  const { listing, owner } = Route.useLoaderData();
  const [applied, setApplied] = useState(false);

  return (
    <article className="mx-auto max-w-6xl px-5 py-12">
      <Link to="/" className="eyebrow hover:text-foreground">
        ← Back to search
      </Link>

      <header className="mt-6 grid gap-8 border-b border-border pb-10 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="eyebrow">
            {listing.roomType} · {listing.area}, {listing.city} · listed {formatDate(listing.postedOn)}
          </p>
          <h1 className="mt-4 max-w-2xl text-4xl leading-tight sm:text-5xl">{listing.title}</h1>
        </div>
        <div className="text-left md:text-right">
          <div className="font-mono text-3xl tabular-nums">{bdt(listing.rent)}</div>
          <div className="eyebrow">per month · {bdt(listing.deposit)} deposit</div>
        </div>
      </header>

      <div className="mt-10 grid gap-12 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <img
            src={listing.photo}
            alt={listing.photoAlt}
            width={1200}
            height={800}
            className="aspect-[3/2] w-full object-cover"
          />

          <section className="mt-10">
            <h2 className="text-2xl">Location</h2>
            <div className="mt-4 border border-border">
              <div className="relative aspect-[16/8] bg-secondary">
                <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] [background-size:32px_32px]" />
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                  <div className="mx-auto h-3 w-3 rounded-full bg-accent ring-4 ring-accent/25" />
                  <p className="mt-2 font-mono text-[11px]">
                    {listing.coords.lat.toFixed(4)}, {listing.coords.lng.toFixed(4)}
                  </p>
                </div>
                <p className="absolute bottom-2 right-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  OpenStreetMap pin
                </p>
              </div>
              <ul className="divide-y divide-border border-t border-border">
                {listing.landmarks.map((m) => (
                  <li key={m} className="px-4 py-2.5 font-mono text-xs">
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="mt-10">
            <h2 className="text-2xl">House rules</h2>
            <ol className="mt-4 divide-y divide-border border-y border-border">
              {listing.houseRules.map((rule, i) => (
                <li key={rule} className="flex gap-4 py-3 text-sm">
                  <span className="font-mono text-xs text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {rule}
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="space-y-8">
          <div className="border border-border p-6">
            <p className="eyebrow">Landlord</p>
            <h2 className="mt-2 text-2xl">{owner.name}</h2>
            <div className="mt-3">{owner.verified && <VerifiedBadge since={owner.verifiedSince} />}</div>
            <div className="mt-6 flex items-center justify-between">
              <TrustScoreBadge breakdown={owner.trust} size="lg" />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-5">
              <Signal label="Response rate" value={`${owner.responseRate}%`} />
              <Signal label="Avg. reply" value={`${owner.avgResponseHours} h`} />
              <Signal label="Completed rentals" value={`${owner.completedRentals}`} />
              <Signal label="Available from" value={formatDate(listing.availableFrom)} />
            </div>
          </div>

          <div className="border border-border p-6">
            <p className="eyebrow">Trust Score composition</p>
            <div className="mt-4">
              <TrustBreakdownTable breakdown={owner.trust} />
            </div>
          </div>

          <div className="border border-border p-6">
            <p className="eyebrow">Apply</p>
            <p className="mt-3 text-sm text-muted-foreground">
              Applying attaches your verification status, payment history and dispute record. The
              landlord sees a ranked list — not a first-come queue.
            </p>
            <button
              type="button"
              onClick={() => setApplied(true)}
              disabled={applied}
              className="mt-5 w-full bg-foreground px-4 py-3 text-sm text-paper transition-opacity hover:opacity-90 disabled:cursor-default disabled:bg-primary"
            >
              {applied ? "Application logged to timeline ✓" : "Apply for this room"}
            </button>
            {applied && (
              <Link
                to="/landlord"
                className="mt-3 block text-center font-mono text-[11px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
              >
                See the ranked applicant list →
              </Link>
            )}
          </div>
        </aside>
      </div>
    </article>
  );
}