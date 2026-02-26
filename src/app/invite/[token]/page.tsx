import { getSupabaseServerClient } from "@/lib/supabase/server";
import { AcceptInviteForm } from "@/app/invite/[token]/accept-invite-form";
import { InviteLoginForm } from "@/app/invite/[token]/invite-login-form";

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function InvitePage({ params }: PageProps) {
  const { token } = await params;
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6">
      <h1 className="text-3xl font-semibold">Invito famiglia</h1>
      {!user ? (
        <>
          <p className="mt-2 text-sm text-zinc-600">
            Inserisci la tua email per ricevere il magic link di accesso legato a questo invito.
          </p>
          <InviteLoginForm token={token} />
        </>
      ) : (
        <>
          <p className="mt-2 text-sm text-zinc-600">
            Conferma per unirti alla lista spesa condivisa.
          </p>
          <AcceptInviteForm token={token} />
        </>
      )}
    </main>
  );
}
