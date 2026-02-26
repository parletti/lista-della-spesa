"use client";

import { useActionState } from "react";
import { acceptInviteAction } from "@/app/app/actions";

type AcceptState = { ok: boolean; error?: string } | null;
const initialState: AcceptState = null;

type Props = {
  token: string;
};

export function AcceptInviteForm({ token }: Props) {
  const [state, formAction, pending] = useActionState(
    acceptInviteAction,
    initialState,
  );

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-3">
      <input type="hidden" name="token" value={token} />
      <button
        type="submit"
        disabled={pending}
        className="ios-btn-primary disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Conferma..." : "Accetta invito"}
      </button>
      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
    </form>
  );
}
