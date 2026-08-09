"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  id: string;
  type: "savedListing" | "application" | "roommateSession" | "agreementDraft";
};

export function DeleteButton({ id, type }: Props) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  async function del() {
    setBusy(true);
    try {
      await fetch("/api/profile/delete", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, type }),
      });
      router.refresh();
    } finally {
      setBusy(false);
      setConfirm(false);
    }
  }

  if (!confirm) {
    return (
      <button
        type="button"
        onClick={() => setConfirm(true)}
        className="font-mono text-[11px] text-muted-foreground hover:text-destructive"
      >
        delete
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[11px] text-muted-foreground">sure?</span>
      <button
        type="button"
        onClick={del}
        disabled={busy}
        className="font-mono text-[11px] text-destructive hover:underline disabled:opacity-50"
      >
        {busy ? "…" : "yes"}
      </button>
      <button
        type="button"
        onClick={() => setConfirm(false)}
        className="font-mono text-[11px] text-muted-foreground hover:underline"
      >
        no
      </button>
    </div>
  );
}
