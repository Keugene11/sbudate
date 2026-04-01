"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import ProfileCard from "@/components/ProfileCard";
import type { ProfileWithContent } from "@/types";
import { Loader2 } from "lucide-react";

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

    // Get my profile
    const { data: myProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!myProfile) return;
    setMyProfileId(myProfile.id);

    // Get profiles I've already interacted with
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

    // Build gender filter
    let genderFilter: string[] = [];
    if (myProfile.gender_preference === "Women") genderFilter = ["Woman"];
    else if (myProfile.gender_preference === "Men") genderFilter = ["Man"];
    else genderFilter = ["Man", "Woman", "Non-binary"];

    // Fetch candidate profiles
    const { data: candidateProfiles } = await supabase
      .from("profiles")
      .select("*")
      .in("gender", genderFilter)
      .neq("id", myProfile.id)
      .limit(50);

    if (!candidateProfiles) {
      setLoading(false);
      return;
    }

    const filtered = candidateProfiles.filter((p) => !excludeIds.has(p.id));

    // Fetch photos and prompts for each profile
    const fullProfiles: ProfileWithContent[] = await Promise.all(
      filtered.map(async (p) => {
        const [{ data: photos }, { data: prompts }] = await Promise.all([
          supabase.from("photos").select("*").eq("profile_id", p.id).order("position"),
          supabase.from("prompts").select("*").eq("profile_id", p.id).order("position"),
        ]);
        return { ...p, photos: photos || [], prompts: prompts || [] };
      })
    );

    // Only show profiles with at least 1 photo
    setProfiles(fullProfiles.filter((p) => p.photos.length > 0));
    setCurrentIndex(0);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const handleLike = async (contentType: "photo" | "prompt", contentId: string, comment?: string) => {
    if (!myProfileId || !profiles[currentIndex]) return;

    await supabase.from("likes").insert({
      from_profile_id: myProfileId,
      to_profile_id: profiles[currentIndex].id,
      content_type: contentType,
      content_id: contentId,
      comment: comment || null,
    });

    // Check for mutual like (match)
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
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 animate-fade-in">
        <Loader2 className="w-8 h-8 text-dove animate-spin" />
        <p className="text-dove text-[13px] animate-fade-in" style={{ animationDelay: "400ms" }}>Finding people near you...</p>
      </div>
    );
  }

  if (currentIndex >= profiles.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <div className="animate-slide-up">
          <h2 className="font-serif text-[28px] font-semibold tracking-tight mb-3">
            You&apos;ve seen everyone
          </h2>
          <p className="text-dove text-[15px] leading-relaxed max-w-xs">
            Check back later for new Stony Brook students joining SBUDate.
          </p>
          <button
            onClick={fetchProfiles}
            className="press mt-6 bg-hinge-black text-white px-8 py-3.5 rounded-2xl font-semibold text-[14px]"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-hinge-white/90 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-center py-3">
          <h1 className="font-serif text-[20px] font-semibold text-hinge-black">
            Discover
          </h1>
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
