import { redirect } from "next/navigation";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { PhotoImportLab } from "@/app/app/lab/photo-import/photo-import-lab";

export const dynamic = "force-dynamic";

type ProfileRow = {
  id: string;
};

type MembershipRow = {
  role: "ADMIN" | "MEMBER";
};

export default async function PhotoImportLabPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const admin = getSupabaseAdminClient();
  const profileQuery = await admin
    .from("profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle<ProfileRow>();

  const profile = profileQuery.data;
  if (!profile?.id) {
    redirect("/app");
  }

  const membershipQuery = await admin
    .from("family_members")
    .select("role")
    .eq("profile_id", profile.id)
    .limit(1)
    .maybeSingle<MembershipRow>();

  if (!membershipQuery.data || membershipQuery.data.role !== "ADMIN") {
    redirect("/app");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-3 py-3 sm:px-4 sm:py-5">
      <PhotoImportLab />
    </main>
  );
}
