"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import ProfileCard from "@/components/ProfileCard";
import type { ProfileWithContent } from "@/types";

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
    const excludeIds = new Set([myProfile.id, ...(interactions?.map((i) => i.to_profile_id) || []), ...(skips?.map((s) => s.to_profile_id) || [])]);
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
    await supabase.from("likes").insert({ from_profile_id: myProfileId, to_profile_id: profiles[currentIndex].id, content_type: contentType, content_id: contentId, comment: comment || null });
    const { data: mutualLike } = await supabase.from("likes").select("id").eq("from_profile_id", profiles[currentIndex].id).eq("to_profile_id", myProfileId).limit(1);
    if (mutualLike && mutualLike.length > 0) await supabase.from("matches").insert({ profile1_id: myProfileId, profile2_id: profiles[currentIndex].id });
    setCurrentIndex((prev) => prev + 1);
  };

  const handleSkip = async () => {
    if (!myProfileId || !profiles[currentIndex]) return;
    await supabase.from("skips").insert({ from_profile_id: myProfileId, to_profile_id: profiles[currentIndex].id });
    setCurrentIndex((prev) => prev + 1);
  };

  if (loading) return (
    <div className="max-w-lg mx-auto pt-14 px-4">
      <div className="rounded-[12px] overflow-hidden"><div className="w-full aspect-square skeleton" /></div>
      <div className="mt-2 rounded-[12px] h-[100px] skeleton" />
    </div>
  );

  if (currentIndex >= profiles.length) return (
    <div className="max-w-lg mx-auto flex flex-col items-center justify-center h-[70vh] px-8 text-center">
      <div className="animate-slide-up">
        <p className="text-[20px] font-medium text-gray-900 mb-2">You&apos;ve seen everyone</p>
        <p className="text-gray-400 text-[14px] mb-8">Check back later for new Stony Brook students.</p>
        <button onClick={fetchProfiles} className="press h-[52px] bg-gray-900 text-white px-10 rounded-full text-[15px] font-medium tracking-[-0.2px]">Refresh</button>
      </div>
    </div>
  );

  const current = profiles[currentIndex];

  return (
    <div className="max-w-lg mx-auto">
      <div className="px-5 pt-3 pb-1">
        <p className="text-[24px] font-medium text-gray-900 tracking-tight">{current.first_name}</p>
        <p className="text-[13px] text-gray-400 mt-0.5">Active today</p>
      </div>
      <ProfileCard key={current.id} profile={current} onLike={handleLike} onSkip={handleSkip} />
    </div>
  );
}
