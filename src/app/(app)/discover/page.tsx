"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import ProfileCard from "@/components/ProfileCard";
import type { ProfileWithContent } from "@/types";
import { SlidersHorizontal } from "lucide-react";

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

    const { data: myProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!myProfile) return;
    setMyProfileId(myProfile.id);

    const { data: interactions } = await supabase
      .from("likes")
      .select("to_profile_id")
      .eq("from_profile_id", myProfile.id);

    const { data: skips } = await supabase
      .from("skips")
      .select("to_profile_id")
      .eq("from_profile_id", myProfile.id);

    const excludeIds = new Set([
      myProfile.id,
      ...(interactions?.map((i) => i.to_profile_id) || []),
      ...(skips?.map((s) => s.to_profile_id) || []),
    ]);

    let genderFilter: string[] = [];
    if (myProfile.gender_preference === "Women") genderFilter = ["Woman"];
    else if (myProfile.gender_preference === "Men") genderFilter = ["Man"];
    else genderFilter = ["Man", "Woman", "Non-binary"];

    const { data: candidateProfiles } = await supabase
      .from("profiles")
      .select("*")
      .in("gender", genderFilter)
      .neq("id", myProfile.id)
      .limit(50);

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
      from_profile_id: myProfileId,
      to_profile_id: profiles[currentIndex].id,
      content_type: contentType,
      content_id: contentId,
      comment: comment || null,
    });
    const { data: mutualLike } = await supabase
      .from("likes")
      .select("id")
      .eq("from_profile_id", profiles[currentIndex].id)
      .eq("to_profile_id", myProfileId)
      .limit(1);
    if (mutualLike && mutualLike.length > 0) {
      await supabase.from("matches").insert({
        profile1_id: myProfileId,
        profile2_id: profiles[currentIndex].id,
      });
    }
    setCurrentIndex((prev) => prev + 1);
  };

  const handleSkip = async () => {
    if (!myProfileId || !profiles[currentIndex]) return;
    await supabase.from("skips").insert({
      from_profile_id: myProfileId,
      to_profile_id: profiles[currentIndex].id,
    });
    setCurrentIndex((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-3">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  if (currentIndex >= profiles.length) {
    return (
      <div className="flex flex-col items-center justify-center h-screen px-8 text-center">
        <div className="animate-slide-up">
          <p className="text-[22px] font-bold mb-2">You&apos;ve seen everyone</p>
          <p className="text-gray-500 text-[15px] mb-6">
            Check back later for new students on SBUDate.
          </p>
          <button onClick={fetchProfiles} className="press h-[48px] bg-black text-white px-8 rounded-full font-semibold text-[15px]">
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto bg-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 h-[52px]">
          <h1 className="text-[20px] font-extrabold tracking-tight lowercase">sbudate</h1>
          <button className="press w-9 h-9 flex items-center justify-center">
            <SlidersHorizontal className="w-[20px] h-[20px] text-gray-600" strokeWidth={2} />
          </button>
        </div>
      </div>

      <ProfileCard
        key={profiles[currentIndex].id}
        profile={profiles[currentIndex]}
        onLike={handleLike}
        onSkip={handleSkip}
      />
    </div>
  );
}
