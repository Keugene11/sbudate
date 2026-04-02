import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // Verify the user is authenticated
  const serverSupabase = await createServerClient();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { matchId } = await request.json();
  if (!matchId) return NextResponse.json({ error: "Missing matchId" }, { status: 400 });

  // Use service role to bypass RLS
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Verify the user is part of this match
  const { data: profile } = await admin.from("profiles").select("id").eq("user_id", user.id).single();
  if (!profile) return NextResponse.json({ error: "No profile" }, { status: 400 });

  const { data: match } = await admin.from("matches").select("*").eq("id", matchId).single();
  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });
  if (match.profile1_id !== profile.id && match.profile2_id !== profile.id) {
    return NextResponse.json({ error: "Not your match" }, { status: 403 });
  }

  const otherId = match.profile1_id === profile.id ? match.profile2_id : match.profile1_id;

  // Delete everything
  await admin.from("messages").delete().eq("match_id", matchId);
  await admin.from("likes").delete().eq("from_profile_id", profile.id).eq("to_profile_id", otherId);
  await admin.from("likes").delete().eq("from_profile_id", otherId).eq("to_profile_id", profile.id);
  await admin.from("matches").delete().eq("id", matchId);

  return NextResponse.json({ success: true });
}
