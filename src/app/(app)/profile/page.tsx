"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Settings, ChevronRight, LogOut } from "lucide-react";
import type { ProfileWithContent } from "@/types";
import { Cake, User, Ruler, MapPin, GraduationCap, Home, Building } from "lucide-react";

export default function ProfilePage() {
  const supabase = createClient();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileWithContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"edit" | "view">("edit");

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
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-[52px]">
        <span className="text-[18px] font-medium lowercase">sbudate</span>
        <div className="flex items-center gap-1">
          <button onClick={handleLogout} className="press p-2">
            <LogOut className="w-[18px] h-[18px] text-gray-400" strokeWidth={2} />
          </button>
          <button className="press p-2">
            <Settings className="w-[18px] h-[18px] text-gray-400" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Profile photo + name centered */}
      <div className="flex flex-col items-center pt-2 pb-4">
        <div className="w-[90px] h-[90px] rounded-full overflow-hidden ring-2 ring-[#67295F] ring-offset-2 mb-3">
          {profile.photos[0] ? (
            <img src={profile.photos[0].url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center"><span className="text-[32px]">👤</span></div>
          )}
        </div>
        <p className="text-[20px] font-medium">{profile.first_name}</p>
      </div>

      {/* Edit / View tabs */}
      <div className="flex">
        <button
          onClick={() => setTab("edit")}
          className={`flex-1 pb-3 text-center text-[15px] transition-colors ${
            tab === "edit" ? "text-black font-medium border-b-[2.5px] border-black" : "text-gray-400 border-b border-gray-200"
          }`}
        >
          Edit
        </button>
        <button
          onClick={() => setTab("view")}
          className={`flex-1 pb-3 text-center text-[15px] transition-colors ${
            tab === "view" ? "text-black font-medium border-b-[2.5px] border-black" : "text-gray-400 border-b border-gray-200"
          }`}
        >
          View
        </button>
      </div>

      {tab === "edit" ? (
        <div className="pb-24">
          {/* Photos grid */}
          <div className="px-4 py-4">
            <div className="grid grid-cols-3 gap-2">
              {profile.photos.map((photo) => (
                <div key={photo.id} className="aspect-[3/4] rounded-xl overflow-hidden">
                  <img src={photo.url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
              {profile.photos.length < 6 && (
                <button onClick={() => router.push("/profile/edit")}
                  className="aspect-[3/4] rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-[24px] press hover:border-gray-400 transition-colors">
                  +
                </button>
              )}
            </div>
          </div>

          {/* Prompts */}
          {profile.prompts.map((prompt) => (
            <div key={prompt.id} onClick={() => router.push("/profile/edit")} className="px-5 py-4 border-t border-gray-100 press cursor-pointer">
              <p className="text-[15px] text-black font-medium">{prompt.question}</p>
              <p className="text-[14px] text-gray-400 mt-0.5">{prompt.answer}</p>
            </div>
          ))}

          {/* My Vitals */}
          <div className="mt-2">
            <div className="px-5 pb-2 pt-4 border-t border-gray-100">
              <p className="text-[13px] text-gray-400">My Vitals</p>
            </div>
            <Row label="Major" value={profile.major} />
            <Row label="Graduation Year" value={profile.graduation_year ? `Class of ${profile.graduation_year}` : null} />
            <Row label="Height" value={heightDisplay} />
            <Row label="Residence Hall" value={profile.residence_hall} />
            <Row label="Hometown" value={profile.hometown} />
            <Row label="Gender" value={profile.gender} />
          </div>

          {/* Edit all button */}
          <div className="px-5 pt-6">
            <button onClick={() => router.push("/profile/edit")}
              className="press w-full h-[48px] border border-gray-300 rounded-full text-[14px] font-medium text-black">
              Edit full profile
            </button>
          </div>
        </div>
      ) : (
        /* View tab */
        <div className="pb-24">
          <div className="px-4 pt-4 space-y-3">
            {(() => {
              const vitals: { icon: typeof Cake; value: string }[] = [];
              if (profile.age) vitals.push({ icon: Cake, value: String(profile.age) });
              if (profile.gender) vitals.push({ icon: User, value: profile.gender });
              if (heightDisplay) vitals.push({ icon: Ruler, value: heightDisplay });
              return vitals.length > 0 ? (
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
              ) : null;
            })()}
            {(() => {
              const details: { icon: typeof Cake; value: string }[] = [];
              if (profile.major) details.push({ icon: GraduationCap, value: profile.major });
              if (profile.residence_hall) details.push({ icon: Building, value: profile.residence_hall });
              if (profile.hometown) details.push({ icon: Home, value: profile.hometown });
              if (profile.graduation_year) details.push({ icon: GraduationCap, value: `Class of ${profile.graduation_year}` });
              return details.length > 0 ? (
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
              ) : null;
            })()}
          </div>

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

          {profile.prompts.map((prompt) => (
            <div key={prompt.id} className="bg-cream mx-3 mt-3 px-5 py-5 rounded-2xl">
              <p className="text-[12px] font-medium text-gray-500 uppercase tracking-[0.1em] mb-1.5">{prompt.question}</p>
              <p className="text-[18px] font-medium text-black leading-[1.4]">{prompt.answer}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
      <div>
        <p className="text-[15px] text-black font-medium">{label}</p>
        <p className={`text-[14px] mt-0.5 ${value ? "text-gray-500" : "text-gray-300"}`}>
          {value || "Not answered yet"}
        </p>
      </div>
    </div>
  );
}
