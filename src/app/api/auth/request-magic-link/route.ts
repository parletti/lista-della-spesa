import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabasePublicEnv } from "@/lib/env";
import { hashInviteToken } from "@/lib/security/token";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { parseEmail, parseToken } from "@/lib/validation/input";
import { writeAuditLog } from "@/lib/security/audit";

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

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Body | null;
  const email = parseEmail(body?.email);
  const token = parseToken(body?.token);

  if (!email) {
    return NextResponse.json(
      { ok: false, error: "Dati non validi." },
      { status: 400 },
    );
  }

  const origin = new URL(request.url).origin;
  const env = getSupabasePublicEnv();
  if (!env) {
    return NextResponse.json(
      { ok: false, error: "Configurazione Supabase incompleta." },
      { status: 503 },
    );
  }
  const authClient = createClient(env.url, env.anonKey);

  const ip = getClientIp(request);
  if (!token) {
    const limit = consumeRateLimit(`existing-magic-link:${ip}:${email}`, 5, 10 * 60 * 1000);
    if (!limit.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: `Troppi tentativi. Riprova tra ${limit.retryAfterSec} secondi.`,
        },
        { status: 429 },
      );
    }

    const admin = getSupabaseAdminClient();
    const { data: usersData, error: usersError } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (usersError) {
      return NextResponse.json(
        { ok: false, error: "Impossibile verificare l'utente in questo momento." },
        { status: 503 },
      );
    }

    const normalizedEmail = email.toLowerCase();
    const authUser = usersData.users.find(
      (user) => (user.email ?? "").toLowerCase() === normalizedEmail,
    );
    if (!authUser) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Email non abilitata. Usa un link invito oppure chiedi all'admin di invitarti di nuovo.",
        },
        { status: 400 },
      );
    }

    const redirectTo = `${origin}/auth/confirm?next=${encodeURIComponent("/app")}`;
    const { error } = await authClient.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: false,
      },
    });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  }

  const inviteLimit = consumeRateLimit(`invite-magic-link:${ip}:${token}`, 5, 10 * 60 * 1000);
  if (!inviteLimit.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: `Troppi tentativi. Riprova tra ${inviteLimit.retryAfterSec} secondi.`,
      },
      { status: 429 },
    );
  }

  const tokenHash = hashInviteToken(token);
  const nowIso = new Date().toISOString();
  const admin = getSupabaseAdminClient();
  const invite = await admin
    .from("invites")
    .select("id, family_id")
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

  const inviteRedirectTo = `${origin}/auth/confirm?next=${encodeURIComponent(`/invite/${token}`)}`;
  const { error } = await authClient.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: inviteRedirectTo,
    },
  });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  await writeAuditLog({
    familyId: invite.data.family_id ?? null,
    actorProfileId: null,
    eventType: "MAGIC_LINK_REQUEST",
    entityType: "auth",
    metadata: { ip, emailMasked: email.replace(/(.{2}).+(@.+)/, "$1***$2") },
  });

  return NextResponse.json({ ok: true });
}
