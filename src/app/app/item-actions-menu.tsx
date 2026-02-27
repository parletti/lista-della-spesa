"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  deleteShoppingItemAction,
  updateShoppingItemCategoryAction,
} from "@/app/app/actions";

type CategoryOption = {
  id: string;
  label: string;
};

type Props = {
  itemId: string;
  currentCategoryId: string | null;
  categories: CategoryOption[];
};

type MenuPosition = {
  top: number;
  left: number;
};

const MENU_WIDTH = 224;

export function ItemActionsMenu({ itemId, currentCategoryId, categories }: Props) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const categoryFormRef = useRef<HTMLFormElement>(null);
  const [isOpen, setIsOpen] = useState(false);
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
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
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
        className="ios-btn-secondary flex h-8 w-8 items-center justify-center px-0 text-sm"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={() => {
          setIsOpen((prev) => !prev);
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
              className="rounded-xl border border-zinc-200 bg-white p-3 shadow-xl"
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
                  className="h-9 rounded-lg border border-zinc-300 bg-white/95 px-2 text-sm"
                  onChange={() => {
                    categoryFormRef.current?.requestSubmit();
                    setIsOpen(false);
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
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
