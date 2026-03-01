import { redirect } from "next/navigation";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { CreateFamilyForm } from "@/app/app/create-family-form";
import {
  startShoppingPresenceAction,
  stopShoppingPresenceAction,
  signOutAction,
} from "@/app/app/actions";
import { AddItemForm } from "@/app/app/add-item-form";
import { ShoppingRealtimeListener } from "@/app/app/shopping-realtime-listener";
import { CreateInviteForm } from "@/app/app/create-invite-form";
import { ItemActionsMenu } from "@/app/app/item-actions-menu";
import { OptimisticToggleButton } from "@/app/app/optimistic-toggle-button";
import { SessionLifetimeGuard } from "@/app/app/session-lifetime-guard";

export const dynamic = "force-dynamic";

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
  category_id: string | null;
  categories: { label: string } | { label: string }[] | null;
};

type CategoryRow = {
  id: string;
  label: string;
};

type PresenceSessionRow = {
  id: string;
  profile_id: string;
  started_at: string;
  display_name: string;
  minutes_active: number;
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
  let categories: CategoryRow[] = [];
  let activePresenceSessions: PresenceSessionRow[] = [];
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
        .select("id, text, status, created_at, normalized_text, product_id, category_id, categories(label)")
        .eq("family_id", membership.family_id)
        .order("created_at", { ascending: false });

      if (!itemsQuery.error) {
        items = (itemsQuery.data ?? []) as ShoppingItemRow[];
      }

      const categoriesQuery = await admin
        .from("categories")
        .select("id, label")
        .order("sort_order", { ascending: true });
      if (!categoriesQuery.error) {
        categories = (categoriesQuery.data ?? []) as CategoryRow[];
      }

      const presenceQuery = await admin
        .rpc("get_active_shopping_presence_sessions", { p_family_id: membership.family_id });

      if (!presenceQuery.error) {
        activePresenceSessions = (presenceQuery.data ?? []) as PresenceSessionRow[];
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
  const displayNameForPresence = (session: PresenceSessionRow) =>
    session.display_name || "Membro famiglia";
  const currentUserPresenceActive = Boolean(
    profile?.id &&
      activePresenceSessions.some((session) => session.profile_id === profile.id),
  );

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-3 py-3 sm:px-4 sm:py-5">
      <header className="ios-card ios-fade-up sticky top-2 z-20 mb-3 flex items-center justify-between px-3 py-2">
        <div>
          <p className="text-xs text-zinc-500">Connesso come</p>
          <h1 className="text-base font-semibold leading-tight">
            {profile?.display_name ?? user.email ?? "Utente"}
          </h1>
        </div>
        <form action={signOutAction}>
          <button className="ios-btn-secondary">
            Logout
          </button>
        </form>
      </header>

      {!membership ? (
        <section className="ios-card ios-fade-up ios-fade-up-delay-1 mt-2 p-5">
          <h2 className="text-lg font-semibold">Crea la tua famiglia</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Primo accesso rilevato: crea ora la famiglia per iniziare.
          </p>
          <CreateFamilyForm />
        </section>
      ) : (
        <section className="ios-card ios-fade-up ios-fade-up-delay-1 p-3 sm:p-4">
          <SessionLifetimeGuard />
          <ShoppingRealtimeListener
            familyId={membership.family_id}
            hasActivePresence={activePresenceSessions.length > 0}
          />
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-base font-semibold leading-tight">
              Famiglia: {membership.families?.name ?? membership.family_id}
            </h2>
            <span className={`ios-chip ${membership.role === "ADMIN" ? "ios-chip-admin" : ""}`}>
              {membership.role}
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Lista condivisa in tempo reale
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <form action={currentUserPresenceActive ? stopShoppingPresenceAction : startShoppingPresenceAction}>
              <button className={currentUserPresenceActive ? "ios-btn-secondary" : "ios-btn-primary"}>
                {currentUserPresenceActive ? "Termina spesa" : "Sto facendo la spesa"}
              </button>
            </form>
          </div>

          {activePresenceSessions.length > 0 ? (
            <div className="ios-presence-banner mt-2 rounded-xl px-3 py-2">
              <p className="text-xs font-semibold">
                In spesa ora:{" "}
                {activePresenceSessions
                  .map((session) => displayNameForPresence(session))
                  .join(", ")}
              </p>
              <p className="mt-0.5 text-[11px] text-zinc-700">
                {activePresenceSessions
                  .map(
                    (session) =>
                      `${displayNameForPresence(session)} attivo da ${session.minutes_active} min`,
                  )
                  .join(" • ")}
              </p>
            </div>
          ) : null}

          <div className="mt-3 rounded-2xl bg-white/80 p-2.5 ring-1 ring-black/5">
            <h3 className="ios-section-title">Aggiungi prodotto</h3>
            <AddItemForm />
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="ios-list-pending ios-panel-pending ios-fade-up ios-fade-up-delay-2 rounded-2xl p-2.5 shadow-sm">
              <h3 className="ios-section-title">Da comprare</h3>
              <div className="mt-2 space-y-2.5">
                {pendingByCategory.length === 0 ? (
                  <p className="text-xs text-zinc-500">Nessun prodotto.</p>
                ) : (
                  pendingByCategory.map((group) => (
                    <div key={group.category}>
                      <h4 className="ios-group-title mb-1">
                        <span className="ios-category-badge">{group.category}</span>
                      </h4>
                      <ul className="space-y-1.5">
                        {group.items.map((item) => (
                          <li
                            key={item.id}
                            data-item-row-id={item.id}
                            className="ios-item-row flex items-center justify-between rounded-xl px-2 py-1.5"
                          >
                            <span className="text-[15px] font-medium text-zinc-800">{item.text}</span>
                            <div className="flex items-center gap-2">
                              <OptimisticToggleButton itemId={item.id} label="Comprato" />
                              <ItemActionsMenu
                                itemId={item.id}
                                currentText={item.text}
                                currentCategoryId={item.category_id}
                                categories={categories}
                              />
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="ios-list-bought ios-panel-bought ios-fade-up ios-fade-up-delay-2 rounded-2xl p-2.5 shadow-sm">
              <h3 className="ios-section-title">Comprati</h3>
              <div className="mt-2 space-y-2.5">
                {boughtByCategory.length === 0 ? (
                  <p className="text-xs text-zinc-500">Nessun prodotto.</p>
                ) : (
                  boughtByCategory.map((group) => (
                    <div key={group.category}>
                      <h4 className="ios-group-title mb-1">
                        <span className="ios-category-badge">{group.category}</span>
                      </h4>
                      <ul className="space-y-1.5">
                        {group.items.map((item) => (
                          <li
                            key={item.id}
                            data-item-row-id={item.id}
                            className="ios-item-row flex items-center justify-between rounded-xl px-2 py-1.5"
                          >
                            <span className="text-[15px] text-zinc-500 line-through">{item.text}</span>
                            <div className="flex items-center gap-2">
                              <OptimisticToggleButton itemId={item.id} label="Compra" />
                              <ItemActionsMenu
                                itemId={item.id}
                                currentText={item.text}
                                currentCategoryId={item.category_id}
                                categories={categories}
                              />
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {membership.role === "ADMIN" ? (
            <div className="ios-fade-up ios-fade-up-delay-3 mt-4 rounded-2xl bg-white/70 p-2.5 ring-1 ring-black/5">
              <CreateInviteForm />
            </div>
          ) : null}
        </section>
      )}
    </main>
  );
}
