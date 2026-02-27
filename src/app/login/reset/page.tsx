import Link from "next/link";
import { ResetForm } from "@/app/login/reset/reset-form";

export default function ResetPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-8">
      <section className="ios-card ios-fade-up p-6">
        <h1 className="text-2xl font-semibold">Imposta nuova password</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Completa il reset impostando una password conforme ai requisiti minimi.
        </p>
        <ResetForm />
        <Link href="/login" className="mt-4 inline-flex text-xs text-[#007AFF] hover:underline">
          Torna al login
        </Link>
      </section>
    </main>
  );
}
