"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Settings, LogOut, ChevronRight } from "lucide-react";
import type { ProfileWithContent } from "@/types";
import { Cake, User, Ruler, GraduationCap, Home, Building } from "lucide-react";

export default function ProfilePage() {
  const supabase = createClient();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileWithContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"edit" | "view">("edit");

  useEffect(() => {
    (async () => {
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
    })();
  }, [supabase]);

  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/login"); };

  if (loading) return (
    <div className="max-w-lg mx-auto pt-8 flex flex-col items-center">
      <div className="w-[88px] h-[88px] rounded-full skeleton mb-3" />
      <div className="w-24 h-5 skeleton rounded-lg" />
    </div>
  );
  if (!profile) return null;

  const heightDisplay = profile.height_inches
    ? `${Math.floor(profile.height_inches / 12)}'${profile.height_inches % 12}"`
    : null;

  return (
    <div className="max-w-lg mx-auto min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-5 h-[52px]">
        <span className="text-[17px] font-medium text-gray-900">SBUdate</span>
        <div className="flex items-center gap-0.5">
          <button onClick={handleLogout} className="press p-2.5"><LogOut className="w-[18px] h-[18px] text-gray-400" strokeWidth={1.8} /></button>
          <button className="press p-2.5"><Settings className="w-[18px] h-[18px] text-gray-400" strokeWidth={1.8} /></button>
        </div>
      </div>

      {/* Avatar + name */}
      <div className="flex flex-col items-center pt-1 pb-5">
        <div className="w-[88px] h-[88px] rounded-full overflow-hidden ring-[2.5px] ring-rose ring-offset-2 mb-3">
          {profile.photos[0] ? (
            <img src={profile.photos[0].url} alt="" className="w-full h-full object-cover" />
          ) : <div className="w-full h-full bg-gray-200" />}
        </div>
        <p className="text-[18px] font-semibold text-gray-900">{profile.first_name}</p>
      </div>

      {/* Tabs */}
      <div className="flex mx-5 rounded-[10px] bg-gray-100 p-[3px] mb-4">
        {(["edit", "view"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 text-center text-[14px] rounded-[8px] transition-all duration-200 ${
              tab === t ? "bg-surface text-gray-900 font-medium shadow-sm" : "text-gray-400"
            }`}>
            {t === "edit" ? "Edit" : "View"}
          </button>
        ))}
      </div>

      {tab === "edit" ? (
        <div className="pb-24">
          {/* Photos */}
          <div className="px-5 pb-4">
            <div className="grid grid-cols-3 gap-2">
              {profile.photos.map((photo) => (
                <div key={photo.id} className="aspect-square rounded-[12px] overflow-hidden">
                  <img src={photo.url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
              {profile.photos.length < 6 && (
                <button onClick={() => router.push("/profile/edit")}
                  className="aspect-square rounded-[12px] border-[1.5px] border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-[22px] press">
                  +
                </button>
              )}
            </div>
          </div>

          {/* Prompts */}
          {profile.prompts.length > 0 && (
            <div className="mx-5 mb-4">
              <p className="text-[12px] text-gray-400 uppercase tracking-wider mb-2">Prompts</p>
              <div className="bg-surface rounded-[12px] overflow-hidden">
                {profile.prompts.map((prompt, i) => (
                  <button key={prompt.id} onClick={() => router.push("/profile/edit")}
                    className={`w-full px-4 py-3.5 flex items-center justify-between press text-left ${i < profile.prompts.length - 1 ? "border-b border-gray-100" : ""}`}>
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="text-[13px] text-gray-400">{prompt.question}</p>
                      <p className="text-[14px] text-gray-900 mt-0.5 truncate">{prompt.answer}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" strokeWidth={2} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Vitals */}
          <div className="mx-5">
            <p className="text-[12px] text-gray-400 uppercase tracking-wider mb-2">Vitals</p>
            <div className="bg-surface rounded-[12px] overflow-hidden">
              {[
                { label: "Major", value: profile.major },
                { label: "Graduation Year", value: profile.graduation_year ? `Class of ${profile.graduation_year}` : null },
                { label: "Height", value: heightDisplay },
                { label: "Residence Hall", value: profile.residence_hall },
                { label: "Hometown", value: profile.hometown },
                { label: "Gender", value: profile.gender },
              ].map((row, i, arr) => (
                <button key={row.label} onClick={() => router.push("/profile/edit")}
                  className={`w-full px-4 py-3.5 flex items-center justify-between press text-left ${i < arr.length - 1 ? "border-b border-gray-100" : ""}`}>
                  <div>
                    <p className="text-[14px] text-gray-900">{row.label}</p>
                    <p className={`text-[13px] mt-0.5 ${row.value ? "text-gray-500" : "text-gray-300"}`}>{row.value || "Not set"}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" strokeWidth={2} />
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="pb-24">
          {/* View — as others see you */}
          <div className="mx-4 space-y-2">
            {(() => {
              const vitals: { icon: typeof Cake; value: string }[] = [];
              if (profile.age) vitals.push({ icon: Cake, value: String(profile.age) });
              if (profile.gender) vitals.push({ icon: User, value: profile.gender });
              if (heightDisplay) vitals.push({ icon: Ruler, value: heightDisplay });
              return vitals.length > 0 ? (
                <div className="bg-surface rounded-[12px] overflow-hidden">
                  <div className="flex items-center">
                    {vitals.map((item, i) => { const Icon = item.icon; return (
                      <div key={i} className={`flex items-center gap-2 px-4 py-3 flex-shrink-0 ${i < vitals.length - 1 ? "border-r border-gray-200" : ""}`}>
                        <Icon className="w-4 h-4 text-gray-500" strokeWidth={1.6} />
                        <span className="text-[14px] text-gray-900">{item.value}</span>
                      </div>
                    ); })}
                  </div>
                </div>
              ) : null;
            })()}
            {(() => {
              const details: { icon: typeof Cake; value: string }[] = [];
              if (profile.major) details.push({ icon: GraduationCap, value: profile.major });
              if (profile.residence_hall) details.push({ icon: Building, value: profile.residence_hall });
              if (profile.hometown) details.push({ icon: Home, value: profile.hometown });
              return details.length > 0 ? (
                <div className="bg-surface rounded-[12px] overflow-hidden">
                  {details.map((item, i) => { const Icon = item.icon; return (
                    <div key={i} className={`flex items-center gap-3 px-5 py-3.5 ${i < details.length - 1 ? "border-b border-gray-200" : ""}`}>
                      <Icon className="w-[18px] h-[18px] text-gray-500" strokeWidth={1.6} />
                      <span className="text-[14px] text-gray-900">{item.value}</span>
                    </div>
                  ); })}
                </div>
              ) : null;
            })()}
          </div>

          {profile.photos.map((photo, idx) => (
            <div key={photo.id} className="relative mx-4 mt-3">
              {idx === 0 && (
                <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 pt-16 bg-gradient-to-t from-black/50 to-transparent rounded-b-[12px] z-10">
                  <p className="text-white text-[24px] font-semibold">{profile.first_name}, <span className="font-normal">{profile.age}</span></p>
                  {profile.major && <p className="text-white/70 text-[14px] mt-0.5">{profile.major}</p>}
                </div>
              )}
              <img src={photo.url} alt="" className="w-full aspect-square object-cover rounded-[12px]" draggable={false} />
            </div>
          ))}

          {profile.prompts.map((prompt) => (
            <div key={prompt.id} className="bg-surface mx-4 mt-2 px-5 py-4 rounded-[12px]">
              <p className="text-[12px] text-gray-500 tracking-wide mb-1.5">{prompt.question}</p>
              <p className="text-[17px] text-gray-900 leading-[1.45]">{prompt.answer}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
