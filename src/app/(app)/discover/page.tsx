"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import ProfileCard from "@/components/ProfileCard";
import MatchCelebration from "@/components/MatchCelebration";
import type { ProfileWithContent } from "@/types";
import { RefreshCw } from "lucide-react";

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
    setCurrentIndex((prev) => prev + 1);
  };

  const handleSkip = async () => {
    if (!myProfileId || !profiles[currentIndex]) return;
    await supabase.from("skips").insert({ from_profile_id: myProfileId, to_profile_id: profiles[currentIndex].id });
    setCurrentIndex((prev) => prev + 1);
  };

  if (loading) return (
    <div className="max-w-lg mx-auto pt-6 px-3 animate-fade-in">
      <div className="rounded-[16px] overflow-hidden">
        <div className="w-full aspect-[4/5] skeleton" />
      </div>
      <div className="mt-2.5 rounded-[16px] skeleton" style={{ height: "120px" }} />
      <div className="mt-2.5 rounded-[16px] skeleton" style={{ height: "80px" }} />
    </div>
  );

  if (currentIndex >= profiles.length) return (
    <div className="max-w-lg mx-auto flex flex-col items-center justify-center h-[75vh] px-10 text-center">
      <div className="animate-slide-up">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-5">
          <RefreshCw className="w-7 h-7 text-gray-300" strokeWidth={1.5} />
        </div>
        <p className="text-[22px] font-semibold text-gray-900 mb-2 tracking-tight">You&apos;ve seen everyone</p>
        <p className="text-gray-400 text-[15px] mb-10 leading-relaxed">Check back later for new<br />Stony Brook students.</p>
        <button
          onClick={fetchProfiles}
          className="press h-[52px] bg-gray-900 text-white px-12 rounded-2xl text-[15px] font-medium tracking-[-0.2px] shadow-lg shadow-black/10"
        >
          Refresh
        </button>
      </div>
    </div>
  );

  const current = profiles[currentIndex];

  return (
    <div ref={topRef} className="max-w-lg mx-auto pb-4">
      {/* Header — minimal like Hinge */}
      <div className="px-5 pt-2 pb-0.5 flex items-center justify-between">
        <h1 className="text-[18px] font-semibold text-gray-900 tracking-tight">Discover</h1>
      </div>
      <ProfileCard key={current.id} profile={current} onLike={handleLike} onSkip={handleSkip} />

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
