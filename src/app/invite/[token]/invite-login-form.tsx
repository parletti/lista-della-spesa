"use client";

import { FormEvent, useMemo, useState } from "react";

type Props = {
  token: string;
};

export function InviteLoginForm({ token }: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  const redirectTo = useMemo(() => {
    if (typeof window === "undefined") {
      return undefined;
    }
    return `${window.location.origin}/invite/${token}`;
  }, [token]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/auth/request-magic-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          token,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!response.ok || !payload?.ok) {
        setStatus("error");
        setMessage(payload?.error ?? "Impossibile inviare il magic link.");
        return;
      }

      setStatus("sent");
      setMessage(`Email inviata. Apri il magic link e torna su ${redirectTo}.`);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Errore inatteso.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3">
      <label htmlFor="invite-email" className="text-sm font-medium">
        Email
      </label>
      <input
        id="invite-email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        className="h-11 rounded-2xl border border-zinc-300 bg-white px-4 text-[15px] outline-none focus:border-[#007AFF]"
        placeholder="nome@famiglia.it"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="ios-btn-primary disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading" ? "Invio..." : "Invia magic link"}
      </button>
      {message ? (
        <p
          className={`text-sm ${
            status === "error" ? "text-red-600" : "text-green-700"
          }`}
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
