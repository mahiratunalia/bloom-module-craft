"use client";

import { useEffect, useState } from "react";

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  raterIsTenant: boolean;
  raterName: string;
};

export function ReviewPanel({
  applicationId,
  viewerIsTenant,
}: {
  applicationId: string;
  viewerIsTenant: boolean;
}) {
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch(`/api/reviews?applicationId=${applicationId}`);
    setReviews(res.ok ? await res.json() : []);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ applicationId, rating, comment: comment || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not submit review.");
      setComment("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit review.");
    } finally {
      setSubmitting(false);
    }
  }

  if (reviews === null) {
    return (
      <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
        Loading review…
      </p>
    );
  }

  const myReview = reviews.find((r) => r.raterIsTenant === viewerIsTenant);
  const otherReview = reviews.find((r) => r.raterIsTenant !== viewerIsTenant);

  return (
    <div className="mt-4 space-y-3 border-t border-border pt-4">
      {myReview ? (
        <div className="text-sm">
          <span className="eyebrow">Your review</span>
          <p className="mt-1">
            {"★".repeat(myReview.rating)}
            {"☆".repeat(5 - myReview.rating)}
          </p>
          {myReview.comment && (
            <p className="mt-1 text-muted-foreground italic">&ldquo;{myReview.comment}&rdquo;</p>
          )}
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <span className="eyebrow">Leave a review</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
                className={`text-lg ${n <= rating ? "text-accent" : "text-muted-foreground"}`}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            placeholder="Optional comment"
            className="w-full border-b border-input bg-transparent py-1.5 text-sm outline-none focus:border-foreground"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-accent px-4 py-2 text-xs text-accent-foreground hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit review"}
          </button>
        </form>
      )}

      {otherReview && (
        <div className="text-sm">
          <span className="eyebrow">{otherReview.raterName}&apos;s review</span>
          <p className="mt-1">
            {"★".repeat(otherReview.rating)}
            {"☆".repeat(5 - otherReview.rating)}
          </p>
          {otherReview.comment && (
            <p className="mt-1 text-muted-foreground italic">&ldquo;{otherReview.comment}&rdquo;</p>
          )}
        </div>
      )}
    </div>
  );
}
