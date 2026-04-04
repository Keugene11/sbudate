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

  const { messageId } = await request.json();

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: message } = await admin
    .from("messages")
    .select("id, content, sender_id, match_id, created_at")
    .eq("id", messageId)
    .single();
  if (!message) return NextResponse.json({ error: "Message not found" }, { status: 404 });

  const { data: sender } = await admin.from("profiles").select("first_name").eq("id", message.sender_id).single();

  // Get the other person in the match
  const { data: match } = await admin.from("matches").select("profile1_id, profile2_id").eq("id", message.match_id).single();
  const recipientId = match?.profile1_id === message.sender_id ? match?.profile2_id : match?.profile1_id;
  const { data: recipient } = await admin.from("profiles").select("first_name").eq("id", recipientId).single();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://sbudate.vercel.app";
  const token = process.env.ADMIN_REVIEW_SECRET;
  const approveUrl = `${appUrl}/api/admin/review-message?token=${token}&id=${message.id}&action=approve`;
  const rejectUrl = `${appUrl}/api/admin/review-message?token=${token}&id=${message.id}&action=reject`;

  try {
    await transporter.sendMail({
      from: `SBUdate <${process.env.GMAIL_USER}>`,
      to: "keugenelee11@gmail.com",
      subject: `Message: ${sender?.first_name} → ${recipient?.first_name}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 16px; background: #fff;">
          <p style="font-size: 13px; color: #999; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; margin: 0 0 20px;">Message Review</p>
          <p style="font-size: 14px; color: #666; margin: 0 0 12px;">
            <strong style="color: #111;">${sender?.first_name}</strong> → <strong style="color: #111;">${recipient?.first_name}</strong>
          </p>
          <div style="background: #111; color: #fff; border-radius: 20px; border-bottom-right-radius: 6px; padding: 12px 18px; font-size: 16px; line-height: 1.45; display: inline-block; max-width: 320px; margin-bottom: 24px;">
            ${message.content}
          </div>
          <div style="margin-top: 8px;">
            <a href="${approveUrl}" style="display: inline-block; background: #111; color: #fff; padding: 14px 32px; border-radius: 14px; text-decoration: none; font-size: 15px; font-weight: 600; margin-right: 10px;">
              ✓&nbsp; Approve
            </a>
            <a href="${rejectUrl}" style="display: inline-block; background: #fef2f2; color: #dc2626; padding: 14px 32px; border-radius: 14px; text-decoration: none; font-size: 15px; font-weight: 600;">
              ✕&nbsp; Reject
            </a>
          </div>
          <p style="font-size: 12px; color: #ccc; margin-top: 32px;">SBUdate Admin</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send message notification:", err);
  }

  return NextResponse.json({ success: true });
}
