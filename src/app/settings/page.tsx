"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ChevronLeft, Pause, Play, Trash2, LogOut, Mail } from "lucide-react";

export default function SettingsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [isPaused, setIsPaused] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPauseConfirm, setShowPauseConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

  useState(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: p } = await supabase.from("profiles").select("id, is_paused").eq("user_id", user.id).single();
      if (p) {
        setProfileId(p.id);
        setIsPaused(p.is_paused || false);
      }
      setLoading(false);
    })();
  });

  const togglePause = async () => {
    if (!profileId) return;
    const newPaused = !isPaused;
    await supabase.from("profiles").update({ is_paused: newPaused }).eq("id", profileId);
    setIsPaused(newPaused);
    setShowPauseConfirm(false);
  };

  const handleDelete = async () => {
    if (!profileId) return;
    setDeleting(true);
    await fetch("/api/delete-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId }),
    });
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) return (
    <div className="h-[100dvh] flex items-center justify-center bg-surface">
      <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="h-[100dvh] flex flex-col bg-surface animate-push-in">
      {/* Header */}
      <div className="flex items-center px-4 h-[56px] flex-shrink-0 border-b border-border">
        <button onClick={() => router.push("/profile")} className="press p-1.5 -ml-1">
          <ChevronLeft className="w-6 h-6 text-gray-900" strokeWidth={2} />
        </button>
        <span className="text-[16px] text-gray-900 font-semibold ml-2">Settings</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-5 py-6 space-y-6">

          {/* Account section */}
          <div>
            <p className="text-[12px] text-gray-400 uppercase tracking-[0.08em] font-medium mb-3">Account</p>
            <div className="bg-surface rounded-2xl overflow-hidden border border-border">
              {/* Pause */}
              <button
                onClick={() => setShowPauseConfirm(true)}
                className="w-full px-5 py-4 flex items-center justify-between press text-left hover:bg-gray-50 transition-colors border-b border-border"
              >
                <div className="flex items-center gap-3">
                  {isPaused ? (
                    <Play className="w-[18px] h-[18px] text-teal" strokeWidth={1.8} />
                  ) : (
                    <Pause className="w-[18px] h-[18px] text-gray-500" strokeWidth={1.8} />
                  )}
                  <div>
                    <p className="text-[15px] text-gray-900 font-medium">
                      {isPaused ? "Resume account" : "Pause account"}
                    </p>
                    <p className="text-[12px] text-gray-400 mt-0.5">
                      {isPaused ? "Your profile is currently hidden" : "Hide your profile temporarily"}
                    </p>
                  </div>
                </div>
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="w-full px-5 py-4 flex items-center gap-3 press text-left hover:bg-gray-50 transition-colors border-b border-border"
              >
                <LogOut className="w-[18px] h-[18px] text-gray-500" strokeWidth={1.8} />
                <p className="text-[15px] text-gray-900 font-medium">Log out</p>
              </button>

              {/* Delete */}
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full px-5 py-4 flex items-center gap-3 press text-left hover:bg-gray-50 transition-colors"
              >
                <Trash2 className="w-[18px] h-[18px] text-red-500" strokeWidth={1.8} />
                <div>
                  <p className="text-[15px] text-red-500 font-medium">Delete account</p>
                  <p className="text-[12px] text-gray-400 mt-0.5">Permanently delete your account and data</p>
                </div>
              </button>
            </div>
          </div>

          {/* Support */}
          <div>
            <p className="text-[12px] text-gray-400 uppercase tracking-[0.08em] font-medium mb-3">Support</p>
            <div className="bg-surface rounded-2xl overflow-hidden border border-border">
              <a
                href="mailto:keugenelee11@gmail.com"
                className="w-full px-5 py-4 flex items-center gap-3 press text-left hover:bg-gray-50 transition-colors block"
              >
                <Mail className="w-[18px] h-[18px] text-gray-500" strokeWidth={1.8} />
                <div>
                  <p className="text-[15px] text-gray-900 font-medium">Contact Support</p>
                  <p className="text-[12px] text-gray-400 mt-0.5">keugenelee11@gmail.com</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Pause confirmation */}
      {showPauseConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 animate-backdrop" onClick={() => setShowPauseConfirm(false)} />
          <div className="relative z-10 bg-surface rounded-2xl px-6 py-6 mx-6 max-w-[320px] w-full animate-scale-in">
            <h3 className="text-[18px] font-semibold text-gray-900 text-center mb-2">
              {isPaused ? "Resume your account?" : "Pause your account?"}
            </h3>
            <p className="text-[14px] text-gray-400 text-center mb-6 leading-relaxed">
              {isPaused
                ? "Your profile will be visible again and you can start matching."
                : "Your profile will be hidden from others. You won't appear in discover or receive new likes."}
            </p>
            <div className="space-y-2">
              <button onClick={togglePause}
                className={`w-full h-[48px] rounded-xl text-[15px] font-semibold press ${
                  isPaused ? "bg-gray-900 text-white" : "bg-orange-500 text-white"
                }`}>
                {isPaused ? "Resume" : "Pause"}
              </button>
              <button onClick={() => setShowPauseConfirm(false)}
                className="w-full h-[48px] bg-gray-100 text-gray-700 rounded-xl text-[15px] font-medium press">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 animate-backdrop" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative z-10 bg-surface rounded-2xl px-6 py-6 mx-6 max-w-[320px] w-full animate-scale-in">
            <h3 className="text-[18px] font-semibold text-gray-900 text-center mb-2">Delete your account?</h3>
            <p className="text-[14px] text-gray-400 text-center mb-6 leading-relaxed">
              This will permanently delete your profile, matches, messages, and all data. This cannot be undone.
            </p>
            <div className="space-y-2">
              <button onClick={handleDelete} disabled={deleting}
                className="w-full h-[48px] bg-red-500 text-white rounded-xl text-[15px] font-semibold press disabled:opacity-50">
                {deleting ? "Deleting..." : "Delete Account"}
              </button>
              <button onClick={() => setShowDeleteConfirm(false)}
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
