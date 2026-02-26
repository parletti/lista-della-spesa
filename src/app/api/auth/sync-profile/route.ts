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

export async function POST() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Not authenticated." }, { status: 401 });
  }

  const admin = getSupabaseAdminClient();
  const { error } = await admin.from("profiles").upsert(
    {
      auth_user_id: user.id,
      display_name: getDisplayNameFromUser(user),
    },
    {
      onConflict: "auth_user_id",
    },
  );

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
