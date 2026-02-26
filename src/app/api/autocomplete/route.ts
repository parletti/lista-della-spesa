import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { normalizeProductText } from "@/lib/catalog/normalize";

type ProductRow = {
  id: string;
  display_name: string;
  normalized_name: string;
  category_id: string;
  popularity_score: number;
};

type CategoryRow = {
  id: string;
  label: string;
};

type AliasRow = {
  alias_normalized: string;
  product_id: string;
};

type Suggestion = {
  productId: string;
  label: string;
  categoryLabel: string | null;
  confidence: number;
};

function computeScore(product: ProductRow, normalizedQuery: string, rawQuery: string) {
  let score = product.popularity_score / 100;
  const normalizedDisplay = normalizeProductText(product.display_name);
  const rawLower = rawQuery.toLowerCase();
  const displayLower = product.display_name.toLowerCase();

  if (product.normalized_name.startsWith(normalizedQuery)) score += 300;
  if (normalizedDisplay.includes(normalizedQuery)) score += 200;
  if (displayLower.startsWith(rawLower)) score += 180;
  if (displayLower.includes(rawLower)) score += 120;

  return score;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (q.length < 1) {
    return NextResponse.json({ suggestions: [] });
  }

  const normalizedQuery = normalizeProductText(q);
  if (!normalizedQuery) {
    return NextResponse.json({ suggestions: [] });
  }

  const admin = getSupabaseAdminClient();

  const [byNormalized, byDisplay, aliasMatches] = await Promise.all([
    admin
      .from("products_catalog")
      .select("id, display_name, normalized_name, category_id, popularity_score")
      .ilike("normalized_name", `%${normalizedQuery}%`)
      .limit(12),
    admin
      .from("products_catalog")
      .select("id, display_name, normalized_name, category_id, popularity_score")
      .ilike("display_name", `%${q}%`)
      .limit(12),
    admin
      .from("product_aliases")
      .select("alias_normalized, product_id")
      .ilike("alias_normalized", `%${normalizedQuery}%`)
      .limit(12),
  ]);

  const productsMap = new Map<string, ProductRow>();

  for (const row of (byNormalized.data ?? []) as ProductRow[]) {
    productsMap.set(row.id, row);
  }
  for (const row of (byDisplay.data ?? []) as ProductRow[]) {
    productsMap.set(row.id, row);
  }

  const aliasRows = (aliasMatches.data ?? []) as AliasRow[];
  if (aliasRows.length > 0) {
    const aliasProductIds = [...new Set(aliasRows.map((row) => row.product_id))];
    const aliasProducts = await admin
      .from("products_catalog")
      .select("id, display_name, normalized_name, category_id, popularity_score")
      .in("id", aliasProductIds);
    for (const row of (aliasProducts.data ?? []) as ProductRow[]) {
      productsMap.set(row.id, row);
    }
  }

  const products = [...productsMap.values()];
  if (products.length === 0) {
    return NextResponse.json({ suggestions: [] });
  }

  const categoryIds = [...new Set(products.map((product) => product.category_id))];
  const categoriesQuery = await admin
    .from("categories")
    .select("id, label")
    .in("id", categoryIds);
  const categories = new Map(
    ((categoriesQuery.data ?? []) as CategoryRow[]).map((row) => [row.id, row.label]),
  );

  const aliasByProduct = new Map<string, string[]>();
  for (const row of aliasRows) {
    const current = aliasByProduct.get(row.product_id) ?? [];
    current.push(row.alias_normalized);
    aliasByProduct.set(row.product_id, current);
  }

  const suggestions = products
    .map((product) => {
      let score = computeScore(product, normalizedQuery, q);
      const aliases = aliasByProduct.get(product.id) ?? [];
      if (aliases.some((alias) => alias.startsWith(normalizedQuery))) score += 160;
      if (aliases.some((alias) => alias.includes(normalizedQuery))) score += 110;

      return {
        productId: product.id,
        label: product.display_name,
        categoryLabel: categories.get(product.category_id) ?? null,
        confidence: score,
      } satisfies Suggestion;
    })
    .sort((a, b) => b.confidence - a.confidence || a.label.localeCompare(b.label, "it"))
    .slice(0, 8);

  return NextResponse.json({ suggestions });
}
