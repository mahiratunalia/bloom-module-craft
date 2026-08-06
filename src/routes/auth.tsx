import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in or create a BasaKhuji profile" },
      {
        name: "description",
        content:
          "Create a BasaKhuji profile to save listings, keep track of applications and revisit roommate matching sessions with the same compatibility results.",
      },
      { property: "og:title", content: "Sign in or create a BasaKhuji profile" },
      {
        property: "og:description",
        content: "Saved listings, applications and roommate matching preferences, kept on your profile.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user, loading } = useSession();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [accountType, setAccountType] = useState("tenant");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) void navigate({ to: "/profile", replace: true });
  }, [loading, user, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: displayName || email.split("@")[0], account_type: accountType },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setMessage("Check your inbox and confirm your email address to finish signing up.");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <div className="grid gap-14 lg:grid-cols-[1fr_420px]">
        <div>
          <p className="eyebrow">Profiles</p>
          <h1 className="mt-4 max-w-lg text-4xl leading-tight sm:text-5xl">
            Keep your record <em className="italic">with you.</em>
          </h1>
          <p className="mt-5 max-w-md text-[15px] text-muted-foreground">
            A BasaKhuji profile saves the listings you shortlisted, the applications you sent, your
            roommate preferences, and every matching session you ran — reopened later with identical
            compatibility results.
          </p>
          <ul className="mt-8 space-y-3 border-t border-border pt-6 text-sm text-muted-foreground">
            <li>Shortlist listings as a tenant, and track the applications you have submitted.</li>
            <li>Store lifestyle preferences once; the matcher pre-fills them next visit.</li>
            <li>Save a matching session and revisit the exact scores it produced.</li>
          </ul>
        </div>

        <div className="border border-border p-8">
          <div className="flex">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setMessage(null);
                }}
                className={`flex-1 border px-3 py-2 text-xs transition-colors ${
                  mode === m
                    ? "border-foreground bg-foreground text-paper"
                    : "border-border hover:bg-secondary"
                }`}
              >
                {m === "signin" ? "Sign in" : "Create profile"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-6 space-y-5">
            {mode === "signup" && (
              <>
                <label className="block">
                  <span className="eyebrow">Display name</span>
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className={inputCls}
                    placeholder="Tanzila Rahman"
                  />
                </label>
                <div>
                  <span className="eyebrow">I am a</span>
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
              </>
            )}
            <label className="block">
              <span className="eyebrow">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputCls}
              />
            </label>
            <label className="block">
              <span className="eyebrow">Password</span>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputCls}
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="w-full bg-foreground px-4 py-3 text-sm text-paper hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "Working…" : mode === "signin" ? "Sign in" : "Create profile"}
            </button>
          </form>

          {message && (
            <p className="mt-5 border-l-2 border-accent pl-3 text-xs text-muted-foreground">{message}</p>
          )}

          <p className="mt-8 text-xs text-muted-foreground">
            Browsing without an account still works —{" "}
            <Link to="/" className="underline underline-offset-4">
              search listings
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "mt-2 w-full border-b border-input bg-transparent py-1.5 text-sm outline-none focus:border-foreground";
