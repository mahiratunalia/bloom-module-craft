import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { TrustBar } from "@/components/trust";
import { bdt, formatDate, listings } from "@/data/module1";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import {
  useApplications,
  useDeleteRoommateSession,
  useProfile,
  useRoommatePreferences,
  useRoommateSessions,
  useSavedListings,
  useToggleSavedListing,
  useUpdateProfile,
  type SavedSessionResult,
} from "@/lib/user-data";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Your BasaKhuji profile — saved listings & sessions" },
      {
        name: "description",
        content:
          "Your saved listings, submitted applications, roommate preferences and saved matching sessions in one place.",
      },
      { property: "og:title", content: "Your BasaKhuji profile" },
      {
        property: "og:description",
        content: "Saved listings, applications, preferences and roommate matching sessions.",
      },
    ],
  }),
  component: ProfilePage,
});

const listingById = Object.fromEntries(listings.map((l) => [l.id, l]));

function ProfilePage() {
  const { user } = useSession();
  const userId = user?.id;
  const navigate = useNavigate();
  const qc = useQueryClient();

  const profile = useProfile(userId);
  const updateProfile = useUpdateProfile(userId);
  const saved = useSavedListings(userId);
  const unsave = useToggleSavedListing(userId);
  const applications = useApplications(userId);
  const prefs = useRoommatePreferences(userId);
  const sessions = useRoommateSessions(userId);
  const deleteSession = useDeleteRoommateSession(userId);

  const [name, setName] = useState("");
  const [accountType, setAccountType] = useState("tenant");
  const [openSession, setOpenSession] = useState<string | null>(null);

  useEffect(() => {
    if (profile.data) {
      setName(profile.data.display_name);
      setAccountType(profile.data.account_type);
    }
  }, [profile.data]);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <header className="flex flex-wrap items-end justify-between gap-6 border-b border-border pb-8">
        <div>
          <p className="eyebrow">Profile</p>
          <h1 className="mt-3 text-4xl sm:text-5xl">{profile.data?.display_name || "Your profile"}</h1>
          <p className="mt-3 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            {user?.email} · {accountType}
          </p>
        </div>
        <button
          type="button"
          onClick={signOut}
          className="border border-border px-4 py-2 text-xs hover:bg-secondary"
        >
          Sign out
        </button>
      </header>

      <div className="mt-10 grid gap-12 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-8">
          <div className="border border-border p-6">
            <p className="eyebrow">Account details</p>
            <label className="mt-4 block">
              <span className="eyebrow">Display name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
            </label>
            <div className="mt-5">
              <span className="eyebrow">Account type</span>
              <div className="mt-3 flex">
                {["tenant", "landlord"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setAccountType(t)}
                    className={`flex-1 border px-3 py-2 text-xs capitalize transition-colors ${
                      accountType === t
                        ? "border-foreground bg-foreground text-paper"
                        : "border-border hover:bg-secondary"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={() => updateProfile.mutate({ display_name: name, account_type: accountType })}
              disabled={updateProfile.isPending}
              className="mt-6 w-full bg-foreground px-4 py-2.5 text-xs text-paper hover:opacity-90 disabled:opacity-50"
            >
              {updateProfile.isPending ? "Saving…" : "Save details"}
            </button>
          </div>

          <div className="border border-border p-6">
            <p className="eyebrow">Matching preferences</p>
            {prefs.data ? (
              <dl className="mt-4 space-y-2 text-xs">
                <Row label="Budget" value={bdt(prefs.data.budget)} />
                <Row label="Sleep" value={prefs.data.sleep} />
                <Row
                  label="Smoking"
                  value={`${prefs.data.smoking}${prefs.data.smoking_non_negotiable ? " · non-negotiable" : ""}`}
                />
                <Row label="Study" value={prefs.data.study} />
                <Row label="Visitors" value={prefs.data.visitors} />
              </dl>
            ) : (
              <p className="mt-4 text-xs text-muted-foreground">
                No preferences saved yet.
              </p>
            )}
            <Link
              to="/roommates"
              className="mt-5 inline-block border border-foreground px-3 py-2 text-xs hover:bg-foreground hover:text-paper"
            >
              Open the matcher
            </Link>
          </div>
        </aside>

        <div className="space-y-14">
          <section>
            <h2 className="text-2xl">Saved listings</h2>
            {saved.data && saved.data.length > 0 ? (
              <ul className="mt-5 divide-y divide-border border-y border-border">
                {saved.data.map((row) => {
                  const l = listingById[row.listing_id];
                  return (
                    <li key={row.id} className="flex flex-wrap items-baseline justify-between gap-4 py-4">
                      <div>
                        {l ? (
                          <Link
                            to="/listings/$listingId"
                            params={{ listingId: l.id }}
                            className="text-lg hover:underline"
                          >
                            {l.title}
                          </Link>
                        ) : (
                          <span className="text-lg">{row.listing_id}</span>
                        )}
                        <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                          {l ? `${l.area} · ${bdt(l.rent)}/mo · ` : ""}saved {formatDate(row.created_at)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => unsave.mutate({ listingId: row.listing_id, saved: true })}
                        className="border border-border px-3 py-1.5 text-xs hover:bg-secondary"
                      >
                        Remove
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <Empty>Nothing shortlisted yet — save a listing from search.</Empty>
            )}
          </section>

          <section>
            <h2 className="text-2xl">Applications</h2>
            {applications.data && applications.data.length > 0 ? (
              <ul className="mt-5 divide-y divide-border border-y border-border">
                {applications.data.map((a) => {
                  const l = listingById[a.listing_id];
                  return (
                    <li key={a.id} className="py-4">
                      <div className="flex flex-wrap items-baseline justify-between gap-4">
                        <span className="text-lg">{l ? l.title : a.listing_id}</span>
                        <span className="border border-primary/40 px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider text-primary">
                          {a.status}
                        </span>
                      </div>
                      <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                        {a.listing_id} · applied {formatDate(a.created_at)}
                      </p>
                      {a.note && <p className="mt-2 text-sm text-muted-foreground">{a.note}</p>}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <Empty>No applications submitted yet.</Empty>
            )}
          </section>

          <section>
            <h2 className="text-2xl">Saved matching sessions</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Each session stores the exact preferences and the scores they produced, so reopening it
              shows identical compatibility results.
            </p>
            {sessions.data && sessions.data.length > 0 ? (
              <ul className="mt-5 space-y-px">
                {sessions.data.map((s) => {
                  const results = (s.results ?? []) as unknown as SavedSessionResult[];
                  const open = openSession === s.id;
                  return (
                    <li key={s.id} className="border border-border p-6">
                      <div className="flex flex-wrap items-baseline justify-between gap-4">
                        <div>
                          <h3 className="text-xl">{s.label}</h3>
                          <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                            {formatDate(s.created_at)} · {results.length} candidates scored
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setOpenSession(open ? null : s.id)}
                            className="border border-foreground px-3 py-1.5 text-xs hover:bg-foreground hover:text-paper"
                          >
                            {open ? "Hide results" : "Revisit results"}
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteSession.mutate(s.id)}
                            className="border border-border px-3 py-1.5 text-xs hover:bg-secondary"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {open && (
                        <ol className="mt-6 space-y-5 border-t border-border pt-6">
                          {results.map((r) => (
                            <li key={r.candidateId}>
                              <div className="flex items-baseline justify-between gap-4">
                                <div>
                                  <p className="text-base">{r.candidateName}</p>
                                  <p className="text-xs text-muted-foreground">{r.detail}</p>
                                </div>
                                <span className="font-mono text-2xl tabular-nums">{r.total}%</span>
                              </div>
                              {r.hardBlocked && (
                                <p className="mt-2 border-l-2 border-destructive pl-3 text-xs text-destructive">
                                  Blocked by a non-negotiable smoking preference.
                                </p>
                              )}
                              <dl className="mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-2">
                                {r.parts.map((p) => (
                                  <div key={p.label}>
                                    <div className="flex items-baseline justify-between">
                                      <dt className="text-xs">{p.label}</dt>
                                      <dd className="font-mono text-[11px] tabular-nums text-muted-foreground">
                                        {Math.round(p.value * p.weight)}/{p.weight}
                                      </dd>
                                    </div>
                                    <div className="mt-1.5">
                                      <TrustBar value={p.value * 100} />
                                    </div>
                                  </div>
                                ))}
                              </dl>
                            </li>
                          ))}
                        </ol>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <Empty>No sessions saved yet — run the matcher and save the result.</Empty>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "mt-2 w-full border-b border-input bg-transparent py-1.5 text-sm outline-none focus:border-foreground";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border pb-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono tabular-nums">{value}</span>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-5 border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}
