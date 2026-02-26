"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function LoginAutoConfirm() {
  const router = useRouter();

  useEffect(() => {
    const url = new URL(window.location.href);
    const hasCode = Boolean(url.searchParams.get("code"));
    const hasTokenHash = Boolean(url.searchParams.get("token_hash"));
    const hasHashTokens =
      url.hash.includes("access_token=") || url.hash.includes("refresh_token=");

    if (!hasCode && !hasTokenHash && !hasHashTokens) {
      return;
    }

    router.replace(`/auth/confirm${url.search}${url.hash}`);
  }, [router]);

  return null;
}
