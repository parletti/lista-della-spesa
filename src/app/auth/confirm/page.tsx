"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { setSessionStartedCookie } from "@/lib/auth/session-lifetime";

const allowedTypes: ReadonlySet<string> = new Set([
  "signup",
  "magiclink",
  "recovery",
  "invite",
  "email",
  "email_change",
]);

function getSafeNext(nextRaw: string | null) {
  if (!nextRaw || !nextRaw.startsWith("/")) {
    return "/app";
  }
  return nextRaw;
}

export default function AuthConfirmPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function completeAuth() {
      try {
        const supabase = getSupabaseBrowserClient();
        const url = new URL(window.location.href);
        const next = getSafeNext(url.searchParams.get("next"));
        const code = url.searchParams.get("code");
        const tokenHash = url.searchParams.get("token_hash");
        const type = url.searchParams.get("type");

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        } else if (tokenHash && type && allowedTypes.has(type)) {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as EmailOtpType,
          });
          if (verifyError) throw verifyError;
        } else {
          const hash = window.location.hash.replace(/^#/, "");
          if (hash.length > 0) {
            const hashParams = new URLSearchParams(hash);
            const accessToken = hashParams.get("access_token");
            const refreshToken = hashParams.get("refresh_token");
            if (accessToken && refreshToken) {
              const { error: sessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              if (sessionError) throw sessionError;
            } else {
              throw new Error("Parametri auth mancanti nel magic link.");
            }
          } else {
            throw new Error("Parametri auth mancanti nel magic link.");
          }
        }

        await fetch("/api/auth/sync-profile", {
          method: "POST",
        });

        if (!cancelled) {
          setSessionStartedCookie();
          router.replace(next);
        }
      } catch (authError) {
        if (!cancelled) {
          setError(authError instanceof Error ? authError.message : "Autenticazione fallita.");
        }
      }
    }

    void completeAuth();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-8">
      <section className="ios-card ios-fade-up p-6">
        <h1 className="text-3xl font-semibold">Accesso in corso</h1>
        {!error ? (
          <p className="mt-3 text-sm text-zinc-600">
            Stiamo completando il login, attendi qualche secondo.
          </p>
        ) : (
          <>
            <p className="mt-3 text-sm text-red-600">{error}</p>
            <Link href="/login" className="ios-btn-secondary mt-4 inline-flex items-center justify-center">
              Torna al login
            </Link>
          </>
        )}
      </section>
    </main>
  );
}
