"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { buildShoppingShareText, type ShareItem } from "@/lib/share/build-shopping-share-text";

type PendingGroup = {
  category: string;
  items: { id: string; text: string }[];
};

type Props = {
  groups: PendingGroup[];
};

function flattenGroups(groups: PendingGroup[]): ShareItem[] {
  const list: ShareItem[] = [];
  for (const group of groups) {
    for (const item of group.items) {
      list.push({
        id: item.id,
        text: item.text,
        category: group.category,
      });
    }
  }
  return list;
}

export function ShareShoppingModal({ groups }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  const allItems = useMemo(() => flattenGroups(groups), [groups]);
  const allIds = useMemo(() => allItems.map((item) => item.id), [allItems]);
  const hasItems = allItems.length > 0;

  const selectedItems = useMemo(
    () => allItems.filter((item) => selectedIds.has(item.id)),
    [allItems, selectedIds],
  );

  useEffect(() => {
    if (!isOpen) return;

    const titleNode = titleRef.current;
    if (titleNode) {
      titleNode.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (panelRef.current?.contains(target)) return;
      setIsOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  function toggleItem(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(allIds));
  }

  function deselectAll() {
    setSelectedIds(new Set());
  }

  async function copySelection() {
    try {
      const text = buildShoppingShareText(selectedItems);
      await navigator.clipboard.writeText(text);
      setFeedback("Testo copiato.");
    } catch {
      setFeedback("Impossibile copiare automaticamente.");
    }
  }

  async function shareSelection() {
    let text = "";
    try {
      text = buildShoppingShareText(selectedItems);
      if (navigator.share) {
        await navigator.share({
          title: "Lista da comprare",
          text,
        });
        setFeedback("Condiviso.");
        return;
      }

      await navigator.clipboard.writeText(text);
      setFeedback("Condivisione non disponibile: testo copiato.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      try {
        if (!text) {
          text = buildShoppingShareText(selectedItems);
        }
        await navigator.clipboard.writeText(text);
        setFeedback("Condivisione non riuscita: testo copiato.");
      } catch {
        setFeedback("Impossibile condividere o copiare.");
      }
    }
  }

  return (
    <>
      <button
        type="button"
        className="ios-btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!hasItems}
        onClick={() => {
          setSelectedIds(new Set(allIds));
          setFeedback("");
          setIsOpen(true);
        }}
      >
        Condividi lista
      </button>

      {isOpen && typeof document !== "undefined"
        ? createPortal(
            <div className="ios-share-overlay" role="presentation">
              <div
                ref={panelRef}
                className="ios-share-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="share-shopping-title"
              >
                <h3
                  id="share-shopping-title"
                  ref={titleRef}
                  tabIndex={-1}
                  className="text-sm font-semibold text-zinc-800 outline-none"
                >
                  Condividi lista da comprare
                </h3>

                {hasItems ? (
                  <>
                    <div className="mt-2 flex items-center gap-2">
                      <button type="button" className="ios-btn-secondary h-7 text-[11px]" onClick={selectAll}>
                        Seleziona tutti
                      </button>
                      <button type="button" className="ios-btn-secondary h-7 text-[11px]" onClick={deselectAll}>
                        Deseleziona tutti
                      </button>
                    </div>

                    <div className="mt-2 max-h-72 overflow-auto rounded-xl border border-zinc-200 bg-white/90 p-2">
                      {groups.map((group) => (
                        <div key={group.category} className="mb-2 last:mb-0">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-600">
                            {group.category}
                          </p>
                          <ul className="mt-1 space-y-1">
                            {group.items.map((item) => {
                              const checked = selectedIds.has(item.id);
                              return (
                                <li key={item.id}>
                                  <label className="ios-share-item-row">
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={(event) => {
                                        toggleItem(item.id, event.target.checked);
                                      }}
                                    />
                                    <span className="ios-share-item-label">{item.text}</span>
                                  </label>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      ))}
                    </div>

                    {feedback ? <p className="mt-2 text-xs text-zinc-600">{feedback}</p> : null}

                    <div className="mt-3 flex items-center justify-end gap-2">
                      <button type="button" className="ios-btn-secondary" onClick={() => setIsOpen(false)}>
                        Annulla
                      </button>
                      <button
                        type="button"
                        className="ios-btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={selectedItems.length === 0}
                        onClick={() => {
                          void copySelection();
                        }}
                      >
                        Copia
                      </button>
                      <button
                        type="button"
                        className="ios-btn-primary disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={selectedItems.length === 0}
                        onClick={() => {
                          void shareSelection();
                        }}
                      >
                        Condividi
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="mt-2 text-xs text-zinc-600">Nessun prodotto da condividere.</p>
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
