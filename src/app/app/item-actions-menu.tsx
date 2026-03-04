"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  deleteShoppingItemAction,
  updateShoppingItemTextAction,
  updateShoppingItemCategoryAction,
} from "@/app/app/actions";
import type { NutritionFactRow } from "@/lib/nutrition/types";

type CategoryOption = {
  id: string;
  label: string;
};

type Props = {
  itemId: string;
  currentText: string;
  currentCategoryId: string | null;
  categories: CategoryOption[];
  productId: string | null;
  nutritionFact: NutritionFactRow | null;
};

type MenuPosition = {
  top: number;
  left: number;
};

const MENU_WIDTH = 260;

export function ItemActionsMenu({
  itemId,
  currentText,
  currentCategoryId,
  categories,
  productId,
  nutritionFact,
}: Props) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const categoryFormRef = useRef<HTMLFormElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isNutritionOpen, setIsNutritionOpen] = useState(false);
  const [position, setPosition] = useState<MenuPosition>({ top: 0, left: 0 });

  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      const trigger = triggerRef.current;
      const panel = panelRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const panelHeight = panel?.offsetHeight ?? 220;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const margin = 8;

      let left = rect.right - MENU_WIDTH;
      if (left < margin) left = margin;
      if (left + MENU_WIDTH > viewportWidth - margin) {
        left = viewportWidth - margin - MENU_WIDTH;
      }

      const placeAbove = rect.top - panelHeight - margin >= margin;
      const top = placeAbove ? rect.top - panelHeight - margin : rect.bottom + margin;

      setPosition({
        top: Math.max(margin, Math.min(top, viewportHeight - panelHeight - margin)),
        left,
      });
    };

    updatePosition();

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;

      if (panelRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      setIsOpen(false);
      setIsNutritionOpen(false);
    };

      const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        setIsNutritionOpen(false);
      }
    };

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="ios-btn-secondary flex h-6 w-6 items-center justify-center px-0 text-[10px]"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={() => {
          setIsOpen((prev) => {
            const next = !prev;
            if (!next) {
              setIsNutritionOpen(false);
            }
            return next;
          });
        }}
      >
        ...
      </button>

      {isOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={panelRef}
              style={{
                position: "fixed",
                top: position.top,
                left: position.left,
                width: MENU_WIDTH,
                zIndex: 2147483647,
              }}
              className="rounded-xl border border-zinc-200 bg-white p-2.5 shadow-xl"
            >
              <form
                ref={categoryFormRef}
                action={updateShoppingItemCategoryAction}
                className="flex flex-col gap-2"
              >
                <input type="hidden" name="item_id" value={itemId} />
                <label className="text-xs font-medium text-zinc-600">Categoria</label>
                <select
                  name="category_id"
                  defaultValue={currentCategoryId ?? ""}
                  className="h-7 rounded-lg border border-zinc-300 bg-white/95 px-2 text-[11px]"
                  onChange={() => {
                    categoryFormRef.current?.requestSubmit();
                    setIsOpen(false);
                    setIsNutritionOpen(false);
                  }}
                >
                  <option value="">Altro / Nessuna</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </form>
              <div className="my-2 border-t border-zinc-200" />
              <form action={deleteShoppingItemAction}>
                <input type="hidden" name="item_id" value={itemId} />
                <button className="ios-btn-danger w-full">
                  Elimina
                </button>
              </form>
              <div className="my-2 border-t border-zinc-200" />
              <button
                type="button"
                className="ios-btn-secondary h-7 w-full text-[11px]"
                onClick={() => {
                  setIsNutritionOpen((prev) => !prev);
                }}
              >
                Valori nutrizionali
              </button>
              {isNutritionOpen ? (
                <div className="ios-nutrition-card mt-2">
                  <h5 className="ios-nutrition-title">{currentText}</h5>
                  {productId && nutritionFact ? (
                    <>
                      <p className="ios-nutrition-meta">
                        Per {nutritionFact.per_quantity}
                        {nutritionFact.per_unit}
                      </p>
                      <dl className="ios-nutrition-table">
                        <div className="ios-nutrition-row">
                          <dt>Energia</dt>
                          <dd>
                            {nutritionFact.energy_kcal != null ? `${nutritionFact.energy_kcal} kcal` : "-"}
                          </dd>
                        </div>
                        <div className="ios-nutrition-row">
                          <dt>Carboidrati</dt>
                          <dd>
                            {nutritionFact.carbohydrates_g != null ? `${nutritionFact.carbohydrates_g} g` : "-"}
                          </dd>
                        </div>
                        <div className="ios-nutrition-row">
                          <dt>Zuccheri</dt>
                          <dd>{nutritionFact.sugars_g != null ? `${nutritionFact.sugars_g} g` : "-"}</dd>
                        </div>
                        <div className="ios-nutrition-row">
                          <dt>Proteine</dt>
                          <dd>{nutritionFact.proteins_g != null ? `${nutritionFact.proteins_g} g` : "-"}</dd>
                        </div>
                        <div className="ios-nutrition-row">
                          <dt>Grassi</dt>
                          <dd>{nutritionFact.fats_g != null ? `${nutritionFact.fats_g} g` : "-"}</dd>
                        </div>
                        <div className="ios-nutrition-row">
                          <dt>Grassi saturi</dt>
                          <dd>
                            {nutritionFact.saturated_fats_g != null
                              ? `${nutritionFact.saturated_fats_g} g`
                              : "-"}
                          </dd>
                        </div>
                        <div className="ios-nutrition-row">
                          <dt>Sale</dt>
                          <dd>{nutritionFact.salt_g != null ? `${nutritionFact.salt_g} g` : "-"}</dd>
                        </div>
                      </dl>
                      <p className="ios-nutrition-source">Fonte: dati generici ({nutritionFact.source})</p>
                    </>
                  ) : (
                    <p className="ios-nutrition-fallback">Valori nutrizionali non disponibili.</p>
                  )}
                </div>
              ) : null}
              <div className="my-2 border-t border-zinc-200" />
              <form
                action={updateShoppingItemTextAction}
                className="flex flex-col gap-2"
                onSubmit={() => {
                  setIsOpen(false);
                  setIsNutritionOpen(false);
                }}
              >
                <input type="hidden" name="item_id" value={itemId} />
                <label className="text-xs font-medium text-zinc-600">Rinomina</label>
                <input
                  type="text"
                  name="text"
                  required
                  minLength={1}
                  maxLength={120}
                  defaultValue={currentText}
                  className="h-8 rounded-lg border border-zinc-300 bg-white/95 px-2 text-[11px]"
                />
                <button className="ios-btn-secondary h-7 text-[11px]">
                  Salva nome
                </button>
              </form>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
