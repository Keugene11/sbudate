"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Clock, LogOut, Trash2, XCircle } from "lucide-react";

export default function PendingPage() {
  const supabase = createClient();
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [rejected, setRejected] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
      } else if (profile?.status === "rejected") {
        setRejected(true);
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
    } else if (profile?.status === "rejected") {
      setRejected(true);
    }
    setChecking(false);
  };

  const deleteAndLogout = async () => {
    setDeleting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", user.id).single();
      if (profile) {
        await fetch("/api/delete-account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profileId: profile.id }),
        });
      }
    }
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (rejected) return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-8">
      <div className="text-center max-w-sm animate-slide-up">
        <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-9 h-9 text-red-400" strokeWidth={1.5} />
        </div>
        <h1 className="text-[24px] font-bold text-gray-900 tracking-tight mb-2">
          Profile not approved
        </h1>
        <p className="text-gray-400 text-[15px] leading-relaxed mb-8">
          Your profile didn&apos;t meet our guidelines. Please make sure your photos are appropriate and your profile is genuine, then try again.
        </p>
        <button
          onClick={deleteAndLogout}
          disabled={deleting}
          className="press px-6 py-3 bg-gray-900 text-white rounded-2xl text-[15px] font-semibold"
        >
          {deleting ? "Deleting..." : "Delete account & try again"}
        </button>
        <button
          onClick={async () => { await supabase.auth.signOut(); router.push("/login"); }}
          className="press flex items-center justify-center gap-2 mt-4 px-6 py-3 text-gray-400 text-[14px] font-medium mx-auto"
        >
          <LogOut className="w-4 h-4" strokeWidth={1.8} />
          Log out
        </button>
      </div>
    </div>
  );

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
        <button
          onClick={() => setShowDelete(true)}
          className="press flex items-center justify-center gap-2 mt-1 px-6 py-3 text-red-400 text-[14px] font-medium"
        >
          <Trash2 className="w-4 h-4" strokeWidth={1.8} />
          Delete account
        </button>
      </div>

      {showDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 animate-backdrop" onClick={() => setShowDelete(false)} />
          <div className="relative z-10 bg-surface rounded-2xl px-6 py-6 mx-6 max-w-[320px] w-full animate-scale-in">
            <h3 className="text-[18px] font-semibold text-gray-900 text-center mb-2">Delete your account?</h3>
            <p className="text-[14px] text-gray-400 text-center mb-6 leading-relaxed">
              This will permanently delete your profile and all data. This cannot be undone.
            </p>
            <div className="space-y-2">
              <button
                onClick={deleteAndLogout}
                disabled={deleting}
                className="w-full h-[48px] bg-red-500 text-white rounded-xl text-[15px] font-semibold press disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete Account"}
              </button>
              <button onClick={() => setShowDelete(false)}
                className="w-full h-[48px] bg-gray-100 text-gray-700 rounded-xl text-[15px] font-medium press">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
