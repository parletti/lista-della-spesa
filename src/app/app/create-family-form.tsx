"use client";

import { useActionState } from "react";
import { createFamilyAction } from "@/app/app/actions";

type FamilyActionState = {
  ok: boolean;
  error?: string;
  alreadyMember?: boolean;
} | null;

const initialState: FamilyActionState = null;

export function CreateFamilyForm() {
  const [state, formAction, pending] = useActionState(
    createFamilyAction,
    initialState,
  );

  return (
    <form action={formAction} className="mt-6 flex max-w-md flex-col gap-3">
      <label htmlFor="family_name" className="text-sm font-medium">
        Nome famiglia
      </label>
      <input
        id="family_name"
        name="family_name"
        required
        minLength={2}
        maxLength={80}
        className="h-11 rounded-md border border-zinc-300 px-3"
        placeholder="Famiglia Rossi"
      />
      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-md bg-black px-4 text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Creazione..." : "Crea famiglia"}
      </button>

      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state?.ok ? (
        <p className="text-sm text-green-700">Famiglia creata con successo.</p>
      ) : null}
    </form>
  );
}
