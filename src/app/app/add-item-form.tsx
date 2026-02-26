"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
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

type SpeechRecognitionAlternativeLite = {
  transcript: string;
};

type SpeechRecognitionResultLite = {
  0: SpeechRecognitionAlternativeLite;
};

type SpeechRecognitionEventLite = {
  results: ArrayLike<SpeechRecognitionResultLite>;
};

type SpeechRecognitionErrorEventLite = {
  error: string;
};

type SpeechRecognitionLite = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLite) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLite) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLite;

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
  const textInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLite | null>(null);
  const [query, setQuery] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState("");
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
      setVoiceMessage("Salvato offline. Verrà sincronizzato al ritorno online.");
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
          setVoiceMessage("Connessione assente: aggiunta messa in coda.");
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
        setVoiceMessage("Errore rete: aggiunta messa in coda offline.");
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
      setVoiceMessage("Sincronizzazione offline completata.");
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
    if (typeof window === "undefined") {
      return;
    }

    const maybeCtor = (
      window as Window & {
        SpeechRecognition?: SpeechRecognitionCtor;
        webkitSpeechRecognition?: SpeechRecognitionCtor;
      }
    ).SpeechRecognition ??
      (
        window as Window & {
          webkitSpeechRecognition?: SpeechRecognitionCtor;
        }
      ).webkitSpeechRecognition;

    setVoiceSupported(Boolean(maybeCtor));

    return () => {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    };
  }, []);

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

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitItem(query, selectedProductId);
  }

  function startVoiceInput() {
    if (typeof window === "undefined") {
      return;
    }

    const RecognitionCtor = (
      window as Window & {
        SpeechRecognition?: SpeechRecognitionCtor;
        webkitSpeechRecognition?: SpeechRecognitionCtor;
      }
    ).SpeechRecognition ??
      (
        window as Window & {
          webkitSpeechRecognition?: SpeechRecognitionCtor;
        }
      ).webkitSpeechRecognition;

    if (!RecognitionCtor) {
      setVoiceMessage("Comandi vocali non supportati su questo browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new RecognitionCtor();
    recognition.lang = "it-IT";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim() ?? "";
      if (!transcript) {
        setVoiceMessage("Nessuna trascrizione ricevuta.");
        return;
      }

      setSelectedProductId(null);
      setQuery(transcript);
      setSuggestions([]);
      setVoiceMessage("Trascrizione pronta. Conferma con Aggiungi.");
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setVoiceMessage("Permesso microfono negato. Usa la tastiera.");
      } else {
        setVoiceMessage("Errore nella dettatura. Riprova o usa la tastiera.");
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    setVoiceMessage("Ascolto in corso...");
    setIsListening(true);
    recognition.start();
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3">
      <input
        ref={textInputRef}
        name="text"
        required
        minLength={1}
        maxLength={120}
        className="h-11 rounded-2xl border border-zinc-300 bg-white px-4 text-[15px] outline-none ring-0 focus:border-[#007AFF]"
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

        <button
          type="button"
          onClick={startVoiceInput}
          disabled={!voiceSupported}
          className="ios-btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isListening ? "Ascolto..." : "Voce"}
        </button>
      </div>

      <div className="w-full">
        <p className="text-xs text-zinc-500">{hint}</p>
        {voiceMessage ? <p className="mt-1 text-xs text-zinc-600">{voiceMessage}</p> : null}
        {offlineQueueSize > 0 ? (
          <p className="mt-1 text-xs text-amber-700">
            Operazioni offline in coda: {offlineQueueSize}
          </p>
        ) : null}
        {suggestions.length > 0 ? (
          <ul className="mt-2 max-h-44 overflow-auto rounded-2xl border border-zinc-200 bg-white">
            {suggestions.map((suggestion) => (
              <li key={suggestion.productId}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm hover:bg-zinc-50"
                  onClick={() => {
                    setQuery(suggestion.label);
                    setSelectedProductId(suggestion.productId);
                    setSuggestions([]);
                    void submitItem(suggestion.label, suggestion.productId);
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
        {formError ? <p className="mt-2 text-sm text-red-600">{formError}</p> : null}
      </div>
    </form>
  );
}
