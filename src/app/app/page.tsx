import { redirect } from "next/navigation";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { CreateFamilyForm } from "@/app/app/create-family-form";
import { signOutAction, toggleShoppingItemAction } from "@/app/app/actions";
import { AddItemForm } from "@/app/app/add-item-form";
import { ShoppingRealtimeListener } from "@/app/app/shopping-realtime-listener";
import { CreateInviteForm } from "@/app/app/create-invite-form";

type ProfileRow = {
  id: string;
  display_name: string;
};

type MembershipRow = {
  role: "ADMIN" | "MEMBER";
  family_id: string;
  families: { name: string } | null;
};

type ShoppingItemRow = {
  id: string;
  text: string;
  status: "PENDING" | "BOUGHT";
  created_at: string;
  normalized_text: string | null;
  product_id: string | null;
  categories: { label: string } | { label: string }[] | null;
};

type GroupedItems = {
  category: string;
  items: ShoppingItemRow[];
};

export default async function AppPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const admin = getSupabaseAdminClient();
  const profileQuery = await admin
    .from("profiles")
    .select("id, display_name")
    .eq("auth_user_id", user.id)
    .maybeSingle<ProfileRow>();

  const profile = profileQuery.data ?? null;

  let membership: MembershipRow | null = null;
  let items: ShoppingItemRow[] = [];
  if (profile) {
    const membershipQuery = await admin
      .from("family_members")
      .select("role, family_id, families(name)")
      .eq("profile_id", profile.id)
      .limit(1)
      .maybeSingle<MembershipRow>();
    membership = membershipQuery.data ?? null;

    if (membership) {
      const itemsQuery = await admin
        .from("shopping_items")
        .select("id, text, status, created_at, normalized_text, product_id, categories(label)")
        .eq("family_id", membership.family_id)
        .order("created_at", { ascending: false });

      if (!itemsQuery.error) {
        items = (itemsQuery.data ?? []) as ShoppingItemRow[];
      }
    }
  }

  const canonicalKeyForItem = (item: ShoppingItemRow) =>
    item.product_id ?? item.normalized_text ?? item.text.trim().toLowerCase();

  const dedupedByCanonical = new Map<string, ShoppingItemRow>();
  for (const item of items) {
    const key = canonicalKeyForItem(item);
    const existing = dedupedByCanonical.get(key);
    if (!existing) {
      dedupedByCanonical.set(key, item);
      continue;
    }

    // Prevent duplicates across groups: pending wins over bought.
    if (existing.status === "BOUGHT" && item.status === "PENDING") {
      dedupedByCanonical.set(key, item);
    }
  }

  const uniqueItems = [...dedupedByCanonical.values()];
  const pendingItems = uniqueItems.filter((item) => item.status === "PENDING");
  const boughtItems = uniqueItems
    .filter((item) => item.status === "BOUGHT")
    .sort((a, b) => a.text.localeCompare(b.text, "it", { sensitivity: "base" }));
  const categoryLabelForItem = (item: ShoppingItemRow) => {
    if (!item.categories) {
      return "Altro";
    }
    if (Array.isArray(item.categories)) {
      return item.categories[0]?.label ?? "Altro";
    }
    return item.categories.label ?? "Altro";
  };
  const groupByCategory = (sourceItems: ShoppingItemRow[]): GroupedItems[] => {
    const grouped = new Map<string, ShoppingItemRow[]>();

    for (const item of sourceItems) {
      const category = categoryLabelForItem(item);
      const bucket = grouped.get(category) ?? [];
      bucket.push(item);
      grouped.set(category, bucket);
    }

    return [...grouped.entries()]
      .sort((a, b) => a[0].localeCompare(b[0], "it", { sensitivity: "base" }))
      .map(([category, groupedItems]) => ({
        category,
        items: groupedItems.sort((a, b) =>
          a.text.localeCompare(b.text, "it", { sensitivity: "base" }),
        ),
      }));
  };

  const pendingByCategory = groupByCategory(pendingItems);
  const boughtByCategory = groupByCategory(boughtItems);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-6 py-10">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-600">Connesso come</p>
          <h1 className="text-2xl font-semibold">
            {profile?.display_name ?? user.email ?? "Utente"}
          </h1>
        </div>
        <form action={signOutAction}>
          <button className="rounded-md border border-zinc-300 px-3 py-2 text-sm">
            Logout
          </button>
        </form>
      </header>

      {!membership ? (
        <section className="mt-10 rounded-lg border border-zinc-200 p-6">
          <h2 className="text-xl font-semibold">Crea la tua famiglia</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Primo accesso rilevato: crea ora la famiglia per iniziare.
          </p>
          <CreateFamilyForm />
        </section>
      ) : (
        <section className="mt-10 rounded-lg border border-zinc-200 p-6">
          <ShoppingRealtimeListener familyId={membership.family_id} />
          <h2 className="text-xl font-semibold">
            Famiglia: {membership.families?.name ?? membership.family_id}
          </h2>
          <p className="mt-2 text-sm text-zinc-600">
            Ruolo: {membership.role}
          </p>

          <div className="mt-6">
            <h3 className="text-lg font-semibold">Aggiungi prodotto</h3>
            <AddItemForm />
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-lg font-semibold">Da comprare</h3>
              <div className="mt-3 space-y-4">
                {pendingByCategory.length === 0 ? (
                  <p className="text-sm text-zinc-500">Nessun prodotto.</p>
                ) : (
                  pendingByCategory.map((group) => (
                    <div key={group.category}>
                      <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-600">
                        {group.category}
                      </h4>
                      <ul className="space-y-2">
                        {group.items.map((item) => (
                          <li
                            key={item.id}
                            className="flex items-center justify-between rounded-md border border-zinc-200 px-3 py-2"
                          >
                            <span>{item.text}</span>
                            <form action={toggleShoppingItemAction}>
                              <input type="hidden" name="item_id" value={item.id} />
                              <button className="rounded-md border border-zinc-300 px-2 py-1 text-xs">
                                Comprato
                              </button>
                            </form>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold">Comprati</h3>
              <div className="mt-3 space-y-4">
                {boughtByCategory.length === 0 ? (
                  <p className="text-sm text-zinc-500">Nessun prodotto.</p>
                ) : (
                  boughtByCategory.map((group) => (
                    <div key={group.category}>
                      <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-600">
                        {group.category}
                      </h4>
                      <ul className="space-y-2">
                        {group.items.map((item) => (
                          <li
                            key={item.id}
                            className="flex items-center justify-between rounded-md border border-zinc-200 px-3 py-2"
                          >
                            <span className="text-zinc-500 line-through">{item.text}</span>
                            <form action={toggleShoppingItemAction}>
                              <input type="hidden" name="item_id" value={item.id} />
                              <button className="rounded-md border border-zinc-300 px-2 py-1 text-xs">
                                Ripristina
                              </button>
                            </form>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {membership.role === "ADMIN" ? <CreateInviteForm /> : null}
        </section>
      )}
    </main>
  );
}
