"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import ProfileCard from "@/components/ProfileCard";
import type { ProfileWithContent } from "@/types";
import { SlidersHorizontal, RotateCcw, MoreHorizontal } from "lucide-react";

export default function DiscoverPage() {
  const supabase = createClient();
  const [profiles, setProfiles] = useState<ProfileWithContent[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [myProfileId, setMyProfileId] = useState<string | null>(null);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: myProfile } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
    if (!myProfile) return;
    setMyProfileId(myProfile.id);

    const { data: interactions } = await supabase.from("likes").select("to_profile_id").eq("from_profile_id", myProfile.id);
    const { data: skips } = await supabase.from("skips").select("to_profile_id").eq("from_profile_id", myProfile.id);
    const excludeIds = new Set([
      myProfile.id,
      ...(interactions?.map((i) => i.to_profile_id) || []),
      ...(skips?.map((s) => s.to_profile_id) || []),
    ]);

    let genderFilter: string[] = [];
    if (myProfile.gender_preference === "Women") genderFilter = ["Woman"];
    else if (myProfile.gender_preference === "Men") genderFilter = ["Man"];
    else genderFilter = ["Man", "Woman", "Non-binary"];

    const { data: candidateProfiles } = await supabase.from("profiles").select("*").in("gender", genderFilter).neq("id", myProfile.id).limit(50);
    if (!candidateProfiles) { setLoading(false); return; }

    const filtered = candidateProfiles.filter((p) => !excludeIds.has(p.id));
    const fullProfiles: ProfileWithContent[] = await Promise.all(
      filtered.map(async (p) => {
        const [{ data: photos }, { data: prompts }] = await Promise.all([
          supabase.from("photos").select("*").eq("profile_id", p.id).order("position"),
          supabase.from("prompts").select("*").eq("profile_id", p.id).order("position"),
        ]);
        return { ...p, photos: photos || [], prompts: prompts || [] };
      })
    );
    setProfiles(fullProfiles.filter((p) => p.photos.length > 0));
    setCurrentIndex(0);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

  const handleLike = async (contentType: "photo" | "prompt", contentId: string, comment?: string) => {
    if (!myProfileId || !profiles[currentIndex]) return;
    await supabase.from("likes").insert({
      from_profile_id: myProfileId, to_profile_id: profiles[currentIndex].id,
      content_type: contentType, content_id: contentId, comment: comment || null,
    });
    const { data: mutualLike } = await supabase.from("likes").select("id")
      .eq("from_profile_id", profiles[currentIndex].id).eq("to_profile_id", myProfileId).limit(1);
    if (mutualLike && mutualLike.length > 0) {
      await supabase.from("matches").insert({ profile1_id: myProfileId, profile2_id: profiles[currentIndex].id });
    }
    setCurrentIndex((prev) => prev + 1);
  };

  const handleSkip = async () => {
    if (!myProfileId || !profiles[currentIndex]) return;
    await supabase.from("skips").insert({ from_profile_id: myProfileId, to_profile_id: profiles[currentIndex].id });
    setCurrentIndex((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-3">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  if (currentIndex >= profiles.length) {
    return (
      <div className="max-w-lg mx-auto px-6">
        <div className="flex items-center justify-between h-[52px]">
          <SlidersHorizontal className="w-5 h-5 text-gray-400" strokeWidth={2} />
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-center animate-slide-up">
          <RotateCcw className="w-10 h-10 text-gray-300 mb-4" strokeWidth={1.5} />
          <p className="text-[20px] font-medium mb-2">You&apos;ve seen everyone</p>
          <p className="text-gray-400 text-[14px] mb-6 max-w-[260px]">
            Check back later for new Stony Brook students joining SBUDate.
          </p>
          <button onClick={fetchProfiles} className="press h-[48px] bg-black text-white px-8 rounded-full text-[14px] font-medium uppercase tracking-[0.08em]">
            Refresh
          </button>
        </div>
      </div>
    );
  }

  const current = profiles[currentIndex];

  return (
    <div className="max-w-lg mx-auto bg-white">
      {/* Header with filter pills */}
      <div className="px-4 pt-2 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button className="press flex-shrink-0 w-8 h-8 flex items-center justify-center">
            <SlidersHorizontal className="w-[18px] h-[18px] text-black" strokeWidth={2} />
          </button>
          {["Age", "Height", "Major"].map((filter) => (
            <button key={filter} className="press flex-shrink-0 px-3.5 h-[34px] rounded-full border border-gray-300 text-[13px] text-black flex items-center gap-1">
              {filter}
              <svg className="w-3 h-3 text-gray-500" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 5l3 3 3-3"/></svg>
            </button>
          ))}
        </div>
      </div>

      {/* Name / status row */}
      <div className="flex items-center justify-between px-4 pb-1">
        <div>
          <p className="text-[22px] font-medium">{current.first_name}</p>
          <p className="text-[12px] text-gray-400">Active today</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="press p-1"><RotateCcw className="w-[18px] h-[18px] text-gray-400" strokeWidth={2} /></button>
          <button className="press p-1"><MoreHorizontal className="w-[18px] h-[18px] text-gray-400" strokeWidth={2} /></button>
        </div>
      </div>

      <ProfileCard
        key={current.id}
        profile={current}
        onLike={handleLike}
        onSkip={handleSkip}
      />
    </div>
  );
}
