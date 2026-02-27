"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { setSessionStartedCookie } from "@/lib/auth/session-lifetime";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setStatus("error");
        setMessage("Credenziali non valide. Controlla email e password.");
        return;
      }

      setSessionStartedCookie();
      router.replace("/app");
      router.refresh();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Errore inatteso.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3">
      <label htmlFor="login-email" className="text-sm font-medium">
        Email
      </label>
      <input
        id="login-email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        className="h-11 rounded-2xl border border-zinc-300 bg-white px-4 text-[15px] outline-none focus:border-[#007AFF]"
        placeholder="nome@famiglia.it"
      />
      <label htmlFor="login-password" className="text-sm font-medium">
        Password
      </label>
      <input
        id="login-password"
        type="password"
        required
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        className="h-11 rounded-2xl border border-zinc-300 bg-white px-4 text-[15px] outline-none focus:border-[#007AFF]"
        placeholder="••••••••"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="ios-btn-primary disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading" ? "Accesso..." : "Accedi"}
      </button>
      {message ? (
        <p className={`text-sm ${status === "error" ? "text-red-600" : "text-green-700"}`}>
          {message}
        </p>
      ) : null}
      <Link href="/login/reset-request" className="text-xs text-[#007AFF] hover:underline">
        Password dimenticata?
      </Link>
    </form>
  );
}
