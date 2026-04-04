import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const serverSupabase = await createServerClient();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { likeId } = await request.json();

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Verify the like is TO this user
  const { data: profile } = await admin.from("profiles").select("id").eq("user_id", user.id).single();
  if (!profile) return NextResponse.json({ error: "No profile" }, { status: 400 });

  const { data: like } = await admin.from("likes").select("id, to_profile_id").eq("id", likeId).single();
  if (!like || like.to_profile_id !== profile.id) return NextResponse.json({ error: "Not your like" }, { status: 403 });

  await admin.from("likes").delete().eq("id", likeId);
  return NextResponse.json({ success: true });
}
