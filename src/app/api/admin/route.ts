import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const ADMIN_USER_IDS = [
  "keugenelee11@gmail.com", // Add admin emails here
];

async function getAdmin() {
  const serverSupabase = await createServerClient();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user || !ADMIN_USER_IDS.includes(user.email || "")) return null;
  return user;
}

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: Request) {
  const user = await getAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");
  const admin = getAdminClient();

  if (action === "reports") {
    const { data: reports } = await admin.from("reports").select("*").order("created_at", { ascending: false }).limit(50);
    // Enrich with profile names
    const enriched = [];
    for (const report of reports || []) {
      const { data: reporter } = await admin.from("profiles").select("first_name").eq("id", report.reporter_profile_id).single();
      const { data: reported } = await admin.from("profiles").select("first_name").eq("id", report.reported_profile_id).single();
      enriched.push({ ...report, reporter_name: reporter?.first_name, reported_name: reported?.first_name });
    }
    return NextResponse.json(enriched);
  }

  if (action === "users") {
    const { data: profiles } = await admin.from("profiles").select("id, first_name, last_name, age, gender, major, created_at").order("created_at", { ascending: false }).limit(100);
    return NextResponse.json(profiles || []);
  }

  if (action === "messages") {
    const matchId = searchParams.get("matchId");
    if (matchId) {
      const { data: messages } = await admin.from("messages").select("*").eq("match_id", matchId).order("created_at", { ascending: true });
      // Get sender names
      const senderIds = [...new Set(messages?.map(m => m.sender_id) || [])];
      const names: Record<string, string> = {};
      for (const id of senderIds) {
        const { data: p } = await admin.from("profiles").select("first_name").eq("id", id).single();
        if (p) names[id] = p.first_name;
      }
      return NextResponse.json({ messages: messages || [], names });
    }
    // List all matches with message counts
    const { data: matches } = await admin.from("matches").select("*").order("created_at", { ascending: false }).limit(50);
    const enriched = [];
    for (const match of matches || []) {
      const { data: p1 } = await admin.from("profiles").select("first_name").eq("id", match.profile1_id).single();
      const { data: p2 } = await admin.from("profiles").select("first_name").eq("id", match.profile2_id).single();
      const { count } = await admin.from("messages").select("id", { count: "exact", head: true }).eq("match_id", match.id);
      enriched.push({ ...match, name1: p1?.first_name, name2: p2?.first_name, messageCount: count || 0 });
    }
    return NextResponse.json(enriched);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function POST(request: Request) {
  const user = await getAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action, profileId, reportId } = await request.json();
  const admin = getAdminClient();

  if (action === "deleteUser") {
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

  if (action === "dismissReport") {
    await admin.from("reports").delete().eq("id", reportId);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
