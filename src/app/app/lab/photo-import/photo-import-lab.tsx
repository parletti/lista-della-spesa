"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { normalizeProductText } from "@/lib/catalog/normalize";
import { parseShoppingLinesFromOcr } from "@/lib/ocr/parse-shopping-lines";

type Suggestion = {
  productId: string;
  label: string;
  categoryLabel: string | null;
  confidence: number;
};

type Candidate = {
  id: string;
  text: string;
  selected: boolean;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  selectedProductId: string | null;
  categoryLabel: string | null;
};

const OCR_OPTIONS = {
  workerPath: "https://cdn.jsdelivr.net/npm/tesseract.js@v7.0.0/dist/worker.min.js",
  corePath: "https://cdn.jsdelivr.net/npm/tesseract.js-core@v7.0.0",
  langPath: "https://tessdata.projectnaptha.com/4.0.0",
  gzip: true,
} as const;

function confidenceLabel(value: Candidate["confidence"]) {
  if (value === "HIGH") return "Alta";
  if (value === "MEDIUM") return "Media";
  return "Bassa";
}

function isMobileViewport() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 767px)").matches;
}

export function PhotoImportLab() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [viewportReady, setViewportReady] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rawText, setRawText] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const selectedCount = useMemo(
    () => candidates.filter((candidate) => candidate.selected).length,
    [candidates],
  );

  useEffect(() => {
    setIsMobile(isMobileViewport());
    setViewportReady(true);
  }, []);

  async function fetchTopSuggestion(query: string) {
    if (query.trim().length < 3) return null;
    const response = await fetch(`/api/autocomplete?q=${encodeURIComponent(query.trim())}`);
    if (!response.ok) return null;
    const payload = (await response.json().catch(() => null)) as
      | { suggestions?: Suggestion[] }
      | null;
    const top = payload?.suggestions?.[0];
    return top ?? null;
  }

  function resolveConfidence(text: string, suggestion: Suggestion | null): Candidate["confidence"] {
    if (!suggestion) return "LOW";
    const source = normalizeProductText(text);
    const target = normalizeProductText(suggestion.label);
    if (source === target) return "HIGH";
    if (source && (target.includes(source) || source.includes(target))) return "MEDIUM";
    return "LOW";
  }

  async function extractFromFile(file: File) {
    setExtracting(true);
    setError("");
    setStatusMessage("");
    setProgressMessage("Preparazione OCR...");
    setRawText("");
    setCandidates([]);

    try {
      const { createWorker } = await import("tesseract.js");
      const runWithLang = async (lang: "ita" | "eng") => {
        const worker = await createWorker(lang, 1, {
          ...OCR_OPTIONS,
          logger: (message) => {
            if (!message.status) return;
            const pct = Math.round((message.progress ?? 0) * 100);
            setProgressMessage(
              `[${lang}] ${message.status} ${Number.isFinite(pct) ? `${pct}%` : ""}`.trim(),
            );
          },
          errorHandler: (workerError) => {
            const details =
              workerError instanceof Error
                ? workerError.message
                : typeof workerError === "string"
                  ? workerError
                  : JSON.stringify(workerError);
            setProgressMessage(`[${lang}] errore worker: ${details}`);
          },
        });
        try {
          const result = await worker.recognize(file);
          return result.data.text?.trim() ?? "";
        } finally {
          await worker.terminate();
        }
      };

      let text = "";
      let primaryError: unknown = null;
      try {
        text = await runWithLang("ita");
      } catch (langError) {
        primaryError = langError;
      }

      if (!text) {
        try {
          setProgressMessage("Fallback OCR in corso (eng)...");
          text = await runWithLang("eng");
        } catch (fallbackError) {
          const primary =
            primaryError instanceof Error
              ? primaryError.message
              : typeof primaryError === "string"
                ? primaryError
                : JSON.stringify(primaryError);
          const secondary =
            fallbackError instanceof Error
              ? fallbackError.message
              : typeof fallbackError === "string"
                ? fallbackError
                : JSON.stringify(fallbackError);
          throw new Error(`ita failed: ${primary} | eng failed: ${secondary}`);
        }
      }

      setRawText(text);
      if (!text) {
        setError("Nessun testo rilevato. Prova con una foto più nitida.");
        return;
      }

      setProgressMessage("Analisi righe e suggerimenti...");
      const lines = parseShoppingLinesFromOcr(text);
      if (lines.length === 0) {
        setError("Nessun alimento riconosciuto in modo utile.");
        return;
      }

      const resolved: Candidate[] = [];
      for (const line of lines) {
        const suggestion = await fetchTopSuggestion(line);
        resolved.push({
          id: crypto.randomUUID(),
          text: suggestion?.label ?? line,
          selected: true,
          confidence: resolveConfidence(line, suggestion),
          selectedProductId: suggestion?.productId ?? null,
          categoryLabel: suggestion?.categoryLabel ?? null,
        });
      }
      setCandidates(resolved);
      setProgressMessage("");
    } catch (extractError) {
      const details =
        extractError instanceof Error
          ? extractError.message
          : typeof extractError === "string"
            ? extractError
            : JSON.stringify(extractError, null, 2);
      setError(`Errore OCR locale durante l'estrazione: ${details}.`);
    } finally {
      setExtracting(false);
    }
  }

  function onSelectFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Seleziona un file immagine valido.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("Immagine troppo pesante. Usa un file fino a 8MB.");
      return;
    }

    setError("");
    setStatusMessage("");
    setCandidates([]);
    setRawText("");
    setSelectedFile(file);

    const nextUrl = URL.createObjectURL(file);
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return nextUrl;
    });
  }

  async function addSelectedItems() {
    const selected = candidates.filter((candidate) => candidate.selected && candidate.text.trim());
    if (selected.length === 0) return;

    setSaving(true);
    setError("");
    setStatusMessage("");

    let added = 0;
    let failed = 0;

    for (const candidate of selected) {
      try {
        const response = await fetch("/api/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: candidate.text.trim(),
            selectedProductId: candidate.selectedProductId,
          }),
        });
        const payload = (await response.json().catch(() => null)) as
          | { ok?: boolean }
          | null;
        if (response.ok && payload?.ok) {
          added += 1;
        } else {
          failed += 1;
        }
      } catch {
        failed += 1;
      }
    }

    setStatusMessage(
      failed > 0
        ? `Import completato: ${added} aggiunti, ${failed} non aggiunti.`
        : `Import completato: ${added} prodotti aggiunti.`,
    );

    if (added > 0) {
      router.refresh();
    }

    setSaving(false);
  }

  return (
    <section className="ios-card p-3 sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold">Lab Import da Rullino</h2>
        <Link href="/app" className="text-xs text-[#007AFF] hover:underline">
          Torna alla lista
        </Link>
      </div>

      {viewportReady && !isMobile ? (
        <p className="mt-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Questa funzione Lab è disponibile solo da mobile.
        </p>
      ) : null}

      <div className="mt-3 space-y-2">
        <label className="block text-xs font-medium text-zinc-600">
          Seleziona foto dal rullino (una alla volta)
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={onSelectFile}
          className="block w-full text-xs text-zinc-700 file:mr-3 file:rounded-xl file:border file:border-zinc-300 file:bg-white file:px-3 file:py-2 file:text-xs file:font-medium"
          disabled={!isMobile || extracting || saving}
        />
      </div>

      {previewUrl ? (
        <div className="mt-3">
          <p className="text-xs text-zinc-500">Anteprima</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Anteprima rullino"
            className="mt-1 max-h-64 w-full rounded-xl border border-zinc-200 object-contain bg-white"
          />
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={!isMobile || !selectedFile || extracting || saving}
          onClick={() => {
            if (!selectedFile) return;
            void extractFromFile(selectedFile);
          }}
          className="ios-btn-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {extracting ? "Estrazione..." : "Estrai alimenti"}
        </button>
        {candidates.length > 0 ? (
          <button
            type="button"
            disabled={saving || selectedCount === 0}
            onClick={() => {
              void addSelectedItems();
            }}
            className="ios-btn-secondary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Salvataggio..." : `Aggiungi selezionati (${selectedCount})`}
          </button>
        ) : null}
      </div>

      {progressMessage ? <p className="mt-2 text-xs text-zinc-600">{progressMessage}</p> : null}
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
      {statusMessage ? <p className="mt-2 text-xs text-green-700">{statusMessage}</p> : null}

      {candidates.length > 0 ? (
        <div className="mt-3 rounded-xl border border-zinc-200 bg-white p-2">
          <p className="text-xs font-semibold text-zinc-700">Review prodotti riconosciuti</p>
          <ul className="mt-2 space-y-2">
            {candidates.map((candidate) => (
              <li key={candidate.id} className="rounded-lg border border-zinc-200 p-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={candidate.selected}
                      onChange={(event) => {
                        setCandidates((prev) =>
                          prev.map((item) =>
                            item.id === candidate.id
                              ? { ...item, selected: event.target.checked }
                              : item,
                          ),
                        );
                      }}
                    />
                    Includi
                  </label>
                  <span className="text-[10px] text-zinc-500">
                    Confidenza: {confidenceLabel(candidate.confidence)}
                  </span>
                </div>
                <input
                  type="text"
                  value={candidate.text}
                  onChange={(event) => {
                    const value = event.target.value;
                    setCandidates((prev) =>
                      prev.map((item) =>
                        item.id === candidate.id ? { ...item, text: value } : item,
                      ),
                    );
                  }}
                  className="mt-2 h-9 w-full rounded-lg border border-zinc-300 px-2 text-sm"
                />
                <p className="mt-1 text-[10px] text-zinc-500">
                  Categoria suggerita: {candidate.categoryLabel ?? "Altro"}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {rawText ? (
        <details className="mt-3 rounded-xl border border-zinc-200 bg-white p-2">
          <summary className="cursor-pointer text-xs font-medium text-zinc-700">
            Mostra testo OCR grezzo
          </summary>
          <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-[10px] text-zinc-600">
            {rawText}
          </pre>
        </details>
      ) : null}
    </section>
  );
}
