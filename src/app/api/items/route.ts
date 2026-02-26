import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  resolveCatalogMatchByProductId,
  resolveCatalogMatchByText,
} from "@/lib/catalog/resolve";
import { normalizeProductText } from "@/lib/catalog/normalize";
import { parseShoppingText } from "@/lib/validation/input";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { writeAuditLog } from "@/lib/security/audit";

type Body = {
  text?: string;
  selectedProductId?: string | null;
};

async function ensureProfile(authUserId: string, fallbackDisplayName: string) {
  const admin = getSupabaseAdminClient();
  const upsertResult = await admin
    .from("profiles")
    .upsert(
      {
        auth_user_id: authUserId,
        display_name: fallbackDisplayName.slice(0, 80),
      },
      { onConflict: "auth_user_id" },
    )
    .select("id")
    .single();

  if (upsertResult.error || !upsertResult.data) {
    throw new Error(upsertResult.error?.message ?? "Unable to create profile.");
  }

  return upsertResult.data.id as string;
}

async function getUserContext() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const admin = getSupabaseAdminClient();
  const profileId = await ensureProfile(
    user.id,
    (user.email ?? "Utente").split("@")[0] || "Utente",
  );

  const membership = await admin
    .from("family_members")
    .select("family_id")
    .eq("profile_id", profileId)
    .limit(1)
    .maybeSingle();

  if (membership.error) {
    throw new Error(membership.error.message);
  }

  return { profileId, familyId: membership.data?.family_id ?? null, authUserId: user.id };
}

function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }
  return "unknown";
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Body | null;
  const text = parseShoppingText(body?.text);
  const selectedProductId =
    typeof body?.selectedProductId === "string" && body.selectedProductId.length > 10
      ? body.selectedProductId
      : null;

  if (!text) {
    return NextResponse.json({ ok: false, error: "Testo prodotto non valido." }, { status: 400 });
  }

  const context = await getUserContext();
  if (!context || !context.familyId) {
    return NextResponse.json({ ok: false, error: "Sessione non valida." }, { status: 401 });
  }

  const ip = getClientIp(request);
  const limit = consumeRateLimit(`api-items:${context.authUserId}:${ip}`, 80, 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: `Troppi inserimenti. Riprova tra ${limit.retryAfterSec} secondi.` },
      { status: 429 },
    );
  }

  const admin = getSupabaseAdminClient();
  const match = selectedProductId
    ? await resolveCatalogMatchByProductId(selectedProductId, text)
    : await resolveCatalogMatchByText(text);

  const canonicalNormalized = match.normalizedText || normalizeProductText(text);

  const pendingQuery = match.productId
    ? admin
        .from("shopping_items")
        .select("id")
        .eq("family_id", context.familyId)
        .eq("product_id", match.productId)
        .eq("status", "PENDING")
        .limit(1)
        .maybeSingle()
    : admin
        .from("shopping_items")
        .select("id")
        .eq("family_id", context.familyId)
        .eq("normalized_text", canonicalNormalized)
        .eq("status", "PENDING")
        .limit(1)
        .maybeSingle();

  const pendingExisting = await pendingQuery;
  if (pendingExisting.error) {
    return NextResponse.json({ ok: false, error: pendingExisting.error.message }, { status: 500 });
  }

  if (pendingExisting.data) {
    await writeAuditLog({
      familyId: context.familyId,
      actorProfileId: context.profileId,
      eventType: "ITEM_ADD_DEDUP",
      entityType: "shopping_item",
      entityId: pendingExisting.data.id,
      metadata: { source: "api", text },
    });
    return NextResponse.json({ ok: true, deduplicated: true });
  }

  const boughtQuery = match.productId
    ? admin
        .from("shopping_items")
        .select("id")
        .eq("family_id", context.familyId)
        .eq("product_id", match.productId)
        .eq("status", "BOUGHT")
        .limit(1)
        .maybeSingle()
    : admin
        .from("shopping_items")
        .select("id")
        .eq("family_id", context.familyId)
        .eq("normalized_text", canonicalNormalized)
        .eq("status", "BOUGHT")
        .limit(1)
        .maybeSingle();

  const boughtExisting = await boughtQuery;
  if (boughtExisting.error) {
    return NextResponse.json({ ok: false, error: boughtExisting.error.message }, { status: 500 });
  }

  if (boughtExisting.data) {
    const reactivate = await admin
      .from("shopping_items")
      .update({
        text,
        normalized_text: canonicalNormalized || null,
        product_id: match.productId,
        category_id: match.categoryId,
        status: "PENDING",
        bought_by: null,
        bought_at: null,
        added_by: context.profileId,
      })
      .eq("id", boughtExisting.data.id)
      .eq("family_id", context.familyId);

    if (reactivate.error) {
      return NextResponse.json({ ok: false, error: reactivate.error.message }, { status: 500 });
    }

    await writeAuditLog({
      familyId: context.familyId,
      actorProfileId: context.profileId,
      eventType: "ITEM_REACTIVATE",
      entityType: "shopping_item",
      entityId: boughtExisting.data.id,
      metadata: { source: "api", text, categoryId: match.categoryId, productId: match.productId },
    });

    return NextResponse.json({ ok: true, reactivated: true });
  }

  const insertResult = await admin.from("shopping_items").insert({
    family_id: context.familyId,
    text,
    normalized_text: canonicalNormalized || null,
    product_id: match.productId,
    category_id: match.categoryId,
    status: "PENDING",
    added_by: context.profileId,
  }).select("id").single();

  if (insertResult.error || !insertResult.data) {
    return NextResponse.json({ ok: false, error: insertResult.error.message }, { status: 500 });
  }

  await writeAuditLog({
    familyId: context.familyId,
    actorProfileId: context.profileId,
    eventType: "ITEM_ADD",
    entityType: "shopping_item",
    entityId: insertResult.data.id,
    metadata: { source: "api", text, categoryId: match.categoryId, productId: match.productId },
  });

  return NextResponse.json({ ok: true });
}
