import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { TrustBar } from "@/components/trust";
import { bdt, compatibility, roommateCandidates, type RoommateProfile } from "@/data/module1";
import { useSession } from "@/hooks/use-session";
import {
  useRoommatePreferences,
  useRoommateSessions,
  useSaveRoommatePreferences,
  useSaveRoommateSession,
} from "@/lib/user-data";

export const Route = createFileRoute("/roommates")({
  head: () => ({
    meta: [
      { title: "Roommate compatibility matching — BasaKhuji" },
      {
        name: "description",
        content:
          "Fill a lifestyle profile — budget, sleep schedule, smoking, study habits, visitors — and see deterministic compatibility scores with other mess applicants.",
      },
      { property: "og:title", content: "Roommate compatibility matching — BasaKhuji" },
      {
        property: "og:description",
        content: "A fixed weighted algorithm, not a black box: 30/20/20/15/15 across five lifestyle signals.",
      },
    ],
  }),
  component: RoommatesPage,
});

function RoommatesPage() {
  const { user } = useSession();
  const userId = user?.id;
  const savedPrefs = useRoommatePreferences(userId);
  const savePrefs = useSaveRoommatePreferences(userId);
  const saveSession = useSaveRoommateSession(userId);
  const sessions = useRoommateSessions(userId);
  const [label, setLabel] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [profile, setProfile] = useState<RoommateProfile>({
    budget: 6500,
    sleep: "Late",
    smoking: "No",
    smokingNonNegotiable: true,
    study: "Quiet",
    visitors: "Rare",
  });

  useEffect(() => {
    const p = savedPrefs.data;
    if (!p) return;
    setProfile({
      budget: p.budget,
      sleep: p.sleep as RoommateProfile["sleep"],
      smoking: p.smoking as RoommateProfile["smoking"],
      smokingNonNegotiable: p.smoking_non_negotiable,
      study: p.study as RoommateProfile["study"],
      visitors: p.visitors as RoommateProfile["visitors"],
    });
  }, [savedPrefs.data]);

  const matches = useMemo(
    () =>
      roommateCandidates
        .map((c) => ({ candidate: c, result: compatibility(profile, c) }))
        .sort((a, b) => b.result.total - a.result.total),
    [profile],
  );

  const set = <K extends keyof RoommateProfile>(key: K, value: RoommateProfile[K]) =>
    setProfile((p) => ({ ...p, [key]: value }));

  async function persistSession() {
    setStatus(null);
    await saveSession.mutateAsync({
      label: label.trim() || `Session · ${new Date().toLocaleDateString("en-GB")}`,
      profile,
      results: matches.map(({ candidate, result }) => ({
        candidateId: candidate.id,
        candidateName: candidate.name,
        detail: candidate.detail,
        total: result.total,
        hardBlocked: result.hardBlocked,
        parts: result.parts.map((p) => ({ label: p.label, weight: p.weight, value: p.value })),
      })),
    });
    setLabel("");
    setStatus("Session saved — reopen it any time from your profile with identical scores.");
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <header className="border-b border-border pb-8">
        <p className="eyebrow">Shared mess accommodation</p>
        <h1 className="mt-4 max-w-2xl text-4xl leading-tight sm:text-5xl">
          Compatibility is arithmetic, <em className="italic">not a guess.</em>
        </h1>
        <p className="mt-5 max-w-xl text-[15px] text-muted-foreground">
          Budget overlap 30% · sleep schedule 20% · smoking 20% (hard filter when non-negotiable) ·
          study habits 15% · visitor tolerance 15%.
        </p>
      </header>

      <div className="mt-10 grid gap-14 lg:grid-cols-[340px_1fr]">
        <form className="space-y-8">
          <div>
            <span className="eyebrow">Monthly budget · {bdt(profile.budget)}</span>
            <input
              type="range"
              min={4000}
              max={12000}
              step={250}
              value={profile.budget}
              onChange={(e) => set("budget", Number(e.target.value))}
              className="mt-3 w-full accent-[var(--primary)]"
            />
          </div>

          <Choice
            label="Sleep schedule"
            options={["Early", "Flexible", "Late"] as const}
            value={profile.sleep}
            onChange={(v) => set("sleep", v)}
          />
          <Choice
            label="Smoking"
            options={["No", "Tolerant", "Yes"] as const}
            value={profile.smoking}
            onChange={(v) => set("smoking", v)}
          />
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={profile.smokingNonNegotiable}
              onChange={(e) => set("smokingNonNegotiable", e.target.checked)}
              className="size-4 accent-[var(--primary)]"
            />
            Smoking preference is non-negotiable
          </label>
          <Choice
            label="Study habits"
            options={["Quiet", "Mixed", "Social"] as const}
            value={profile.study}
            onChange={(v) => set("study", v)}
          />
          <Choice
            label="Visitor tolerance"
            options={["Rare", "Occasional", "Frequent"] as const}
            value={profile.visitors}
            onChange={(v) => set("visitors", v)}
          />

          {user ? (
            <div className="space-y-4 border-t border-border pt-6">
              <button
                type="button"
                onClick={() => savePrefs.mutate(profile)}
                disabled={savePrefs.isPending}
                className="w-full border border-foreground px-4 py-2.5 text-xs hover:bg-foreground hover:text-paper disabled:opacity-50"
              >
                {savePrefs.isPending ? "Saving…" : "Save these preferences to my profile"}
              </button>
              <label className="block">
                <span className="eyebrow">Session name</span>
                <input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Mohammadpur mess, September"
                  className="mt-2 w-full border-b border-input bg-transparent py-1.5 text-sm outline-none focus:border-foreground"
                />
              </label>
              <button
                type="button"
                onClick={persistSession}
                disabled={saveSession.isPending}
                className="w-full bg-foreground px-4 py-3 text-sm text-paper hover:opacity-90 disabled:opacity-50"
              >
                {saveSession.isPending ? "Saving…" : "Save this matching session"}
              </button>
              {status && <p className="text-xs text-primary">{status}</p>}
              {sessions.data && sessions.data.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {sessions.data.length} saved session{sessions.data.length === 1 ? "" : "s"} ·{" "}
                  <Link to="/profile" className="underline underline-offset-4">
                    revisit them
                  </Link>
                </p>
              )}
            </div>
          ) : (
            <p className="border-t border-border pt-6 text-xs text-muted-foreground">
              <Link to="/auth" className="underline underline-offset-4">
                Sign in
              </Link>{" "}
              to save these preferences and keep a matching session you can revisit with the same
              compatibility results.
            </p>
          )}
        </form>

        <section>
          <h2 className="text-2xl">Candidates on shared listings</h2>
          <ul className="mt-5 space-y-px">
            {matches.map(({ candidate, result }) => (
              <li key={candidate.id} className="border border-border p-6">
                <div className="flex flex-wrap items-baseline justify-between gap-4">
                  <div>
                    <h3 className="text-xl">{candidate.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{candidate.detail}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-3xl tabular-nums">{result.total}%</span>
                    <p className="eyebrow">compatible</p>
                  </div>
                </div>

                {result.hardBlocked && (
                  <p className="mt-4 border-l-2 border-destructive pl-3 text-xs text-destructive">
                    Blocked by a non-negotiable smoking preference — scored 0 regardless of the other
                    signals.
                  </p>
                )}

                <dl className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                  {result.parts.map((p) => (
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

                <p className="mt-5 font-mono text-[11px] text-muted-foreground">
                  {bdt(candidate.budget)} budget · sleeps {candidate.sleep.toLowerCase()} ·{" "}
                  {candidate.study.toLowerCase()} study · {candidate.visitors.toLowerCase()} visitors
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function Choice<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <span className="eyebrow">{label}</span>
      <div className="mt-3 flex">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            className={`flex-1 border px-3 py-2 text-xs transition-colors ${
              value === o
                ? "border-foreground bg-foreground text-paper"
                : "border-border hover:bg-secondary"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}