import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { normalizeProductText } from "@/lib/catalog/normalize";

type CatalogMatch = {
  productId: string | null;
  categoryId: string | null;
  normalizedText: string;
};

export async function resolveCatalogMatchByText(rawText: string): Promise<CatalogMatch> {
  const normalizedText = normalizeProductText(rawText);
  if (!normalizedText) {
    return { productId: null, categoryId: null, normalizedText: "" };
  }

  const admin = getSupabaseAdminClient();

  const exactProduct = await admin
    .from("products_catalog")
    .select("id, category_id")
    .eq("normalized_name", normalizedText)
    .limit(1)
    .maybeSingle();

  if (!exactProduct.error && exactProduct.data) {
    return {
      productId: exactProduct.data.id,
      categoryId: exactProduct.data.category_id,
      normalizedText,
    };
  }

  const aliasMatch = await admin
    .from("product_aliases")
    .select("product_id")
    .eq("alias_normalized", normalizedText)
    .limit(1)
    .maybeSingle();

  if (!aliasMatch.error && aliasMatch.data) {
    const product = await admin
      .from("products_catalog")
      .select("id, category_id")
      .eq("id", aliasMatch.data.product_id)
      .limit(1)
      .maybeSingle();

    if (!product.error && product.data) {
      return {
        productId: product.data.id,
        categoryId: product.data.category_id,
        normalizedText,
      };
    }
  }

  return {
    productId: null,
    categoryId: null,
    normalizedText,
  };
}

export async function resolveCatalogMatchByProductId(
  productId: string,
  fallbackText: string,
): Promise<CatalogMatch> {
  const admin = getSupabaseAdminClient();
  const product = await admin
    .from("products_catalog")
    .select("id, normalized_name, category_id")
    .eq("id", productId)
    .limit(1)
    .maybeSingle();

  if (product.error || !product.data) {
    return resolveCatalogMatchByText(fallbackText);
  }

  return {
    productId: product.data.id,
    categoryId: product.data.category_id,
    normalizedText: product.data.normalized_name,
  };
}
