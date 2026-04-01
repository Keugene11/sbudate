"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Settings, LogOut, Edit3 } from "lucide-react";
import type { ProfileWithContent } from "@/types";

export default function ProfilePage() {
  const supabase = createClient();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileWithContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: p } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!p) return;

      const [{ data: photos }, { data: prompts }] = await Promise.all([
        supabase.from("photos").select("*").eq("profile_id", p.id).order("position"),
        supabase.from("prompts").select("*").eq("profile_id", p.id).order("position"),
      ]);

      setProfile({ ...p, photos: photos || [], prompts: prompts || [] });
      setLoading(false);
    };

    fetchProfile();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const heightDisplay = profile?.height_inches
    ? `${Math.floor(profile.height_inches / 12)}'${profile.height_inches % 12}"`
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-border border-t-hinge-black rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="max-w-md mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-hinge-white/90 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-5 py-3">
          <h1 className="font-serif text-[20px] font-semibold text-hinge-black">
            My Profile
          </h1>
          <div className="flex items-center gap-2">
            <button onClick={handleLogout} className="press p-2 rounded-full hover:bg-bg-input transition-colors">
              <LogOut className="w-5 h-5 text-dove" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      <div className="pb-24">
        {/* Photos */}
        {profile.photos.map((photo, idx) => (
          <div key={photo.id} className="relative">
            {idx === 0 && (
              <div className="absolute bottom-0 left-0 right-0 z-10 p-5 bg-gradient-to-t from-black/60 to-transparent">
                <h2 className="text-white text-[28px] font-bold tracking-tight leading-tight">
                  {profile.first_name}, {profile.age}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  {profile.major && (
                    <span className="text-white/80 text-[14px]">{profile.major}</span>
                  )}
                  {profile.graduation_year && (
                    <span className="text-white/60 text-[14px]">• Class of {profile.graduation_year}</span>
                  )}
                </div>
              </div>
            )}
            <img
              src={photo.url}
              alt=""
              className="w-full aspect-[3/4] object-cover"
            />
          </div>
        ))}

        {/* Prompts */}
        {profile.prompts.map((prompt) => (
          <div key={prompt.id} className="mx-4 my-3 bg-bg-card rounded-2xl border border-border p-6">
            <p className="text-[12px] uppercase tracking-wider text-dove font-semibold mb-2">
              {prompt.question}
            </p>
            <p className="font-serif text-[22px] font-medium text-hinge-black leading-snug">
              {prompt.answer}
            </p>
          </div>
        ))}

        {/* Vitals */}
        <div className="mx-4 my-3 bg-bg-card rounded-2xl border border-border p-6">
          <p className="text-[12px] uppercase tracking-wider text-dove font-semibold mb-4">My Vitals</p>
          <div className="flex flex-wrap gap-2">
            {heightDisplay && (
              <span className="px-3 py-1.5 bg-bg-input rounded-full text-[13px] text-stone font-medium">
                📏 {heightDisplay}
              </span>
            )}
            {profile.hometown && (
              <span className="px-3 py-1.5 bg-bg-input rounded-full text-[13px] text-stone font-medium">
                📍 {profile.hometown}
              </span>
            )}
            {profile.dating_intention && (
              <span className="px-3 py-1.5 bg-bg-input rounded-full text-[13px] text-stone font-medium">
                💜 {profile.dating_intention}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
