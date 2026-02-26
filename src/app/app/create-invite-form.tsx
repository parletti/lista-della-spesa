"use client";

import { useActionState } from "react";
import { createInviteAction } from "@/app/app/actions";

type InviteState =
  | {
      ok: boolean;
      error?: string;
      invitePath?: string;
    }
  | null;

const initialState: InviteState = null;

export function CreateInviteForm() {
  const [state, formAction, pending] = useActionState(createInviteAction, initialState);

  return (
    <div className="mt-8 rounded-lg border border-zinc-200 p-4">
      <h3 className="text-lg font-semibold">Invita familiare</h3>
      <p className="mt-1 text-sm text-zinc-600">
        Genera un link monouso valido 24 ore.
      </p>
      <form action={formAction} className="mt-3">
        <button
          type="submit"
          disabled={pending}
          className="h-10 rounded-md bg-black px-4 text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Generazione..." : "Genera invito"}
        </button>
      </form>

      {state?.error ? <p className="mt-2 text-sm text-red-600">{state.error}</p> : null}

      {state?.ok && state.invitePath ? (
        <div className="mt-3 rounded-md bg-zinc-50 p-3">
          <p className="text-xs text-zinc-600">Link invito:</p>
          <p className="mt-1 break-all text-sm">{state.invitePath}</p>
        </div>
      ) : null}
    </div>
  );
}
