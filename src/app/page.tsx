import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6">
      <h1 className="text-4xl font-semibold">Lista della Spesa</h1>
      <p className="mt-3 text-zinc-600">
        App famigliare condivisa. Accesso via magic link email.
      </p>

      <div className="mt-8 flex gap-3">
        <Link
          href={user ? "/app" : "/login"}
          className="rounded-md bg-black px-4 py-2 text-white"
        >
          {user ? "Apri applicazione" : "Vai al login"}
        </Link>
      </div>
    </main>
  );
}
