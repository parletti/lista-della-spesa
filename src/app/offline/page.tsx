export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6">
      <h1 className="text-3xl font-semibold">Sei offline</h1>
      <p className="mt-3 text-sm text-zinc-600">
        Controlla la connessione e riprova. Le aggiunte effettuate offline
        verranno sincronizzate automaticamente al ritorno online.
      </p>
    </main>
  );
}
