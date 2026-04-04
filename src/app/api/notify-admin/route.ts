import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { Resend } from "resend";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // Verify the caller is authenticated
  const serverSupabase = await createServerClient();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { profileId } = await request.json();

  // Fetch profile details with service role
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: profile } = await admin
    .from("profiles")
    .select("first_name, age, gender, major, graduation_year")
    .eq("id", profileId)
    .single();

  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://sbudate.com";

  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set — skipping email notification");
    return NextResponse.json({ success: true });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    await resend.emails.send({
      from: "SBUdate <notifications@send.sbudate.com>",
      to: "keugenelee11@gmail.com",
      subject: `New profile to review: ${profile.first_name}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
          <h2 style="font-size: 20px; font-weight: 700; color: #111; margin-bottom: 16px;">New profile submitted</h2>
          <div style="background: #f9f9f9; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <p style="margin: 0 0 8px; font-size: 16px; font-weight: 600; color: #111;">${profile.first_name}, ${profile.age}</p>
            <p style="margin: 0; font-size: 14px; color: #666;">
              ${profile.gender}${profile.major ? ` · ${profile.major}` : ""}${profile.graduation_year ? ` · Class of ${profile.graduation_year}` : ""}
            </p>
          </div>
          <a href="${appUrl}/admin" style="display: inline-block; background: #111; color: #fff; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-size: 14px; font-weight: 600;">
            Review in Admin Dashboard
          </a>
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send notification email:", err);
    // Don't fail the request — profile was still created
  }

  return NextResponse.json({ success: true });
}
