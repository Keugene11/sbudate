"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Clock, LogOut } from "lucide-react";

export default function PendingPage() {
  const supabase = createClient();
  const router = useRouter();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    // Poll for approval every 30 seconds
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("status")
        .eq("user_id", user.id)
        .single();
      if (profile?.status === "approved") {
        router.push("/discover");
      }
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, [supabase, router]);

  const handleRefresh = async () => {
    setChecking(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setChecking(false); return; }
    const { data: profile } = await supabase
      .from("profiles")
      .select("status")
      .eq("user_id", user.id)
      .single();
    if (profile?.status === "approved") {
      router.push("/discover");
    }
    setChecking(false);
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-8">
      <div className="text-center max-w-sm animate-slide-up">
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
          <Clock className="w-9 h-9 text-gray-400" strokeWidth={1.5} />
        </div>
        <h1 className="text-[24px] font-bold text-gray-900 tracking-tight mb-2">
          Profile under review
        </h1>
        <p className="text-gray-400 text-[15px] leading-relaxed mb-8">
          Your profile is being reviewed to make sure everything looks good. This usually takes less than 24 hours.
        </p>
        <button
          onClick={handleRefresh}
          disabled={checking}
          className="press px-6 py-3 bg-gray-900 text-white rounded-2xl text-[15px] font-semibold"
        >
          {checking ? "Checking..." : "Check status"}
        </button>
        <button
          onClick={async () => { await supabase.auth.signOut(); router.push("/login"); }}
          className="press flex items-center justify-center gap-2 mt-4 px-6 py-3 text-gray-400 text-[14px] font-medium"
        >
          <LogOut className="w-4 h-4" strokeWidth={1.8} />
          Log out
        </button>
      </div>
    </div>
  );
}
