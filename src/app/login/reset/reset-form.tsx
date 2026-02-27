"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { validatePasswordPolicy } from "@/lib/auth/password-policy";

export function ResetForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "done">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    if (password !== confirmPassword) {
      setStatus("error");
      setMessage("La conferma password non coincide.");
      return;
    }

    const policy = validatePasswordPolicy(password);
    if (!policy.ok) {
      setStatus("error");
      setMessage(policy.error ?? "Password non valida.");
      return;
    }

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setStatus("error");
        setMessage(error.message);
        return;
      }

      setStatus("done");
      setMessage("Password aggiornata. Ora puoi accedere con le nuove credenziali.");
      setTimeout(() => {
        router.replace("/login");
      }, 1200);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Errore inatteso.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3">
      <label htmlFor="new-password" className="text-sm font-medium">
        Nuova password
      </label>
      <input
        id="new-password"
        type="password"
        required
        autoComplete="new-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        className="h-10 rounded-2xl border border-zinc-300 bg-white px-3.5 text-[14px] outline-none focus:border-[#007AFF]"
        placeholder="Almeno 10 caratteri"
      />

      <label htmlFor="confirm-password" className="text-sm font-medium">
        Conferma password
      </label>
      <input
        id="confirm-password"
        type="password"
        required
        autoComplete="new-password"
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        className="h-10 rounded-2xl border border-zinc-300 bg-white px-3.5 text-[14px] outline-none focus:border-[#007AFF]"
        placeholder="Ripeti la password"
      />

      <p className="text-xs text-zinc-500">
        Requisiti: almeno 10 caratteri, con maiuscola, minuscola e numero.
      </p>

      <button
        type="submit"
        disabled={status === "loading"}
        className="ios-btn-primary disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading" ? "Aggiornamento..." : "Aggiorna password"}
      </button>

      {message ? (
        <p className={`text-sm ${status === "error" ? "text-red-600" : "text-green-700"}`}>
          {message}
        </p>
      ) : null}
    </form>
  );
}
