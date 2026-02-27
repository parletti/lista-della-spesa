"use client";

import { FormEvent, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function ResetRequestForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const supabase = getSupabaseBrowserClient();
      const redirectTo =
        typeof window === "undefined"
          ? undefined
          : `${window.location.origin}/auth/confirm?next=${encodeURIComponent("/login/reset")}`;

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });

      if (error) {
        setStatus("error");
        setMessage(error.message);
        return;
      }

      setStatus("done");
      setMessage("Email inviata. Apri il link per impostare una nuova password.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Errore inatteso.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3">
      <label htmlFor="reset-email" className="text-sm font-medium">
        Email
      </label>
      <input
        id="reset-email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        className="h-10 rounded-2xl border border-zinc-300 bg-white px-3.5 text-[14px] outline-none focus:border-[#007AFF]"
        placeholder="nome@famiglia.it"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="ios-btn-primary disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading" ? "Invio..." : "Invia link reset"}
      </button>
      {message ? (
        <p className={`text-sm ${status === "error" ? "text-red-600" : "text-green-700"}`}>
          {message}
        </p>
      ) : null}
    </form>
  );
}
