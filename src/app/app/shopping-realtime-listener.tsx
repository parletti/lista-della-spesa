"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Props = {
  familyId: string;
  hasActivePresence: boolean;
};

export function ShoppingRealtimeListener({ familyId, hasActivePresence }: Props) {
  const router = useRouter();

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    const channel = supabase
      .channel(`shopping-items-${familyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shopping_items",
          filter: `family_id=eq.${familyId}`,
        },
        () => {
          router.refresh();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shopping_presence_sessions",
          filter: `family_id=eq.${familyId}`,
        },
        () => {
          router.refresh();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [familyId, router]);

  useEffect(() => {
    if (!hasActivePresence) {
      return;
    }

    const intervalId = window.setInterval(() => {
      router.refresh();
    }, 60_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [hasActivePresence, router]);

  return null;
}
