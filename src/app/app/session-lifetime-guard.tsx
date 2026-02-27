"use client";

import { useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  clearSessionStartedCookie,
  getSessionStartedAtFromCookie,
  SESSION_MAX_AGE_MS,
  setSessionStartedCookie,
} from "@/lib/auth/session-lifetime";

export function SessionLifetimeGuard() {
  useEffect(() => {
    const startedAt = getSessionStartedAtFromCookie();
    const now = Date.now();

    if (!startedAt) {
      setSessionStartedCookie();
      return;
    }

    if (now - startedAt <= SESSION_MAX_AGE_MS) {
      return;
    }

    async function forceSignOut() {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
      clearSessionStartedCookie();
      window.location.href = "/login?expired=1";
    }

    void forceSignOut();
  }, []);

  return null;
}
