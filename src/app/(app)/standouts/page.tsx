"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Info } from "lucide-react";
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
    <div className="max-w-lg mx-auto bg-[#1A1A1A] min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-[28px] font-medium text-white">Standouts</h1>
          <Info className="w-4 h-4 text-gray-500" strokeWidth={2} />
        </div>
        <button className="press px-4 py-2 bg-[#C7C7E5] rounded-full flex items-center gap-2">
          <span className="text-[13px] text-black font-medium">Roses (1)</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-gray-600 border-t-white rounded-full animate-spin" />
        </div>
      ) : profiles.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-500 text-[15px]">No standouts yet</p>
        </div>
      ) : (
        <div className="px-4 pb-24">
          <div className="flex gap-3 overflow-x-auto pb-4 snap-x">
            {profiles.map((p) => (
              <div key={p.id} className="flex-shrink-0 w-[280px] snap-start">
                <div className="relative rounded-2xl overflow-hidden bg-black">
                  <img src={p.photos[0].url} alt="" className="w-full aspect-[3/4] object-cover" draggable={false} />
                  {/* Name overlay */}
                  <div className="absolute top-4 left-4">
                    <p className="text-white text-[22px] font-medium">{p.first_name}</p>
                  </div>
                  {/* Prompt overlay at bottom */}
                  {p.prompts[0] && (
                    <div className="absolute bottom-0 left-0 right-0 mx-3 mb-3">
                      <div className="bg-white rounded-xl px-4 py-3">
                        <p className="text-[11px] text-gray-500">{p.prompts[0].question}</p>
                        <p className="text-[15px] font-medium text-black mt-0.5">{p.prompts[0].answer}</p>
                        <div className="flex justify-end mt-2">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                            <span className="text-[14px]">🌹</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
