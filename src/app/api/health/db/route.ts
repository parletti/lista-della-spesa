import { NextResponse } from "next/server";
import { getSupabasePublicEnv, getSupabaseServiceRoleKey } from "@/lib/env";

export async function GET() {
  const env = getSupabasePublicEnv();
  const serviceRoleKey = getSupabaseServiceRoleKey();

  if (!env) {
    return NextResponse.json(
      {
        ok: false,
        configured: false,
        message:
          "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      },
      { status: 503 },
    );
  }

  if (!serviceRoleKey) {
    return NextResponse.json(
      {
        ok: false,
        configured: false,
        message: "Missing SUPABASE_SERVICE_ROLE_KEY.",
      },
      { status: 503 },
    );
  }

  try {
    const response = await fetch(`${env.url}/rest/v1/`, {
      method: "GET",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });

    return NextResponse.json(
      {
        ok: response.ok,
        configured: true,
        status: response.status,
      },
      { status: response.ok ? 200 : 503 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        configured: true,
        message: "Supabase connectivity check failed.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 },
    );
  }
}
