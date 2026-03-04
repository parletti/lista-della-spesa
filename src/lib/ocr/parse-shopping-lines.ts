import { normalizeProductText } from "@/lib/catalog/normalize";

function cleanLine(raw: string) {
  return raw
    .replace(/^[\s\-*•·\d\)\.\]]+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseShoppingLinesFromOcr(text: string) {
  const tokens = text
    .split(/\r?\n|,|;|:/g)
    .map((line) => cleanLine(line))
    .filter((line) => line.length >= 2)
    .filter((line) => !/^\d+$/.test(line))
    .slice(0, 120);

  const seen = new Set<string>();
  const unique: string[] = [];
  for (const token of tokens) {
    const key = normalizeProductText(token);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(token);
  }

  return unique;
}
