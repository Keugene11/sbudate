import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const messageId = searchParams.get("id");
  const action = searchParams.get("action");

  if (token !== process.env.ADMIN_REVIEW_SECRET) {
    return new NextResponse("<h1>Unauthorized</h1>", { status: 401, headers: { "Content-Type": "text/html" } });
  }

  if (!messageId || !action || !["approve", "reject"].includes(action)) {
    return new NextResponse("<h1>Invalid request</h1>", { status: 400, headers: { "Content-Type": "text/html" } });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const status = action === "approve" ? "approved" : "rejected";
  const { error } = await admin.from("messages").update({ status }).eq("id", messageId);

  if (error) {
    return new NextResponse("<h1>Error updating message</h1>", { status: 500, headers: { "Content-Type": "text/html" } });
  }

  const color = action === "approve" ? "#16a34a" : "#dc2626";

  return new NextResponse(`
    <html>
    <head><meta name="viewport" content="width=device-width, initial-scale=1"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #fafafa;">
      <div style="text-align: center; padding: 32px;">
        <div style="width: 64px; height: 64px; border-radius: 50%; background: ${color}15; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
          <span style="font-size: 28px;">${action === "approve" ? "✓" : "✕"}</span>
        </div>
        <h1 style="font-size: 22px; font-weight: 700; color: #111; margin: 0 0 8px;">Message ${action === "approve" ? "approved" : "rejected"}</h1>
        <p style="font-size: 15px; color: #666; margin: 0;">${action === "approve" ? "The message is now visible to the recipient." : "The message has been removed."}</p>
      </div>
    </body>
    </html>
  `, { status: 200, headers: { "Content-Type": "text/html" } });
}
