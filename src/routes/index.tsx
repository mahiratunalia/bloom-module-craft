import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import heroImage from "@/assets/hero-dhaka.jpg";
import { Signal, TrustScoreBadge, VerifiedBadge } from "@/components/trust";
import {
  bdt,
  formatDate,
  landlords,
  listings,
  trustScore,
  type RoomType,
} from "@/data/module1";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Search verified rentals — BasaKhuji" },
      {
        name: "description",
        content:
          "Filter mess, single room and studio rentals across Dhaka by area, rent and availability — every listing carries its landlord's Trust Score.",
      },
      { property: "og:title", content: "Search verified rentals — BasaKhuji" },
      {
        property: "og:description",
        content: "Trust signals on every listing: verified badge, response rate, completed rentals, Trust Score.",
      },
    ],
  }),
  component: SearchPage,
});

const roomTypes: (RoomType | "Any")[] = ["Any", "Single room", "Shared mess", "Studio", "Full flat"];
const areas = ["Any area", ...Array.from(new Set(listings.map((l) => l.area)))];

function SearchPage() {
  const [area, setArea] = useState("Any area");
  const [roomType, setRoomType] = useState<RoomType | "Any">("Any");
  const [maxRent, setMaxRent] = useState(20000);
  const [availableBy, setAvailableBy] = useState("2026-10-01");
  const [sort, setSort] = useState<"trust" | "rent">("trust");

  const results = useMemo(() => {
    return listings
      .filter((l) => (area === "Any area" ? true : l.area === area))
      .filter((l) => (roomType === "Any" ? true : l.roomType === roomType))
      .filter((l) => l.rent <= maxRent)
      .filter((l) => new Date(l.availableFrom) <= new Date(availableBy))
      .sort((a, b) =>
        sort === "rent"
          ? a.rent - b.rent
          : trustScore(landlords[b.landlordId].trust) - trustScore(landlords[a.landlordId].trust),
      );
  }, [area, roomType, maxRent, availableBy, sort]);

  return (
    <>
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-[1.1fr_0.9fr] md:items-end md:py-24">
          <div>
            <p className="eyebrow">Module 1 — before &amp; during application</p>
            <h1 className="mt-5 text-5xl leading-[1.05] sm:text-6xl">
              Rent a room in Dhaka on a record,
              <em className="italic"> not a promise.</em>
            </h1>
            <p className="mt-6 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
              Verified landlords, listings pinned to the map, and a Trust Score computed from payment
              history, maintenance response, disputes and completed agreements. Apply once — the
              landlord sees you ranked on record, not on who messaged first.
            </p>
          </div>
          <figure className="relative">
            <img
              src={heroImage}
              alt="Aerial view of dense Dhaka residential rooftops at golden hour"
              width={1600}
              height={900}
              className="aspect-[4/3] w-full object-cover"
            />
            <figcaption className="mt-2 font-mono text-[11px] text-muted-foreground">
              {listings.length} active listings · 3 verified landlords
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid gap-x-8 gap-y-6 border-b border-border pb-8 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="Area">
            <select value={area} onChange={(e) => setArea(e.target.value)} className={inputCls}>
              {areas.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </Field>
          <Field label="Room type">
            <select
              value={roomType}
              onChange={(e) => setRoomType(e.target.value as RoomType | "Any")}
              className={inputCls}
            >
              {roomTypes.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </Field>
          <Field label={`Rent up to ${bdt(maxRent)}`}>
            <input
              type="range"
              min={4000}
              max={20000}
              step={500}
              value={maxRent}
              onChange={(e) => setMaxRent(Number(e.target.value))}
              className="mt-2 w-full accent-[var(--primary)]"
            />
          </Field>
          <Field label="Available by">
            <input
              type="date"
              value={availableBy}
              onChange={(e) => setAvailableBy(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Sort by">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as "trust" | "rent")}
              className={inputCls}
            >
              <option value="trust">Landlord Trust Score</option>
              <option value="rent">Lowest rent</option>
            </select>
          </Field>
        </div>

        <p className="mt-6 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          {results.length} listing{results.length === 1 ? "" : "s"} match
        </p>

        <ul className="mt-6 divide-y divide-border border-y border-border">
          {results.map((l) => {
            const owner = landlords[l.landlordId];
            return (
              <li key={l.id}>
                <Link
                  to="/listings/$listingId"
                  params={{ listingId: l.id }}
                  className="group grid gap-6 py-6 transition-colors hover:bg-secondary/50 sm:grid-cols-[220px_1fr_auto] sm:px-3"
                >
                  <img
                    src={l.photo}
                    alt={l.photoAlt}
                    loading="lazy"
                    width={1200}
                    height={800}
                    className="aspect-[3/2] w-full object-cover"
                  />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="eyebrow">{l.roomType}</span>
                      <span className="eyebrow">· {l.area}</span>
                    </div>
                    <h2 className="mt-2 text-2xl leading-snug group-hover:underline">{l.title}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {owner.name} · available {formatDate(l.availableFrom)} · {l.applicants} applicants
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      {owner.verified && <VerifiedBadge since={owner.verifiedSince} />}
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {owner.responseRate}% response · {owner.completedRentals} completed rentals
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-row items-end justify-between gap-6 sm:flex-col sm:items-end sm:justify-start">
                    <div className="text-right">
                      <div className="font-mono text-xl tabular-nums">{bdt(l.rent)}</div>
                      <div className="eyebrow">per month</div>
                    </div>
                    <TrustScoreBadge breakdown={owner.trust} />
                  </div>
                </Link>
              </li>
            );
          })}
          {results.length === 0 && (
            <li className="py-14 text-center text-sm text-muted-foreground">
              No listing matches these filters yet.
            </li>
          )}
        </ul>

        <div className="mt-12 grid gap-8 border border-border p-8 sm:grid-cols-3">
          <Signal label="Ranking basis" value="Verification → payments → disputes → Trust" />
          <Signal label="Geolocation" value="OpenStreetMap / Leaflet, no API key" />
          <Signal label="Evidence" value="Every application logged to the timeline" />
        </div>
      </section>
    </>
  );
}

const inputCls =
  "mt-2 w-full border-b border-input bg-transparent py-1.5 text-sm outline-none focus:border-foreground";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="eyebrow">{label}</span>
      {children}
    </label>
  );
}
