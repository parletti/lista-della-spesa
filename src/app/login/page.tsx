export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-8">
      <section className="ios-card ios-fade-up p-6">
        <h1 className="text-3xl font-semibold">Accesso protetto</h1>
        <p className="mt-3 text-sm text-zinc-600">
          L&apos;accesso per nuovi utenti avviene solo tramite link invito.
        </p>
        <p className="mt-2 text-sm text-zinc-600">
          Apri il link invito ricevuto da un admin famiglia per continuare.
        </p>
      </section>
    </main>
  );
}
