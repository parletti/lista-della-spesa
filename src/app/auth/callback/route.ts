import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

function getDisplayNameFromUser(user: { email?: string; user_metadata?: Record<string, unknown> }) {
  const metadataName = user.user_metadata?.full_name;
  if (typeof metadataName === "string" && metadataName.trim().length > 1) {
    return metadataName.trim().slice(0, 80);
  }

  if (user.email) {
    return user.email.split("@")[0].slice(0, 80);
  }

  return "Utente";
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextRaw = searchParams.get("next");
  const next = nextRaw && nextRaw.startsWith("/") ? nextRaw : "/app";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth_exchange_failed`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const admin = getSupabaseAdminClient();
    await admin.from("profiles").upsert(
      {
        auth_user_id: user.id,
        display_name: getDisplayNameFromUser(user),
      },
      {
        onConflict: "auth_user_id",
      },
    );
  }

  return NextResponse.redirect(`${origin}${next}`);
}
