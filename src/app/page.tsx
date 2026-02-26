import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center px-4 py-8 sm:px-6">
      <section className="ios-card ios-fade-up p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
          Family Grocery App
        </p>
        <h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">
          Lista della Spesa
        </h1>
        <p className="mt-3 max-w-xl text-[15px] text-zinc-600">
          Organizza la spesa di famiglia con suggerimenti intelligenti, categorie automatiche,
          realtime e accesso via invito.
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Link href={user ? "/app" : "/login"} className="ios-btn-primary inline-flex items-center">
            {user ? "Apri applicazione" : "Accesso protetto"}
          </Link>
          <span className="ios-chip">PWA pronta per iPhone</span>
        </div>
      </section>
    </main>
  );
}
