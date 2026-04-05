"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Settings, LogOut, ChevronRight, Pencil, Wine, Cigarette, Cake, User, Ruler, GraduationCap, Home, Building, Globe, BadgeCheck, Sparkles } from "lucide-react";
import type { ProfileWithContent } from "@/types";

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

  const detailRows = [
    { label: "Major", value: profile.major, field: "major" },
    { label: "Graduation Year", value: profile.graduation_year ? `Class of ${profile.graduation_year}` : null, field: "graduation_year" },
    { label: "Height", value: heightDisplay, field: "height" },
    { label: "Residence Hall", value: profile.residence_hall, field: "residence_hall" },
    { label: "Hometown", value: profile.hometown, field: "hometown" },
    { label: "Gender", value: profile.gender, field: "gender" },
    { label: "Drinking", value: profile.drinking, field: "drinking" },
    { label: "Smoking", value: profile.smoking, field: "smoking" },
  ];

  return (
    <div className="max-w-lg mx-auto min-h-screen animate-tab-in">
      {/* Header */}
      <div className="flex items-center justify-between px-5 h-[52px]">
        <span className="text-[18px] text-gray-900 font-semibold tracking-tight">SBUdate</span>
        <div className="flex items-center gap-1">
          <button onClick={handleLogout} className="press p-2.5 rounded-full hover:bg-gray-100 transition-colors">
            <LogOut className="w-[18px] h-[18px] text-gray-400" strokeWidth={1.8} />
          </button>
          <button onClick={() => router.push("/settings")} className="press p-2.5 rounded-full hover:bg-gray-100 transition-colors">
            <Settings className="w-[18px] h-[18px] text-gray-400" strokeWidth={1.8} />
          </button>
        </div>
      </div>

      {/* Avatar + name */}
      <div className="flex flex-col items-center pt-2 pb-5">
        <div className="relative mb-3">
          <div className="w-[92px] h-[92px] rounded-full overflow-hidden ring-[2.5px] ring-foreground ring-offset-[3px]">
            {profile.photos[0] ? (
              <img src={profile.photos[0].url} alt="" className="w-full h-full object-cover" />
            ) : <div className="w-full h-full bg-gray-200" />}
          </div>
          <button
            onClick={() => router.push("/edit-profile")}
            className="absolute -bottom-1 -right-1 w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center shadow-md press"
          >
            <Pencil className="w-3.5 h-3.5 text-white" strokeWidth={2} />
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          <p className="text-[20px] font-semibold text-gray-900 tracking-tight">{profile.first_name}</p>
          {profile.is_premium && <BadgeCheck className="w-5 h-5 text-gray-900" strokeWidth={2} fill="currentColor" />}
        </div>
      </div>

      {/* Premium upsell */}
      {!profile.is_premium && (
        <button
          onClick={() => router.push("/premium")}
          className="mx-5 mb-4 px-5 py-3.5 bg-gray-900 rounded-2xl flex items-center gap-3 press text-left"
        >
          <div className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-white" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-white">Get Premium</p>
            <p className="text-[12px] text-gray-400 mt-0.5">Get a verified badge on your profile</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" strokeWidth={2} />
        </button>
      )}

      {/* Profile completeness prompt */}
      {(() => {
        const missing: string[] = [];
        if (!profile.height_inches) missing.push("height");
        if (!profile.hometown) missing.push("hometown");
        if (profile.photos.length < 4) missing.push("more photos");
        if (profile.prompts.length < 3) missing.push("more prompts");
        return missing.length > 0 ? (
          <button
            onClick={() => router.push("/edit-profile")}
            className="mx-5 mb-4 px-5 py-3.5 bg-gray-50 rounded-2xl flex items-center gap-3 press text-left"
          >
            <div className="w-9 h-9 bg-foreground/10 rounded-full flex items-center justify-center flex-shrink-0">
              <Pencil className="w-4 h-4 text-foreground" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-gray-900">Complete your profile</p>
              <p className="text-[12px] text-gray-400 mt-0.5 truncate">
                Add {missing.slice(0, 2).join(", ")}{missing.length > 2 ? `, +${missing.length - 2} more` : ""}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" strokeWidth={2} />
          </button>
        ) : null;
      })()}

      {/* Tabs */}
      <div className="flex mx-5 rounded-xl bg-gray-100 p-[3px] mb-5">
        {(["edit", "view"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-center text-[14px] rounded-[10px] transition-all duration-200 ${
              tab === t ? "bg-surface text-gray-900 font-semibold shadow-sm" : "text-gray-400 font-medium"
            }`}>
            {t === "edit" ? "Edit" : "Preview"}
          </button>
        ))}
      </div>

      {tab === "edit" ? (
        <div className="pb-24 animate-fade-in">
          {/* Photos */}
          <div className="px-5 pb-5">
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 6 }, (_, i) => {
                const photo = profile.photos[i];
                return photo ? (
                  <div key={photo.id} className="aspect-square rounded-xl overflow-hidden">
                    <img src={photo.url} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <button key={`empty-${i}`} onClick={() => router.push("/edit-profile")}
                    className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-[24px] press hover:border-gray-400 transition-colors">
                    +
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prompts */}
          {profile.prompts.length > 0 && (
            <div className="mx-5 mb-5">
              <p className="text-[12px] text-gray-400 uppercase tracking-[0.08em] font-medium mb-2.5">Prompts</p>
              <div className="bg-surface rounded-2xl overflow-hidden border border-border">
                {profile.prompts.map((prompt, i) => (
                  <button key={prompt.id} onClick={() => router.push(`/edit-prompt?index=${i}`)}
                    className={`w-full px-5 py-4 flex items-center justify-between press text-left hover:bg-gray-50 transition-colors ${
                      i < profile.prompts.length - 1 ? "border-b border-border" : ""
                    }`}>
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="text-[12px] text-gray-400 font-medium">{prompt.question}</p>
                      <p className="text-[15px] text-gray-900 mt-0.5 truncate font-medium">{prompt.answer}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" strokeWidth={2} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Details — each row opens its own edit page */}
          <div className="mx-5">
            <p className="text-[12px] text-gray-400 uppercase tracking-[0.08em] font-medium mb-2.5">Details</p>
            <div className="bg-surface rounded-2xl overflow-hidden border border-border">
              {detailRows.map((row, i) => (
                <button key={row.field} onClick={() => router.push(`/edit-field?field=${row.field}`)}
                  className={`w-full px-5 py-4 flex items-center justify-between press text-left hover:bg-gray-50 transition-colors ${
                    i < detailRows.length - 1 ? "border-b border-border" : ""
                  }`}>
                  <div>
                    <p className="text-[15px] text-gray-900 font-medium">{row.label}</p>
                    <p className={`text-[13px] mt-0.5 ${row.value ? "text-gray-500" : "text-gray-300"}`}>{row.value || "Not set"}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" strokeWidth={2} />
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="pb-24 animate-fade-in">
          {/* View — as others see you */}
          <div className="mx-3 space-y-2.5">
            {(() => {
              const vitals: { icon: typeof Cake; value: string }[] = [];
              if (profile.age) vitals.push({ icon: Cake, value: String(profile.age) });
              if (profile.gender) vitals.push({ icon: User, value: profile.gender });
              if (heightDisplay) vitals.push({ icon: Ruler, value: heightDisplay });
              return vitals.length > 0 ? (
                <div className="flex flex-wrap gap-2 px-1">
                  {vitals.map((item, i) => { const Icon = item.icon; return (
                    <span key={i} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-50 rounded-full text-[13px] text-gray-700">
                      <Icon className="w-[14px] h-[14px] text-gray-400" strokeWidth={1.6} />
                      {item.value}
                    </span>
                  ); })}
                </div>
              ) : null;
            })()}
            {(() => {
              const details: { icon: typeof Cake; value: string }[] = [];
              if (profile.major) details.push({ icon: GraduationCap, value: profile.major });
              if (profile.residence_hall) details.push({ icon: Building, value: profile.residence_hall });
              if (profile.hometown) details.push({ icon: Home, value: profile.hometown });
              return details.length > 0 ? (
                <div className="bg-gray-50 rounded-2xl overflow-hidden">
                  {details.map((item, i) => { const Icon = item.icon; return (
                    <div key={i} className={`flex items-center gap-3 px-5 py-3.5 ${i < details.length - 1 ? "border-b border-gray-100" : ""}`}>
                      <Icon className="w-[18px] h-[18px] text-gray-400" strokeWidth={1.6} />
                      <span className="text-[15px] text-gray-900">{item.value}</span>
                    </div>
                  ); })}
                </div>
              ) : null;
            })()}
          </div>

          {(profile.drinking || profile.smoking) && (
            <div className="mx-3 mt-2.5 bg-gray-50 rounded-2xl overflow-hidden">
              {[
                { icon: Wine, value: profile.drinking ? (profile.drinking === "Yes" ? "Drinks" : profile.drinking === "Sometimes" ? "Drinks sometimes" : "Doesn't drink") : null },
                { icon: Cigarette, value: profile.smoking ? (profile.smoking === "Yes" ? "Smokes" : profile.smoking === "Sometimes" ? "Smokes sometimes" : "Doesn't smoke") : null },
              ].filter((item) => item.value).map((item, i, arr) => {
                const Icon = item.icon;
                return (
                  <div key={i} className={`flex items-center gap-3 px-5 py-3.5 ${i < arr.length - 1 ? "border-b border-gray-100" : ""}`}>
                    <Icon className="w-[18px] h-[18px] text-gray-400" strokeWidth={1.6} />
                    <span className="text-[15px] text-gray-900">{item.value}</span>
                  </div>
                );
              })}
            </div>
          )}

          {(() => {
            const items: Array<{ type: "photo" | "prompt"; data: (typeof profile.photos)[0] | (typeof profile.prompts)[0] }> = [];
            const maxLen = Math.max(profile.photos.length, profile.prompts.length);
            for (let i = 0; i < maxLen; i++) {
              if (profile.photos[i]) items.push({ type: "photo", data: profile.photos[i] });
              if (profile.prompts[i]) items.push({ type: "prompt", data: profile.prompts[i] });
            }
            return items.map((item) => {
              if (item.type === "photo") {
                const photo = item.data as (typeof profile.photos)[0];
                return (
                  <div key={photo.id} className="relative mx-3 mt-2.5">
                    <img src={photo.url} alt="" className="w-full aspect-square object-cover rounded-2xl" draggable={false} />
                  </div>
                );
              } else {
                const prompt = item.data as (typeof profile.prompts)[0];
                return (
                  <div key={prompt.id} className="bg-surface mx-3 mt-2.5 px-5 py-5 rounded-2xl border border-border">
                    <p className="text-[12px] text-gray-500 uppercase tracking-[0.08em] font-medium mb-2">{prompt.question}</p>
                    <p className="text-[18px] text-gray-900 leading-[1.4] font-medium">{prompt.answer}</p>
                  </div>
                );
              }
            });
          })()}
        </div>
      )}
    </div>
  );
}
