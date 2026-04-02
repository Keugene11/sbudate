"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import ProfileCard from "@/components/ProfileCard";
import MatchCelebration from "@/components/MatchCelebration";
import type { ProfileWithContent } from "@/types";

export default function DiscoverPage() {
  const supabase = createClient();
  const router = useRouter();
  const [profiles, setProfiles] = useState<ProfileWithContent[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [myProfileId, setMyProfileId] = useState<string | null>(null);
  const [matchInfo, setMatchInfo] = useState<{ name: string; photoUrl: string | null; matchId: string } | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

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
    const { data: candidateProfiles } = await supabase.from("profiles").select("*").in("gender", genderFilter).neq("id", myProfile.id).neq("is_paused", true).limit(50);
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

  // Scroll to top when profile changes
  useEffect(() => {
    if (currentIndex > 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentIndex]);

  const handleLike = async (contentType: "photo" | "prompt", contentId: string, comment?: string) => {
    if (!myProfileId || !profiles[currentIndex]) return;
    const likedProfile = profiles[currentIndex];
    await supabase.from("likes").insert({ from_profile_id: myProfileId, to_profile_id: likedProfile.id, content_type: contentType, content_id: contentId, comment: comment || null });
    const { data: mutualLike } = await supabase.from("likes").select("id").eq("from_profile_id", likedProfile.id).eq("to_profile_id", myProfileId).limit(1);
    if (mutualLike && mutualLike.length > 0) {
      const { data: match } = await supabase.from("matches").insert({ profile1_id: myProfileId, profile2_id: likedProfile.id }).select().single();
      if (match) {
        setMatchInfo({
          name: likedProfile.first_name,
          photoUrl: likedProfile.photos[0]?.url || null,
          matchId: match.id,
        });
      }
    }
    setCurrentIndex((prev) => prev + 1 >= profiles.length ? 0 : prev + 1);
  };

  const handleSkip = async () => {
    if (!myProfileId || !profiles[currentIndex]) return;
    await supabase.from("skips").insert({ from_profile_id: myProfileId, to_profile_id: profiles[currentIndex].id });
    setCurrentIndex((prev) => prev + 1 >= profiles.length ? 0 : prev + 1);
  };

  if (loading) return (
    <div className="max-w-lg mx-auto pt-6 px-3 animate-fade-in">
      <div className="rounded-[16px] overflow-hidden">
        <div className="w-full aspect-square skeleton" />
      </div>
      <div className="mt-2.5 rounded-[16px] skeleton" style={{ height: "120px" }} />
      <div className="mt-2.5 rounded-[16px] skeleton" style={{ height: "80px" }} />
    </div>
  );

  const current = profiles[currentIndex];

  return (
    <div ref={topRef} className="max-w-lg mx-auto pb-4">
      {/* Minimal spacer — Hinge shows almost no header */}
      <div className="h-2" />
      <ProfileCard key={current.id} profile={current} myProfileId={myProfileId || undefined} onLike={handleLike} onSkip={handleSkip} />

      {/* Match celebration */}
      {matchInfo && (
        <MatchCelebration
          name={matchInfo.name}
          photoUrl={matchInfo.photoUrl}
          onChat={() => {
            setMatchInfo(null);
            router.push(`/chat/${matchInfo.matchId}`);
          }}
          onKeepBrowsing={() => setMatchInfo(null)}
        />
      )}
    </div>
  );
}
