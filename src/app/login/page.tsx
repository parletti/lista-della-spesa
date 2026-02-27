import { LoginForm } from "@/app/login/login-form";

type LoginPageProps = {
  searchParams: Promise<{ expired?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const showExpiredMessage = params.expired === "1";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-8">
      <section className="ios-card ios-fade-up p-6">
        <h1 className="text-3xl font-semibold">Accesso</h1>
        <p className="mt-3 text-sm text-zinc-600">
          Inserisci email e password per entrare.
        </p>
        {showExpiredMessage ? (
          <p className="mt-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Sessione scaduta: per sicurezza devi accedere di nuovo (max 30 giorni).
          </p>
        ) : null}
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
