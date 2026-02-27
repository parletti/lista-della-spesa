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
    <div className="mt-6 rounded-2xl border border-zinc-200 bg-white/80 p-3">
      <h3 className="text-base font-semibold">Invita familiare</h3>
      <p className="mt-1 text-xs text-zinc-600">
        Genera un link monouso valido 24 ore.
      </p>
      <form action={formAction} className="mt-3">
        <button
          type="submit"
          disabled={pending}
          className="ios-btn-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Generazione..." : "Genera invito"}
        </button>
      </form>

      {state?.error ? <p className="mt-2 text-xs text-red-600">{state.error}</p> : null}

      {state?.ok && state.invitePath ? (
        <div className="mt-3 rounded-xl border border-zinc-200 bg-white p-2.5">
          <p className="text-xs text-zinc-600">Link invito:</p>
          <p className="mt-1 break-all text-xs">{state.invitePath}</p>
        </div>
      ) : null}
    </div>
  );
}
