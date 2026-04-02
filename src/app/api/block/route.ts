import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const serverSupabase = await createServerClient();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { blockedProfileId } = await request.json();
  if (!blockedProfileId) return NextResponse.json({ error: "Missing blockedProfileId" }, { status: 400 });

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile } = await admin.from("profiles").select("id").eq("user_id", user.id).single();
  if (!profile) return NextResponse.json({ error: "No profile" }, { status: 400 });

  // Add to skips (acts as block)
  await admin.from("skips").upsert(
    { from_profile_id: profile.id, to_profile_id: blockedProfileId },
    { onConflict: "from_profile_id,to_profile_id" }
  );

  // Delete any existing match
  const { data: match } = await admin.from("matches")
    .select("id")
    .or(`and(profile1_id.eq.${profile.id},profile2_id.eq.${blockedProfileId}),and(profile1_id.eq.${blockedProfileId},profile2_id.eq.${profile.id})`)
    .single();

  if (match) {
    await admin.from("messages").delete().eq("match_id", match.id);
    await admin.from("matches").delete().eq("id", match.id);
  }

  // Delete likes between both
  await admin.from("likes").delete().eq("from_profile_id", profile.id).eq("to_profile_id", blockedProfileId);
  await admin.from("likes").delete().eq("from_profile_id", blockedProfileId).eq("to_profile_id", profile.id);

  return NextResponse.json({ success: true });
}
