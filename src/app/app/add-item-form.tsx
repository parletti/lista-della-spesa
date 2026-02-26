"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { addShoppingItemAction } from "@/app/app/actions";

type AddItemState = { ok: boolean; error?: string } | null;
const initialState: AddItemState = null;

type Suggestion = {
  productId: string;
  label: string;
  categoryLabel: string | null;
};

export function AddItemForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const selectedIdRef = useRef<HTMLInputElement>(null);
  const [state, formAction, pending] = useActionState(
    addShoppingItemAction,
    initialState,
  );
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    if (state?.ok) {
      setQuery("");
      if (selectedIdRef.current) {
        selectedIdRef.current.value = "";
      }
      setSuggestions([]);
      router.refresh();
    }
  }, [router, state]);

  useEffect(() => {
    let isCancelled = false;

    if (!query.trim()) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const response = await fetch(
          `/api/autocomplete?q=${encodeURIComponent(query.trim())}`,
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
    if (suggestions.length === 0) return "Nessun suggerimento trovato.";
    return "Seleziona un suggerimento oppure invia testo libero.";
  }, [loadingSuggestions, query, suggestions.length]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="mt-4 flex flex-col gap-3 sm:flex-row"
    >
      <input
        ref={textInputRef}
        name="text"
        required
        minLength={1}
        maxLength={120}
        className="h-11 flex-1 rounded-md border border-zinc-300 px-3"
        placeholder="Es. latte, pane, mele..."
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          if (selectedIdRef.current) {
            selectedIdRef.current.value = "";
          }
        }}
      />
      <input
        ref={selectedIdRef}
        type="hidden"
        name="selected_product_id"
        defaultValue=""
      />
      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-md bg-black px-4 text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Aggiunta..." : "Aggiungi"}
      </button>
      <div className="w-full sm:basis-full">
        <p className="text-xs text-zinc-500">{hint}</p>
        {suggestions.length > 0 ? (
          <ul className="mt-2 max-h-44 overflow-auto rounded-md border border-zinc-200 bg-white">
            {suggestions.map((suggestion) => (
              <li key={suggestion.productId}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-zinc-50"
                  onClick={() => {
                    if (textInputRef.current) {
                      textInputRef.current.value = suggestion.label;
                    }
                    if (selectedIdRef.current) {
                      selectedIdRef.current.value = suggestion.productId;
                    }
                    setQuery(suggestion.label);
                    setSuggestions([]);
                    formRef.current?.requestSubmit();
                  }}
                >
                  <span>{suggestion.label}</span>
                  <span className="text-xs text-zinc-500">
                    {suggestion.categoryLabel ?? "Senza categoria"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {state?.error ? <p className="mt-2 text-sm text-red-600">{state.error}</p> : null}
      </div>
    </form>
  );
}
