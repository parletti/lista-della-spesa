"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  itemId: string;
  label: string;
};

export function OptimisticToggleButton({ itemId, label }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onToggle() {
    setPending(true);
    setError(null);

    const row = document.querySelector<HTMLElement>(`[data-item-row-id="${itemId}"]`);
    const previousDisplay = row?.style.display ?? "";
    if (row) {
      row.style.display = "none";
    }

    try {
      const response = await fetch("/api/items", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!response.ok || !payload?.ok) {
        if (row) row.style.display = previousDisplay;
        setError(payload?.error ?? "Impossibile aggiornare lo stato.");
        return;
      }

      router.refresh();
    } catch {
      if (row) row.style.display = previousDisplay;
      setError("Errore rete durante aggiornamento.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onToggle}
        disabled={pending}
        className="ios-btn-secondary h-8 px-3 text-xs disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "..." : label}
      </button>
      {error ? <span className="max-w-40 text-right text-[10px] text-red-600">{error}</span> : null}
    </div>
  );
}
