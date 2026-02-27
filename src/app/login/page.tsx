import { LoginForm } from "@/app/login/login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-8">
      <section className="ios-card ios-fade-up p-6">
        <h1 className="text-3xl font-semibold">Accesso</h1>
        <p className="mt-3 text-sm text-zinc-600">
          Inserisci email e password per entrare.
        </p>
        <LoginForm />
        <hr className="my-5 border-zinc-200" />
        <h2 className="text-lg font-semibold">Nuovi utenti</h2>
        <p className="mt-3 text-sm text-zinc-600">
          Chiedi all&apos;admin famiglia la creazione del tuo account.
        </p>
      </section>
    </main>
  );
}
