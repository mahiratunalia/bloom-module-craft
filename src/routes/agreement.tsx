import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { bdt, formatDate, getLandlord, listings } from "@/data/module1";
import { useSession } from "@/hooks/use-session";
import { downloadAgreementPdf } from "@/lib/agreement-pdf";
import { generateAgreementClauses } from "@/lib/agreement.functions";
import type { AgreementClause } from "@/lib/agreement.server";

export const Route = createFileRoute("/agreement")({
  head: () => ({
    meta: [
      { title: "Digital rental agreement generator — BasaKhuji" },
      {
        name: "description",
        content:
          "Once a landlord accepts a tenant, BasaKhuji drafts a formal rental agreement from the listing terms — reviewed, acknowledged in-platform and delivered as a PDF.",
      },
      { property: "og:title", content: "Digital rental agreement generator — BasaKhuji" },
      {
        property: "og:description",
        content: "The legal anchor auto-attached to every future maintenance request or dispute.",
      },
    ],
  }),
  component: AgreementPage,
});

const listing = listings[0]!;
const tenant = { name: "Tanzila Rahman", nid: "1994 7712 8830", phone: "+880 1712 445 908" };

function AgreementPage() {
  const { user } = useSession();
  const draft = useServerFn(generateAgreementClauses);
  const owner = getLandlord(listing.landlordId);
  const [duration, setDuration] = useState(12);
  const [clauses, setClauses] = useState<AgreementClause[] | null>(null);
  const [source, setSource] = useState<"ai" | "fallback" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [tenantSigned, setTenantSigned] = useState(false);
  const [landlordSigned, setLandlordSigned] = useState(false);
  const bothSigned = tenantSigned && landlordSigned;

  const startDate = listing.availableFrom;
  const endDate = new Date(new Date(startDate).setMonth(new Date(startDate).getMonth() + duration))
    .toISOString()
    .slice(0, 10);
  const reference = `${listing.id}/${duration}M`;

  const reset = () => {
    setClauses(null);
    setSource(null);
    setNotice(null);
    setTenantSigned(false);
    setLandlordSigned(false);
  };

  async function generate() {
    setBusy(true);
    setNotice(null);
    try {
      const result = await draft({
        data: {
          reference,
          landlordName: owner.name,
          landlordVerifiedSince: owner.verifiedSince,
          tenantName: tenant.name,
          tenantNid: tenant.nid,
          tenantPhone: tenant.phone,
          propertyTitle: listing.title,
          roomType: listing.roomType,
          area: listing.area,
          city: listing.city,
          coords: `${listing.coords.lat.toFixed(4)}, ${listing.coords.lng.toFixed(4)}`,
          rent: listing.rent,
          deposit: listing.deposit,
          durationMonths: duration,
          startDate: formatDate(startDate),
          endDate: formatDate(endDate),
          houseRules: listing.houseRules,
        },
      });
      setClauses(result.clauses);
      setSource(result.source);
      if (result.error) setNotice(`${result.error} Showing the standard clause set instead.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not draft the agreement.");
    } finally {
      setBusy(false);
    }
  }

  function exportPdf() {
    if (!clauses) return;
    downloadAgreementPdf({
      reference,
      generatedOn: formatDate(new Date().toISOString()),
      landlordName: owner.name,
      tenantName: tenant.name,
      propertyLine: `${listing.title} — ${listing.roomType}, ${listing.area}, ${listing.city}`,
      rentLine: `Rent: ${bdt(listing.rent)} per month · Deposit: ${bdt(listing.deposit)}`,
      termLine: `Term: ${duration} months, ${formatDate(startDate)} to ${formatDate(endDate)}`,
      clauses,
      tenantSigned,
      landlordSigned,
    });
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <header className="border-b border-border pb-8">
        <p className="eyebrow">Application accepted · {listing.id}</p>
        <h1 className="mt-4 max-w-2xl text-4xl leading-tight sm:text-5xl">
          The agreement becomes the <em className="italic">legal anchor.</em>
        </h1>
        <p className="mt-5 max-w-xl text-[15px] text-muted-foreground">
          Tenant details, landlord details, rent, duration, deposit and house rules are drafted into a
          formal agreement. Both parties acknowledge it in-platform; the signed PDF is then emailed and
          attached to every future maintenance request or dispute.
        </p>
      </header>

      <div className="mt-10 grid gap-12 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-8">
          <Block title="Parties">
            <Row label="Landlord" value={`${owner.name} · verified ${owner.verifiedSince}`} />
            <Row label="Tenant" value={`${tenant.name} · NID ${tenant.nid}`} />
            <Row label="Contact" value={tenant.phone} />
          </Block>
          <Block title="Terms">
            <Row label="Property" value={`${listing.area}, ${listing.city}`} />
            <Row label="Monthly rent" value={bdt(listing.rent)} />
            <Row label="Security deposit" value={bdt(listing.deposit)} />
            <Row label="Start" value={formatDate(startDate)} />
            <Row label="End" value={formatDate(endDate)} />
            <div className="pt-4">
              <span className="eyebrow">Duration · {duration} months</span>
              <input
                type="range"
                min={6}
                max={24}
                step={6}
                value={duration}
                onChange={(e) => {
                  setDuration(Number(e.target.value));
                  reset();
                }}
                className="mt-3 w-full accent-[var(--primary)]"
              />
            </div>
          </Block>
          {user ? (
            <div className="space-y-3">
              <button
                type="button"
                onClick={generate}
                disabled={busy}
                className="w-full bg-foreground px-4 py-3 text-sm text-paper hover:opacity-90 disabled:opacity-50"
              >
                {busy ? "Drafting with AI…" : clauses ? "Regenerate draft" : "Generate agreement draft"}
              </button>
              <button
                type="button"
                onClick={exportPdf}
                disabled={!clauses}
                className="w-full border border-foreground px-4 py-3 text-sm hover:bg-foreground hover:text-paper disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-foreground"
              >
                Download PDF
              </button>
            </div>
          ) : (
            <div className="border border-dashed border-border p-5 text-sm text-muted-foreground">
              <Link to="/auth" className="underline underline-offset-4">
                Sign in
              </Link>{" "}
              to draft and download the agreement PDF.
            </div>
          )}
          {notice && (
            <p className="border-l-2 border-accent pl-3 text-xs text-muted-foreground">{notice}</p>
          )}
        </aside>

        <section>
          {!clauses ? (
            <div className="flex h-full min-h-80 items-center justify-center border border-dashed border-border p-10 text-center">
              <p className="max-w-xs text-sm text-muted-foreground">
                No draft yet. Generate one from the accepted application&rsquo;s terms — the clauses are
                written by Gemini from the listing data, then laid out and exported as a PDF.
              </p>
            </div>
          ) : (
            <article className="border border-border bg-card p-8 sm:p-12">
              <p className="eyebrow">
                {bothSigned ? "Acknowledged" : "Draft · not yet acknowledged"} ·{" "}
                {source === "ai" ? "clauses drafted by Gemini" : "standard clause set"}
              </p>
              <h2 className="mt-4 text-3xl">Residential Rental Agreement</h2>
              <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                Ref {reference} · generated {formatDate(new Date().toISOString())}
              </p>

              <div className="mt-8 space-y-6 text-[15px] leading-relaxed">
                {clauses.map((clause, i) => (
                  <Clause key={clause.title + i} n={i + 1} title={clause.title}>
                    {clause.body}
                  </Clause>
                ))}
              </div>

              <div className="mt-10 grid gap-6 border-t border-border pt-8 sm:grid-cols-2">
                <SignatureBox
                  role="Tenant"
                  name={tenant.name}
                  signed={tenantSigned}
                  onSign={() => setTenantSigned(true)}
                />
                <SignatureBox
                  role="Landlord"
                  name={owner.name}
                  signed={landlordSigned}
                  onSign={() => setLandlordSigned(true)}
                />
              </div>

              <p
                className={`mt-8 border-l-2 pl-4 text-sm ${
                  bothSigned ? "border-primary text-primary" : "border-border text-muted-foreground"
                }`}
              >
                {bothSigned
                  ? "Acknowledged by both parties. Download the signed PDF — it is attached to the tenancy record and to any future maintenance request or dispute."
                  : "Awaiting acknowledgement from both parties before the PDF is issued."}
              </p>
            </article>
          )}
        </section>
      </div>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-border p-6">
      <p className="eyebrow">{title}</p>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border pb-2 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-right font-mono text-xs tabular-nums">{value}</span>
    </div>
  );
}

function Clause({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
        {String(n).padStart(2, "0")} · {title}
      </h3>
      <p className="mt-2">{children}</p>
    </section>
  );
}

function SignatureBox({
  role,
  name,
  signed,
  onSign,
}: {
  role: string;
  name: string;
  signed: boolean;
  onSign: () => void;
}) {
  return (
    <div className="border border-border p-5">
      <p className="eyebrow">{role}</p>
      {signed ? (
        <>
          <p className="mt-3 font-display text-2xl italic">{name}</p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-primary">
            Acknowledged · {formatDate(new Date().toISOString())}
          </p>
        </>
      ) : (
        <button
          type="button"
          onClick={onSign}
          className="mt-3 w-full border border-foreground px-3 py-2 text-xs hover:bg-foreground hover:text-paper"
        >
          Acknowledge as {role.toLowerCase()}
        </button>
      )}
    </div>
  );
}