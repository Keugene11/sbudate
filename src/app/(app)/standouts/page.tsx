"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Sparkles } from "lucide-react";
import type { ProfileWithContent } from "@/types";

export default function StandoutsPage() {
  const supabase = createClient();
  const [profiles, setProfiles] = useState<ProfileWithContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: myProfile } = await supabase.from("profiles").select("id, gender_preference").eq("user_id", user.id).single();
      if (!myProfile) return;

      let genderFilter: string[] = [];
      if (myProfile.gender_preference === "Women") genderFilter = ["Woman"];
      else if (myProfile.gender_preference === "Men") genderFilter = ["Man"];
      else genderFilter = ["Man", "Woman", "Non-binary"];

      const { data: candidates } = await supabase.from("profiles").select("*").in("gender", genderFilter).neq("id", myProfile.id).limit(6);
      if (!candidates) { setLoading(false); return; }

      const full: ProfileWithContent[] = await Promise.all(
        candidates.map(async (p) => {
          const [{ data: photos }, { data: prompts }] = await Promise.all([
            supabase.from("photos").select("*").eq("profile_id", p.id).order("position"),
            supabase.from("prompts").select("*").eq("profile_id", p.id).order("position"),
          ]);
          return { ...p, photos: photos || [], prompts: prompts || [] };
        })
      );
      setProfiles(full.filter((p) => p.photos.length > 0));
      setLoading(false);
    };
    fetch();
  }, [supabase]);

  return (
    <div className="max-w-lg mx-auto bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-amber-400" strokeWidth={2} fill="currentColor" />
          <h1 className="text-[26px] font-semibold text-white tracking-tight">Standouts</h1>
        </div>
        <button className="press px-4 py-2 bg-white/10 rounded-full flex items-center gap-2 backdrop-blur-sm">
          <span className="text-[14px]">🌹</span>
          <span className="text-[13px] text-white font-medium">1 Rose</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-gray-600 border-t-white rounded-full animate-spin" />
        </div>
      ) : profiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
          <Sparkles className="w-10 h-10 text-gray-600 mb-4" strokeWidth={1.5} />
          <p className="text-gray-400 text-[16px] font-medium">No standouts yet</p>
          <p className="text-gray-600 text-[14px] mt-1">Check back later for featured profiles</p>
        </div>
      ) : (
        <div className="px-4 pb-24">
          <p className="text-gray-500 text-[13px] mb-3 px-1">Send a rose to stand out</p>
          <div className="flex gap-3 overflow-x-auto pb-4 snap-x">
            {profiles.map((p) => (
              <div key={p.id} className="flex-shrink-0 w-[280px] snap-start">
                <div className="relative rounded-2xl overflow-hidden bg-black">
                  <img src={p.photos[0].url} alt="" className="w-full aspect-[3/4] object-cover" draggable={false} />
                  {/* Gradient */}
                  <div className="absolute inset-0 photo-gradient" />
                  {/* Name overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    {p.prompts[0] && (
                      <div className="bg-white/95 glass rounded-xl px-4 py-3 mb-3">
                        <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wide">{p.prompts[0].question}</p>
                        <p className="text-[14px] font-medium text-gray-900 mt-0.5 line-clamp-2">{p.prompts[0].answer}</p>
                      </div>
                    )}
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-white text-[22px] font-semibold tracking-tight">{p.first_name}</p>
                        {p.major && <p className="text-white/60 text-[13px]">{p.major}</p>}
                      </div>
                      <button className="w-10 h-10 rounded-full bg-white/15 glass flex items-center justify-center press">
                        <span className="text-[16px]">🌹</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
