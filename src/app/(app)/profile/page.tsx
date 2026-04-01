"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut, Pencil, Cake, User, Ruler, MapPin, GraduationCap, Home, Building } from "lucide-react";
import type { ProfileWithContent } from "@/types";
import Link from "next/link";

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
          <div className="flex items-center gap-1">
            <Link href="/profile/edit" className="press p-2">
              <Pencil className="w-[18px] h-[18px] text-gray-600" strokeWidth={2} />
            </Link>
            <button onClick={handleLogout} className="press p-2">
              <LogOut className="w-[18px] h-[18px] text-gray-500" strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>

      <div className="pb-24">
        {/* Vitals card */}
        <div className="px-4 pt-4 space-y-3">
          {(() => {
            const vitals: { icon: typeof Cake; value: string }[] = [];
            if (profile.age) vitals.push({ icon: Cake, value: String(profile.age) });
            if (profile.gender) vitals.push({ icon: User, value: profile.gender });
            if (heightDisplay) vitals.push({ icon: Ruler, value: heightDisplay });
            return vitals.length > 0 && (
              <div className="bg-[#F8F7F5] rounded-2xl overflow-hidden">
                <div className="flex items-center">
                  {vitals.map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <div key={i} className={`flex items-center gap-2 px-4 py-3.5 flex-shrink-0 ${i < vitals.length - 1 ? "border-r border-gray-200" : ""}`}>
                        <Icon className="w-[18px] h-[18px] text-gray-600" strokeWidth={1.8} />
                        <span className="text-[14px] text-black">{item.value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {(() => {
            const details: { icon: typeof Cake; value: string }[] = [];
            if (profile.major) details.push({ icon: GraduationCap, value: profile.major });
            if (profile.residence_hall) details.push({ icon: Building, value: profile.residence_hall });
            if (profile.hometown) details.push({ icon: Home, value: profile.hometown });
            if (profile.graduation_year) details.push({ icon: GraduationCap, value: `Class of ${profile.graduation_year}` });
            return details.length > 0 && (
              <div className="bg-[#F8F7F5] rounded-2xl overflow-hidden">
                {details.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className={`flex items-center gap-3.5 px-5 py-4 ${i < details.length - 1 ? "border-b border-gray-200" : ""}`}>
                      <Icon className="w-[20px] h-[20px] text-gray-700" strokeWidth={1.8} />
                      <span className="text-[15px] text-black">{item.value}</span>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* Photos — rounded with padding */}
        {profile.photos.map((photo, idx) => (
          <div key={photo.id} className="relative px-3 pt-3">
            {idx === 0 && (
              <div className="absolute bottom-0 left-3 right-3 px-5 pb-5 pt-16 bg-gradient-to-t from-black/50 to-transparent rounded-b-2xl z-10">
                <div className="flex items-baseline gap-2">
                  <span className="text-white text-[26px] font-medium">{profile.first_name}</span>
                  <span className="text-white/80 text-[24px]">{profile.age}</span>
                </div>
                {profile.major && <p className="text-white/70 text-[14px] mt-0.5">{profile.major}</p>}
              </div>
            )}
            <img src={photo.url} alt="" className="w-full aspect-[4/5] object-cover rounded-2xl" draggable={false} />
          </div>
        ))}

        {/* Prompts — rounded cards */}
        {profile.prompts.map((prompt) => (
          <div key={prompt.id} className="bg-cream mx-3 mt-3 px-5 py-5 rounded-2xl">
            <p className="text-[12px] font-medium text-gray-500 uppercase tracking-[0.1em] mb-1.5">
              {prompt.question}
            </p>
            <p className="text-[18px] font-medium text-black leading-[1.4]">
              {prompt.answer}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
