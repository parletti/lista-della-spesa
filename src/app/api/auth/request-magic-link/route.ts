import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabasePublicEnv } from "@/lib/env";
import { hashInviteToken } from "@/lib/security/token";
import { consumeRateLimit } from "@/lib/security/rate-limit";

type Body = {
  email?: string;
  token?: string;
};

function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }
  return "unknown";
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Body | null;
  const email = body?.email?.trim().toLowerCase() ?? "";
  const token = body?.token?.trim() ?? "";

  if (!email || !token || !isValidEmail(email) || token.length < 16) {
    return NextResponse.json(
      { ok: false, error: "Dati non validi." },
      { status: 400 },
    );
  }

  const ip = getClientIp(request);
  const limit = consumeRateLimit(`invite-magic-link:${ip}:${token}`, 5, 10 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: `Troppi tentativi. Riprova tra ${limit.retryAfterSec} secondi.`,
      },
      { status: 429 },
    );
  }

  const tokenHash = hashInviteToken(token);
  const nowIso = new Date().toISOString();
  const admin = getSupabaseAdminClient();
  const invite = await admin
    .from("invites")
    .select("id")
    .eq("token_hash", tokenHash)
    .is("used_at", null)
    .gt("expires_at", nowIso)
    .maybeSingle();

  if (invite.error || !invite.data) {
    return NextResponse.json(
      { ok: false, error: "Invito non valido, scaduto o già usato." },
      { status: 400 },
    );
  }

  const env = getSupabasePublicEnv();
  if (!env) {
    return NextResponse.json(
      { ok: false, error: "Configurazione Supabase incompleta." },
      { status: 503 },
    );
  }

  const authClient = createClient(env.url, env.anonKey);
  const origin = new URL(request.url).origin;
  const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(`/invite/${token}`)}`;

  const { error } = await authClient.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
    },
  });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
