"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { createInviteToken, hashInviteToken } from "@/lib/security/token";
import {
  resolveCatalogMatchByProductId,
  resolveCatalogMatchByText,
} from "@/lib/catalog/resolve";
import { normalizeProductText } from "@/lib/catalog/normalize";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { writeAuditLog } from "@/lib/security/audit";

function parseFamilyName(raw: FormDataEntryValue | null) {
  if (typeof raw !== "string") {
    return null;
  }

  const value = raw.trim();
  if (value.length < 2 || value.length > 80) {
    return null;
  }

  return value;
}

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

type UserContext = {
  authUserId: string;
  profileId: string;
  familyId: string | null;
  familyRole: "ADMIN" | "MEMBER" | null;
};

async function getUserContext(): Promise<UserContext | null> {
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
    .select("family_id, role")
    .eq("profile_id", profileId)
    .limit(1)
    .maybeSingle();

  if (membership.error) {
    throw new Error(membership.error.message);
  }

  return {
    authUserId: user.id,
    profileId,
    familyId: membership.data?.family_id ?? null,
    familyRole: (membership.data?.role as "ADMIN" | "MEMBER" | undefined) ?? null,
  };
}

function enforceUserRateLimit(
  context: UserContext,
  action: string,
  limit: number,
  windowMs: number,
) {
  return consumeRateLimit(`action:${action}:${context.authUserId}`, limit, windowMs);
}

export async function createFamilyAction(
  prevState: { ok: boolean; error?: string; alreadyMember?: boolean } | null,
  formData: FormData,
) {
  void prevState;
  const familyName = parseFamilyName(formData.get("family_name"));
  if (!familyName) {
    return { ok: false, error: "Il nome famiglia deve avere 2-80 caratteri." };
  }

  const context = await getUserContext();
  if (!context) {
    return { ok: false, error: "Sessione non valida. Effettua il login." };
  }

  const admin = getSupabaseAdminClient();
  const existingMembership = await admin
    .from("family_members")
    .select("family_id")
    .eq("profile_id", context.profileId)
    .limit(1)
    .maybeSingle();

  if (existingMembership.error) {
    return { ok: false, error: existingMembership.error.message };
  }

  if (existingMembership.data) {
    return { ok: true, alreadyMember: true };
  }

  const familyInsert = await admin
    .from("families")
    .insert({ name: familyName })
    .select("id")
    .single();

  if (familyInsert.error || !familyInsert.data) {
    return {
      ok: false,
      error: familyInsert.error?.message ?? "Impossibile creare la famiglia.",
    };
  }

  const memberInsert = await admin.from("family_members").insert({
    family_id: familyInsert.data.id,
    profile_id: context.profileId,
    role: "ADMIN",
  });

  if (memberInsert.error) {
    return { ok: false, error: memberInsert.error.message };
  }

  revalidatePath("/app");
  return { ok: true };
}

export async function signOutAction() {
  const supabase = await getSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

function parseItemText(raw: FormDataEntryValue | null) {
  if (typeof raw !== "string") {
    return null;
  }

  const value = raw.trim();
  if (value.length < 1 || value.length > 120) {
    return null;
  }

  return value;
}

export async function addShoppingItemAction(
  prevState: { ok: boolean; error?: string } | null,
  formData: FormData,
) {
  void prevState;
  const text = parseItemText(formData.get("text"));
  const selectedProductIdRaw = formData.get("selected_product_id");
  const selectedProductId =
    typeof selectedProductIdRaw === "string" && selectedProductIdRaw.length > 10
      ? selectedProductIdRaw
      : null;

  if (!text) {
    return { ok: false, error: "Inserisci un prodotto (1-120 caratteri)." };
  }

  const context = await getUserContext();
  if (!context || !context.familyId) {
    return { ok: false, error: "Devi prima creare o unirti a una famiglia." };
  }

  const addLimit = enforceUserRateLimit(context, "add-item", 60, 60 * 1000);
  if (!addLimit.ok) {
    return {
      ok: false,
      error: `Troppi inserimenti. Riprova tra ${addLimit.retryAfterSec} secondi.`,
    };
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
    return { ok: false, error: pendingExisting.error.message };
  }

  if (pendingExisting.data) {
    await writeAuditLog({
      familyId: context.familyId,
      actorProfileId: context.profileId,
      eventType: "ITEM_ADD_DEDUP",
      entityType: "shopping_item",
      entityId: pendingExisting.data.id,
      metadata: { text },
    });
    revalidatePath("/app");
    return { ok: true };
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
    return { ok: false, error: boughtExisting.error.message };
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
      return { ok: false, error: reactivate.error.message };
    }

    await writeAuditLog({
      familyId: context.familyId,
      actorProfileId: context.profileId,
      eventType: "ITEM_REACTIVATE",
      entityType: "shopping_item",
      entityId: boughtExisting.data.id,
      metadata: { text, categoryId: match.categoryId, productId: match.productId },
    });

    revalidatePath("/app");
    return { ok: true };
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
    return { ok: false, error: insertResult.error.message };
  }

  await writeAuditLog({
    familyId: context.familyId,
    actorProfileId: context.profileId,
    eventType: "ITEM_ADD",
    entityType: "shopping_item",
    entityId: insertResult.data.id,
    metadata: { text, categoryId: match.categoryId, productId: match.productId },
  });

  revalidatePath("/app");
  return { ok: true };
}

export async function toggleShoppingItemAction(formData: FormData) {
  const itemIdRaw = formData.get("item_id");
  if (typeof itemIdRaw !== "string" || itemIdRaw.length < 10) {
    return;
  }

  const context = await getUserContext();
  if (!context || !context.familyId) {
    return;
  }

  const toggleLimit = enforceUserRateLimit(context, "toggle-item", 120, 60 * 1000);
  if (!toggleLimit.ok) {
    return;
  }

  const admin = getSupabaseAdminClient();
  const currentItem = await admin
    .from("shopping_items")
    .select("id, status, family_id")
    .eq("id", itemIdRaw)
    .eq("family_id", context.familyId)
    .single();

  if (currentItem.error || !currentItem.data) {
    return;
  }

  const nextStatus = currentItem.data.status === "PENDING" ? "BOUGHT" : "PENDING";
  const updatePayload =
    nextStatus === "BOUGHT"
      ? { status: "BOUGHT", bought_by: context.profileId, bought_at: new Date().toISOString() }
      : { status: "PENDING", bought_by: null, bought_at: null };

  await admin
    .from("shopping_items")
    .update(updatePayload)
    .eq("id", currentItem.data.id)
    .eq("family_id", context.familyId);

  await writeAuditLog({
    familyId: context.familyId,
    actorProfileId: context.profileId,
    eventType: "ITEM_TOGGLE",
    entityType: "shopping_item",
    entityId: currentItem.data.id,
    metadata: { nextStatus },
  });

  revalidatePath("/app");
}

export async function deleteShoppingItemAction(formData: FormData) {
  const itemIdRaw = formData.get("item_id");
  if (typeof itemIdRaw !== "string" || itemIdRaw.length < 10) {
    return;
  }

  const context = await getUserContext();
  if (!context || !context.familyId) {
    return;
  }

  const deleteLimit = enforceUserRateLimit(context, "delete-item", 60, 60 * 1000);
  if (!deleteLimit.ok) {
    return;
  }

  const admin = getSupabaseAdminClient();
  await admin
    .from("shopping_items")
    .delete()
    .eq("id", itemIdRaw)
    .eq("family_id", context.familyId);

  await writeAuditLog({
    familyId: context.familyId,
    actorProfileId: context.profileId,
    eventType: "ITEM_DELETE",
    entityType: "shopping_item",
    entityId: itemIdRaw,
  });

  revalidatePath("/app");
}

export async function updateShoppingItemCategoryAction(formData: FormData) {
  const itemIdRaw = formData.get("item_id");
  const categoryIdRaw = formData.get("category_id");
  if (typeof itemIdRaw !== "string" || itemIdRaw.length < 10) {
    return;
  }

  const context = await getUserContext();
  if (!context || !context.familyId) {
    return;
  }

  const categoryLimit = enforceUserRateLimit(context, "set-item-category", 120, 60 * 1000);
  if (!categoryLimit.ok) {
    return;
  }

  const categoryId =
    typeof categoryIdRaw === "string" && categoryIdRaw.length >= 10 ? categoryIdRaw : null;

  const admin = getSupabaseAdminClient();
  const item = await admin
    .from("shopping_items")
    .select("id")
    .eq("id", itemIdRaw)
    .eq("family_id", context.familyId)
    .maybeSingle();

  if (item.error || !item.data) {
    return;
  }

  if (categoryId) {
    const category = await admin
      .from("categories")
      .select("id, label")
      .eq("id", categoryId)
      .maybeSingle();

    if (category.error || !category.data) {
      return;
    }
  }

  await admin
    .from("shopping_items")
    .update({
      category_id: categoryId,
    })
    .eq("id", itemIdRaw)
    .eq("family_id", context.familyId);

  await writeAuditLog({
    familyId: context.familyId,
    actorProfileId: context.profileId,
    eventType: "ITEM_CATEGORY_SET",
    entityType: "shopping_item",
    entityId: itemIdRaw,
    metadata: { categoryId },
  });

  revalidatePath("/app");
}

type InviteActionState =
  | {
      ok: boolean;
      error?: string;
      invitePath?: string;
    }
  | null;

async function getRequestOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";

  if (!host) {
    return "http://127.0.0.1:3000";
  }
  return `${proto}://${host}`;
}

export async function createInviteAction(
  prevState: InviteActionState,
  formData: FormData,
) {
  void prevState;
  void formData;
  const context = await getUserContext();
  if (!context || !context.familyId) {
    return { ok: false, error: "Devi essere autenticato in una famiglia." };
  }

  if (context.familyRole !== "ADMIN") {
    return { ok: false, error: "Solo un admin può creare inviti." };
  }

  const inviteLimit = enforceUserRateLimit(context, "create-invite", 20, 60 * 60 * 1000);
  if (!inviteLimit.ok) {
    return {
      ok: false,
      error: `Troppi inviti. Riprova tra ${inviteLimit.retryAfterSec} secondi.`,
    };
  }

  const token = createInviteToken();
  const tokenHash = hashInviteToken(token);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const admin = getSupabaseAdminClient();
  const insertResult = await admin.from("invites").insert({
    family_id: context.familyId,
    token_hash: tokenHash,
    expires_at: expiresAt,
    created_by: context.profileId,
  });

  if (insertResult.error) {
    return { ok: false, error: insertResult.error.message };
  }

  await writeAuditLog({
    familyId: context.familyId,
    actorProfileId: context.profileId,
    eventType: "INVITE_CREATE",
    entityType: "invite",
    metadata: { expiresAt },
  });

  const invitePath = `/invite/${token}`;
  const origin = await getRequestOrigin();
  return { ok: true, invitePath: `${origin}${invitePath}` };
}

type AcceptInviteState = { ok: boolean; error?: string } | null;

export async function acceptInviteAction(
  prevState: AcceptInviteState,
  formData: FormData,
) {
  void prevState;
  const tokenRaw = formData.get("token");
  if (typeof tokenRaw !== "string" || tokenRaw.length < 16) {
    return { ok: false, error: "Invito non valido." };
  }

  const context = await getUserContext();
  if (!context) {
    return { ok: false, error: "Devi effettuare il login." };
  }

  if (context.familyId) {
    return { ok: false, error: "Sei già membro di una famiglia." };
  }

  const acceptLimit = enforceUserRateLimit(context, "accept-invite", 10, 10 * 60 * 1000);
  if (!acceptLimit.ok) {
    return {
      ok: false,
      error: `Troppi tentativi. Riprova tra ${acceptLimit.retryAfterSec} secondi.`,
    };
  }

  const tokenHash = hashInviteToken(tokenRaw);
  const nowIso = new Date().toISOString();
  const admin = getSupabaseAdminClient();

  const claimInvite = await admin
    .from("invites")
    .update({
      used_at: nowIso,
      used_by: context.profileId,
    })
    .eq("token_hash", tokenHash)
    .is("used_at", null)
    .gt("expires_at", nowIso)
    .select("family_id")
    .single();

  if (claimInvite.error || !claimInvite.data) {
    return { ok: false, error: "Invito scaduto, già usato o non valido." };
  }

  const addMember = await admin.from("family_members").insert({
    family_id: claimInvite.data.family_id,
    profile_id: context.profileId,
    role: "MEMBER",
  });

  if (addMember.error) {
    return { ok: false, error: addMember.error.message };
  }

  await writeAuditLog({
    familyId: claimInvite.data.family_id,
    actorProfileId: context.profileId,
    eventType: "INVITE_ACCEPT",
    entityType: "invite",
    metadata: {},
  });

  revalidatePath("/app");
  redirect("/app");
}
