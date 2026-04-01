"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Heart, MessageCircle, X, ChevronLeft, Cake, User, Ruler, GraduationCap, Building, Home } from "lucide-react";
import type { ProfileWithContent } from "@/types";

interface LikeWithProfile {
  id: string; comment: string | null; content_type: string;
  from_profile: { id: string; first_name: string; age: number; photos: { url: string }[]; };
}

export default function LikesPage() {
  const supabase = createClient();
  const [likes, setLikes] = useState<LikeWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [myProfileId, setMyProfileId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<ProfileWithContent | null>(null);
  const [viewingLike, setViewingLike] = useState<LikeWithProfile | null>(null);

  const fetchLikes = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: myProfile } = await supabase.from("profiles").select("id").eq("user_id", user.id).single();
    if (!myProfile) return;
    setMyProfileId(myProfile.id);

    const { data: matches } = await supabase.from("matches").select("profile1_id, profile2_id")
      .or(`profile1_id.eq.${myProfile.id},profile2_id.eq.${myProfile.id}`);
    const matchedIds = new Set(matches?.flatMap((m) => m.profile1_id === myProfile.id ? [m.profile2_id] : [m.profile1_id]) || []);

    const { data: incomingLikes } = await supabase.from("likes").select("id, comment, content_type, created_at, from_profile_id")
      .eq("to_profile_id", myProfile.id).order("created_at", { ascending: false });
    if (!incomingLikes) { setLoading(false); return; }

    const enriched: LikeWithProfile[] = [];
    for (const like of incomingLikes.filter((l) => !matchedIds.has(l.from_profile_id))) {
      const { data: profile } = await supabase.from("profiles").select("id, first_name, age").eq("id", like.from_profile_id).single();
      const { data: photos } = await supabase.from("photos").select("url").eq("profile_id", like.from_profile_id).order("position").limit(1);
      if (profile) enriched.push({ ...like, from_profile: { ...profile, photos: photos || [] } });
    }
    setLikes(enriched);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchLikes(); }, [fetchLikes]);

  const openProfile = async (like: LikeWithProfile) => {
    setViewingLike(like);
    const { data: p } = await supabase.from("profiles").select("*").eq("id", like.from_profile.id).single();
    if (!p) return;
    const [{ data: photos }, { data: prompts }] = await Promise.all([
      supabase.from("photos").select("*").eq("profile_id", like.from_profile.id).order("position"),
      supabase.from("prompts").select("*").eq("profile_id", like.from_profile.id).order("position"),
    ]);
    setViewing({ ...p, photos: photos || [], prompts: prompts || [] });
  };

  const handleMatch = async () => {
    if (!myProfileId || !viewing) return;
    await supabase.from("likes").insert({ from_profile_id: myProfileId, to_profile_id: viewing.id, content_type: "photo", content_id: "like-back" });
    await supabase.from("matches").insert({ profile1_id: myProfileId, profile2_id: viewing.id });
    setLikes((prev) => prev.filter((l) => l.from_profile.id !== viewing.id));
    setViewing(null);
    setViewingLike(null);
  };

  const handleDismiss = async () => {
    if (!viewing) return;
    // Remove the like by deleting it
    if (viewingLike) {
      await supabase.from("likes").delete().eq("id", viewingLike.id);
    }
    setLikes((prev) => prev.filter((l) => l.from_profile.id !== viewing.id));
    setViewing(null);
    setViewingLike(null);
  };

  // Full profile view
  if (viewing) {
    const ht = viewing.height_inches ? `${Math.floor(viewing.height_inches / 12)}'${viewing.height_inches % 12}"` : null;
    return (
      <div className="max-w-lg mx-auto bg-white min-h-screen pb-32">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm">
          <div className="flex items-center px-4 h-[52px]">
            <button onClick={() => { setViewing(null); setViewingLike(null); }} className="press p-1">
              <ChevronLeft className="w-6 h-6 text-gray-900" strokeWidth={2} />
            </button>
            <p className="ml-3 text-[16px] font-medium text-gray-900">{viewing.first_name}</p>
          </div>
        </div>

        {/* Comment they left */}
        {viewingLike?.comment && (
          <div className="mx-4 mb-2 bg-accent/10 rounded-[14px] px-4 py-3">
            <p className="text-[12px] text-accent mb-0.5">Their comment</p>
            <p className="text-[15px] text-gray-900">{viewingLike.comment}</p>
          </div>
        )}

        {/* Profile content */}
        {viewing.photos.map((photo, idx) => (
          <div key={photo.id} className="relative mx-4 mt-3">
            {idx === 0 && (
              <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 pt-16 bg-gradient-to-t from-black/50 to-transparent rounded-b-[16px] z-10">
                <p className="text-white text-[24px] font-semibold">{viewing.first_name}, <span className="font-normal">{viewing.age}</span></p>
                {viewing.major && <p className="text-white/70 text-[14px] mt-0.5">{viewing.major}</p>}
              </div>
            )}
            <img src={photo.url} alt="" className="w-full aspect-[4/5] object-cover rounded-[16px]" draggable={false} />
          </div>
        ))}

        {viewing.prompts.map((prompt) => (
          <div key={prompt.id} className="bg-cream mx-4 mt-3 px-5 py-5 rounded-[16px]">
            <p className="text-[12px] text-gray-500 tracking-wide mb-1.5">{prompt.question}</p>
            <p className="text-[17px] text-gray-900 leading-[1.45]">{prompt.answer}</p>
          </div>
        ))}

        {/* Vitals */}
        <div className="mx-4 mt-3 space-y-2">
          {(() => {
            const vitals: { icon: typeof Cake; value: string }[] = [];
            if (viewing.age) vitals.push({ icon: Cake, value: String(viewing.age) });
            if (viewing.gender) vitals.push({ icon: User, value: viewing.gender });
            if (ht) vitals.push({ icon: Ruler, value: ht });
            return vitals.length > 0 ? (
              <div className="bg-gray-50 rounded-[16px] overflow-hidden">
                <div className="flex items-center">
                  {vitals.map((item, i) => { const Icon = item.icon; return (
                    <div key={i} className={`flex items-center gap-2 px-4 py-3 flex-shrink-0 ${i < vitals.length - 1 ? "border-r border-gray-200" : ""}`}>
                      <Icon className="w-4 h-4 text-gray-500" strokeWidth={1.6} /><span className="text-[14px] text-gray-900">{item.value}</span>
                    </div>
                  ); })}
                </div>
              </div>
            ) : null;
          })()}
          {(() => {
            const details: { icon: typeof Cake; value: string }[] = [];
            if (viewing.major) details.push({ icon: GraduationCap, value: viewing.major });
            if (viewing.residence_hall) details.push({ icon: Building, value: viewing.residence_hall });
            if (viewing.hometown) details.push({ icon: Home, value: viewing.hometown });
            return details.length > 0 ? (
              <div className="bg-gray-50 rounded-[16px] overflow-hidden">
                {details.map((item, i) => { const Icon = item.icon; return (
                  <div key={i} className={`flex items-center gap-3 px-5 py-3.5 ${i < details.length - 1 ? "border-b border-gray-200" : ""}`}>
                    <Icon className="w-[18px] h-[18px] text-gray-500" strokeWidth={1.6} /><span className="text-[14px] text-gray-900">{item.value}</span>
                  </div>
                ); })}
              </div>
            ) : null;
          })()}
        </div>

        {/* Fixed bottom — Match or Dismiss */}
        <div className="fixed bottom-0 left-0 right-0 bg-white z-50" style={{ boxShadow: "0 -1px 0 rgba(0,0,0,0.06)" }}>
          <div className="max-w-lg mx-auto flex items-center justify-center gap-6 py-4 pb-[max(16px,env(safe-area-inset-bottom))]">
            <button onClick={handleDismiss}
              className="press w-14 h-14 rounded-full border border-gray-200 flex items-center justify-center"
              style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
              <X className="w-6 h-6 text-gray-400" strokeWidth={2} />
            </button>
            <button onClick={handleMatch}
              className="press w-14 h-14 rounded-full bg-accent flex items-center justify-center"
              style={{ boxShadow: "0 2px 8px rgba(103,41,95,0.3)" }}>
              <Heart className="w-6 h-6 text-white" fill="white" strokeWidth={0} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto bg-white min-h-screen">
      <div className="px-5 pt-4 pb-3">
        <h1 className="text-[24px] font-semibold text-gray-900">Likes You</h1>
      </div>

      {loading ? (
        <div className="px-4 grid grid-cols-2 gap-2">
          {[0,1,2,3].map((i) => <div key={i} className="aspect-square rounded-[14px] skeleton" />)}
        </div>
      ) : likes.length === 0 ? (
        <div className="flex flex-col items-center pt-16 px-8 text-center animate-slide-up">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-5">
            <Heart className="w-7 h-7 text-gray-300" strokeWidth={1.5} />
          </div>
          <p className="text-[18px] font-semibold text-gray-900 mb-1">No likes yet</p>
          <p className="text-gray-400 text-[14px] leading-relaxed">When someone likes your profile, they&apos;ll appear here.</p>
        </div>
      ) : (
        <div className="px-4 pb-24">
          <p className="text-[13px] text-gray-400 mb-3">{likes.length} {likes.length === 1 ? "person" : "people"} liked you</p>
          <div className="grid grid-cols-2 gap-2 stagger">
            {likes.map((like) => (
              <button key={like.id} onClick={() => openProfile(like)}
                className="relative rounded-[14px] overflow-hidden bg-gray-100 aspect-square text-left press">
                {like.from_profile.photos[0] ? (
                  <img src={like.from_profile.photos[0].url} alt="" className="w-full h-full object-cover" draggable={false} />
                ) : (
                  <div className="w-full h-full bg-gray-200" />
                )}
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/50 to-transparent">
                  <p className="text-white text-[15px] font-medium">{like.from_profile.first_name}, {like.from_profile.age}</p>
                  {like.comment && (
                    <div className="flex items-start gap-1 mt-0.5">
                      <MessageCircle className="w-3 h-3 text-white/50 mt-0.5 flex-shrink-0" strokeWidth={2} />
                      <p className="text-white/70 text-[11px] line-clamp-2 leading-tight">{like.comment}</p>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
