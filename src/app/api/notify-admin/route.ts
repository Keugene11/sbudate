import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function POST(request: Request) {
  const serverSupabase = await createServerClient();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { profileId } = await request.json();

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile } = await admin
    .from("profiles")
    .select("first_name, age, gender, major, graduation_year, hometown, residence_hall, height_inches, drinking, smoking")
    .eq("id", profileId)
    .single();
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const { data: photos } = await admin
    .from("photos")
    .select("url, position")
    .eq("profile_id", profileId)
    .order("position")
    .limit(6);

  const { data: prompts } = await admin
    .from("prompts")
    .select("question, answer, position")
    .eq("profile_id", profileId)
    .order("position");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://sbudate.vercel.app";
  const token = process.env.ADMIN_REVIEW_SECRET;
  const approveUrl = `${appUrl}/api/admin/review?token=${token}&id=${profileId}&action=approve`;
  const rejectUrl = `${appUrl}/api/admin/review?token=${token}&id=${profileId}&action=reject`;

  const formatHeight = (inches: number | null) => {
    if (!inches) return null;
    return `${Math.floor(inches / 12)}'${inches % 12}"`;
  };

  const detailParts = [
    profile.gender,
    profile.major,
    profile.graduation_year ? `Class of ${profile.graduation_year}` : null,
    formatHeight(profile.height_inches),
    profile.hometown ? `From ${profile.hometown}` : null,
    profile.residence_hall,
    profile.drinking ? `Drinks: ${profile.drinking}` : null,
    profile.smoking ? `Smokes: ${profile.smoking}` : null,
  ].filter(Boolean);

  const photosHtml = (photos || []).map((p) =>
    `<img src="${p.url}" style="width: 100%; border-radius: 12px; margin-bottom: 8px; display: block;" />`
  ).join("");

  const promptsHtml = (prompts || []).map((p) =>
    `<div style="background: #f5f5f5; border-radius: 12px; padding: 16px 20px; margin-bottom: 8px;">
      <p style="margin: 0 0 6px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #999; font-weight: 600;">${p.question}</p>
      <p style="margin: 0; font-size: 16px; color: #111; font-weight: 500; line-height: 1.4;">${p.answer}</p>
    </div>`
  ).join("");

  try {
    await transporter.sendMail({
      from: `SBUdate <${process.env.GMAIL_USER}>`,
      to: "keugenelee11@gmail.com",
      subject: `Review: ${profile.first_name}, ${profile.age}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 16px; background: #fff;">
          <p style="font-size: 13px; color: #999; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; margin: 0 0 20px;">New Profile to Review</p>
          <h1 style="font-size: 26px; font-weight: 700; color: #111; margin: 0 0 6px;">${profile.first_name}, ${profile.age}</h1>
          <p style="font-size: 14px; color: #666; margin: 0 0 24px; line-height: 1.5;">${detailParts.join(" · ")}</p>
          ${photosHtml}
          <div style="margin-top: 16px;">${promptsHtml}</div>
          <div style="margin-top: 28px;">
            <a href="${approveUrl}" style="display: inline-block; background: #111; color: #fff; padding: 14px 32px; border-radius: 14px; text-decoration: none; font-size: 15px; font-weight: 600; margin-right: 10px;">
              ✓&nbsp; Approve
            </a>
            <a href="${rejectUrl}" style="display: inline-block; background: #fef2f2; color: #dc2626; padding: 14px 32px; border-radius: 14px; text-decoration: none; font-size: 15px; font-weight: 600;">
              ✕&nbsp; Reject
            </a>
          </div>
          <p style="font-size: 12px; color: #ccc; margin-top: 32px;">SBUdate Admin · <a href="${appUrl}/admin" style="color: #999;">Open Dashboard</a></p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send notification email:", err);
  }

  return NextResponse.json({ success: true });
}
