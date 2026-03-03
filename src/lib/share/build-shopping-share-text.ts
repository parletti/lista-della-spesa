type ShareItem = {
  id: string;
  text: string;
  category: string;
};

export function buildShoppingShareText(items: ShareItem[]) {
  let nowLabel = "";
  try {
    nowLabel = new Intl.DateTimeFormat("it-IT", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date());
  } catch {
    nowLabel = new Date().toLocaleString("it-IT");
  }

  const header = `Lista da comprare - ${nowLabel}`;
  if (items.length === 0) {
    return `${header}\n\nNessun prodotto selezionato.`;
  }

  const grouped = new Map<string, string[]>();
  for (const item of items) {
    const key = item.category.trim() || "Altro";
    const bucket = grouped.get(key) ?? [];
    bucket.push(item.text);
    grouped.set(key, bucket);
  }

  const lines = [header, ""];
  for (const [category, products] of [...grouped.entries()].sort((a, b) =>
    a[0].localeCompare(b[0], "it", { sensitivity: "base" }),
  )) {
    lines.push(category);
    for (const product of products.sort((a, b) =>
      a.localeCompare(b, "it", { sensitivity: "base" }),
    )) {
      lines.push(`  - ${product}`);
    }
    lines.push("");
  }

  return lines.join("\n").trimEnd();
}

export type { ShareItem };
