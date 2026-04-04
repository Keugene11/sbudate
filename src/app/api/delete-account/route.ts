import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const serverSupabase = await createServerClient();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { profileId } = await request.json();

  // Verify the profile belongs to this user
  const { data: profile } = await serverSupabase
    .from("profiles")
    .select("id")
    .eq("id", profileId)
    .eq("user_id", user.id)
    .single();
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await admin.from("messages").delete().eq("sender_id", profileId);
  await admin.from("likes").delete().or(`from_profile_id.eq.${profileId},to_profile_id.eq.${profileId}`);
  await admin.from("matches").delete().or(`profile1_id.eq.${profileId},profile2_id.eq.${profileId}`);
  await admin.from("skips").delete().or(`from_profile_id.eq.${profileId},to_profile_id.eq.${profileId}`);
  await admin.from("prompts").delete().eq("profile_id", profileId);
  await admin.from("photos").delete().eq("profile_id", profileId);
  await admin.from("reports").delete().eq("reporter_profile_id", profileId);
  await admin.from("reports").delete().eq("reported_profile_id", profileId);
  await admin.from("profiles").delete().eq("id", profileId);

  return NextResponse.json({ success: true });
}
