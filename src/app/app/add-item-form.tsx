"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Suggestion = {
  productId: string;
  label: string;
  categoryLabel: string | null;
};

type QueueItem = {
  text: string;
  selectedProductId: string | null;
  queuedAt: number;
};

const OFFLINE_QUEUE_KEY = "shopping_add_queue_v1";

function readQueue(): QueueItem[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(OFFLINE_QUEUE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as QueueItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(items: QueueItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(items));
}

export function AddItemForm() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [offlineQueueSize, setOfflineQueueSize] = useState(0);

  async function submitItem(
    text: string,
    selectedId: string | null,
    options?: { fromQueue?: boolean },
  ) {
    const fromQueue = options?.fromQueue ?? false;
    const clean = text.trim();
    if (!clean) return true;

    if (!navigator.onLine && !fromQueue) {
      const queue = readQueue();
      queue.push({ text: clean, selectedProductId: selectedId, queuedAt: Date.now() });
      writeQueue(queue);
      setOfflineQueueSize(queue.length);
      setFormError("");
      setStatusMessage("Salvato offline. Verrà sincronizzato al ritorno online.");
      setQuery("");
      setSelectedProductId(null);
      setSuggestions([]);
      return true;
    }

    try {
      setSubmitting(true);
      const response = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: clean,
          selectedProductId: selectedId,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!response.ok || !payload?.ok) {
        if (!fromQueue && !navigator.onLine) {
          const queue = readQueue();
          queue.push({ text: clean, selectedProductId: selectedId, queuedAt: Date.now() });
          writeQueue(queue);
          setOfflineQueueSize(queue.length);
          setStatusMessage("Connessione assente: aggiunta messa in coda.");
          return true;
        }
        if (!fromQueue) {
          setFormError(payload?.error ?? "Impossibile aggiungere il prodotto.");
        }
        return false;
      }

      if (!fromQueue) {
        setFormError("");
        setQuery("");
        setSelectedProductId(null);
        setSuggestions([]);
      }
      router.refresh();
      return true;
    } catch {
      if (!fromQueue) {
        const queue = readQueue();
        queue.push({ text: clean, selectedProductId: selectedId, queuedAt: Date.now() });
        writeQueue(queue);
        setOfflineQueueSize(queue.length);
        setStatusMessage("Errore rete: aggiunta messa in coda offline.");
      }
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  async function flushQueue() {
    if (!navigator.onLine) return;
    const queue = readQueue();
    if (queue.length === 0) {
      setOfflineQueueSize(0);
      return;
    }

    const remaining: QueueItem[] = [];
    for (const item of queue) {
      const ok = await submitItem(item.text, item.selectedProductId, { fromQueue: true });
      if (!ok) {
        remaining.push(item);
      }
    }

    writeQueue(remaining);
    setOfflineQueueSize(remaining.length);
    if (remaining.length === 0) {
      setStatusMessage("Sincronizzazione offline completata.");
    }
  }

  useEffect(() => {
    setOfflineQueueSize(readQueue().length);
    void flushQueue();

    const onOnline = () => {
      void flushQueue();
    };
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("online", onOnline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let isCancelled = false;
    const trimmed = query.trim();

    if (trimmed.length < 3) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const response = await fetch(
          `/api/autocomplete?q=${encodeURIComponent(trimmed)}`,
        );
        const payload = (await response.json().catch(() => null)) as
          | { suggestions?: Suggestion[] }
          | null;
        if (!isCancelled) {
          setSuggestions(payload?.suggestions ?? []);
        }
      } finally {
        if (!isCancelled) {
          setLoadingSuggestions(false);
        }
      }
    }, 180);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const hint = useMemo(() => {
    if (loadingSuggestions) return "Ricerca in corso...";
    if (!query.trim()) return "Inizia a scrivere per ricevere suggerimenti.";
    if (query.trim().length < 3) return "Digita almeno 3 caratteri per i suggerimenti.";
    if (suggestions.length === 0) return "Nessun suggerimento trovato.";
    return "Seleziona un suggerimento oppure invia testo libero.";
  }, [loadingSuggestions, query, suggestions.length]);

  const groupedSuggestions = useMemo(() => {
    const buckets = new Map<string, Suggestion[]>();
    for (const suggestion of suggestions) {
      const category = suggestion.categoryLabel ?? "Senza categoria";
      const list = buckets.get(category) ?? [];
      list.push(suggestion);
      buckets.set(category, list);
    }

    return [...buckets.entries()]
      .sort((a, b) => a[0].localeCompare(b[0], "it", { sensitivity: "base" }))
      .map(([category, items]) => ({
        category,
        items: items.sort((a, b) => a.label.localeCompare(b.label, "it", { sensitivity: "base" })),
      }));
  }, [suggestions]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitItem(query, selectedProductId);
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3">
      <input
        name="text"
        required
        minLength={1}
        maxLength={120}
        className="h-11 rounded-2xl border border-zinc-300 bg-white/95 px-4 text-[15px] outline-none ring-0 focus:border-[#007AFF]"
        placeholder="Es. latte, pane, mele..."
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setSelectedProductId(null);
        }}
      />
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="ios-btn-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Aggiunta..." : "Aggiungi"}
        </button>
      </div>

      <div className="w-full">
        <p className="text-xs text-zinc-500">{hint}</p>
        {statusMessage ? <p className="mt-1 text-xs text-zinc-600">{statusMessage}</p> : null}
        {offlineQueueSize > 0 ? (
          <p className="mt-1 text-xs text-amber-700">
            Operazioni offline in coda: {offlineQueueSize}
          </p>
        ) : null}
        {groupedSuggestions.length > 0 ? (
          <ul className="ios-suggestions mt-2 max-h-56 overflow-auto rounded-2xl">
            {groupedSuggestions.map((group) => (
              <li key={group.category} className="border-b border-zinc-100 last:border-b-0">
                <p className="suggestion-category px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.08em]">
                  {group.category}
                </p>
                <ul>
                  {group.items.map((suggestion) => (
                    <li key={suggestion.productId}>
                      <button
                        type="button"
                        className="suggestion-item flex w-full items-center justify-between py-2.5 pr-3 pl-7 text-left text-sm"
                        onClick={() => {
                          setQuery(suggestion.label);
                          setSelectedProductId(suggestion.productId);
                          setSuggestions([]);
                          void submitItem(suggestion.label, suggestion.productId);
                        }}
                      >
                        <span>{suggestion.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        ) : null}
        {formError ? <p className="mt-2 text-sm text-red-600">{formError}</p> : null}
      </div>
    </form>
  );
}
