"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut, Settings } from "lucide-react";
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
      const { data: p } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
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

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin" /></div>;
  if (!profile) return null;

  const heightDisplay = profile.height_inches
    ? `${Math.floor(profile.height_inches / 12)}'${profile.height_inches % 12}"`
    : null;

  return (
    <div className="max-w-lg mx-auto bg-white min-h-screen">
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 h-[52px]">
          <h1 className="text-[18px] font-medium">Profile</h1>
          <button onClick={handleLogout} className="press p-2">
            <LogOut className="w-5 h-5 text-gray-500" strokeWidth={2} />
          </button>
        </div>
      </div>

      <div className="pb-24">
        {/* Photos — interleaved with prompts just like how others see you */}
        {profile.photos.map((photo, idx) => (
          <div key={photo.id} className="relative">
            {idx === 0 && (
              <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 pt-16 bg-gradient-to-t from-black/50 to-transparent">
                <div className="flex items-baseline gap-2">
                  <span className="text-white text-[26px] font-bold">{profile.first_name}</span>
                  <span className="text-white/80 text-[24px]">{profile.age}</span>
                </div>
                {profile.major && <p className="text-white/70 text-[14px] mt-0.5">{profile.major}</p>}
              </div>
            )}
            <img src={photo.url} alt="" className="w-full aspect-[4/5] object-cover" draggable={false} />
          </div>
        ))}

        {/* Prompts */}
        {profile.prompts.map((prompt) => (
          <div key={prompt.id} className="bg-cream px-5 py-6">
            <p className="text-[12px] font-medium text-gray-500 uppercase tracking-[0.1em] mb-1.5">
              {prompt.question}
            </p>
            <p className="font-serif text-[20px] text-black leading-[1.35]">
              {prompt.answer}
            </p>
          </div>
        ))}

        {/* Vitals */}
        <div className="px-5 py-5">
          <p className="text-[12px] font-medium text-gray-500 uppercase tracking-[0.1em] mb-3">My vitals</p>
          <div className="flex flex-wrap gap-2">
            {heightDisplay && <span className="px-3 py-1.5 bg-gray-100 rounded-full text-[13px] text-gray-800 font-medium">{heightDisplay}</span>}
            {profile.graduation_year && <span className="px-3 py-1.5 bg-gray-100 rounded-full text-[13px] text-gray-800 font-medium">Class of {profile.graduation_year}</span>}
            {profile.dating_intention && <span className="px-3 py-1.5 bg-gray-100 rounded-full text-[13px] text-gray-800 font-medium">{profile.dating_intention}</span>}
            {profile.hometown && <span className="px-3 py-1.5 bg-gray-100 rounded-full text-[13px] text-gray-800 font-medium">{profile.hometown}</span>}
            {profile.major && <span className="px-3 py-1.5 bg-gray-100 rounded-full text-[13px] text-gray-800 font-medium">{profile.major}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
