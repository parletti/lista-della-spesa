import { normalizeProductText } from "@/lib/catalog/normalize";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function registerCatalogProductRequest(
  rawText: string,
  normalizedText?: string | null,
) {
  const effectiveNormalized = normalizedText?.trim() || normalizeProductText(rawText);
  if (!effectiveNormalized) {
    return;
  }

  const admin = getSupabaseAdminClient();
  const { error } = await admin.rpc("register_catalog_product_request", {
    p_normalized_text: effectiveNormalized,
    p_raw_text: rawText.trim().slice(0, 120),
  });

  if (error) {
    throw new Error(error.message);
  }
}
