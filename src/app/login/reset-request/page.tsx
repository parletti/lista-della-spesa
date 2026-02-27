import Link from "next/link";
import { ResetRequestForm } from "@/app/login/reset-request-form";

export default function ResetRequestPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-8">
      <section className="ios-card ios-fade-up p-6">
        <h1 className="text-2xl font-semibold">Reset password</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Inserisci la tua email per ricevere il link di ripristino.
        </p>
        <ResetRequestForm />
        <Link href="/login" className="mt-4 inline-flex text-xs text-[#007AFF] hover:underline">
          Torna al login
        </Link>
      </section>
    </main>
  );
}
