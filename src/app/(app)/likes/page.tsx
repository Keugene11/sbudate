"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Heart, MessageCircle, X, Send, ChevronLeft } from "lucide-react";
import type { ProfileWithContent, Photo, Prompt } from "@/types";

interface IncomingLike {
  id: string;
  comment: string | null;
  content_type: string;
  content_id: string;
  from_profile_id: string;
  from_profile: {
    id: string;
    first_name: string;
    age: number;
    major: string | null;
    photo_url: string | null;
  };
}

export default function LikesPage() {
  const supabase = createClient();
  const [likes, setLikes] = useState<IncomingLike[]>([]);
  const [loading, setLoading] = useState(true);
  const [myProfileId, setMyProfileId] = useState<string | null>(null);
  const [myPhotos, setMyPhotos] = useState<Photo[]>([]);
  const [myPrompts, setMyPrompts] = useState<Prompt[]>([]);

  // Detail view state
  const [viewing, setViewing] = useState<IncomingLike | null>(null);
  const [viewingProfile, setViewingProfile] = useState<ProfileWithContent | null>(null);
  const [reply, setReply] = useState("");

  const fetchLikes = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: myProfile } = await supabase.from("profiles").select("id").eq("user_id", user.id).single();
    if (!myProfile) return;
    setMyProfileId(myProfile.id);

    // Fetch my own photos and prompts so we can show what they liked
    const [{ data: photos }, { data: prompts }] = await Promise.all([
      supabase.from("photos").select("*").eq("profile_id", myProfile.id).order("position"),
      supabase.from("prompts").select("*").eq("profile_id", myProfile.id).order("position"),
    ]);
    setMyPhotos(photos || []);
    setMyPrompts(prompts || []);

    const { data: matches } = await supabase.from("matches").select("profile1_id, profile2_id")
      .or(`profile1_id.eq.${myProfile.id},profile2_id.eq.${myProfile.id}`);
    const matchedIds = new Set(matches?.flatMap((m) => m.profile1_id === myProfile.id ? [m.profile2_id] : [m.profile1_id]) || []);

    const { data: incomingLikes } = await supabase.from("likes")
      .select("id, comment, content_type, content_id, created_at, from_profile_id")
      .eq("to_profile_id", myProfile.id).order("created_at", { ascending: false });
    if (!incomingLikes) { setLoading(false); return; }

    const enriched: IncomingLike[] = [];
    for (const like of incomingLikes.filter((l) => !matchedIds.has(l.from_profile_id))) {
      const { data: profile } = await supabase.from("profiles").select("id, first_name, age, major").eq("id", like.from_profile_id).single();
      const { data: theirPhotos } = await supabase.from("photos").select("url").eq("profile_id", like.from_profile_id).order("position").limit(1);
      if (profile) enriched.push({ ...like, from_profile: { ...profile, photo_url: theirPhotos?.[0]?.url || null } });
    }
    setLikes(enriched);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchLikes(); }, [fetchLikes]);

  const openLike = async (like: IncomingLike) => {
    setViewing(like);
    setReply("");
    // Fetch their full profile
    const { data: p } = await supabase.from("profiles").select("*").eq("id", like.from_profile_id).single();
    if (!p) return;
    const [{ data: photos }, { data: prompts }] = await Promise.all([
      supabase.from("photos").select("*").eq("profile_id", like.from_profile_id).order("position"),
      supabase.from("prompts").select("*").eq("profile_id", like.from_profile_id).order("position"),
    ]);
    setViewingProfile({ ...p, photos: photos || [], prompts: prompts || [] });
  };

  const handleMatch = async (message?: string) => {
    if (!myProfileId || !viewing) return;
    // Create like back
    await supabase.from("likes").insert({ from_profile_id: myProfileId, to_profile_id: viewing.from_profile_id, content_type: "photo", content_id: "like-back" });
    // Create match
    const { data: match } = await supabase.from("matches").insert({ profile1_id: myProfileId, profile2_id: viewing.from_profile_id }).select().single();
    // If they typed a reply, send it as first message
    if (message && match) {
      await supabase.from("messages").insert({ match_id: match.id, sender_id: myProfileId, content: message });
    }
    setLikes((prev) => prev.filter((l) => l.id !== viewing.id));
    setViewing(null);
    setViewingProfile(null);
    setReply("");
  };

  const handleDismiss = async () => {
    if (!viewing) return;
    await supabase.from("likes").delete().eq("id", viewing.id);
    setLikes((prev) => prev.filter((l) => l.id !== viewing.id));
    setViewing(null);
    setViewingProfile(null);
    setReply("");
  };

  // Find what they liked (my photo or prompt)
  const getLikedContent = (like: IncomingLike) => {
    if (like.content_type === "photo") {
      const photo = myPhotos.find((p) => p.id === like.content_id);
      return photo ? { type: "photo" as const, photo } : null;
    } else {
      const prompt = myPrompts.find((p) => p.id === like.content_id);
      return prompt ? { type: "prompt" as const, prompt } : null;
    }
  };

  // Detail view
  if (viewing) {
    const likedContent = getLikedContent(viewing);

    return (
      <div className="max-w-lg mx-auto bg-white min-h-screen pb-28">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm" style={{ boxShadow: "0 1px 0 rgba(0,0,0,0.04)" }}>
          <div className="flex items-center px-4 h-[52px]">
            <button onClick={() => { setViewing(null); setViewingProfile(null); }} className="press p-1">
              <ChevronLeft className="w-6 h-6 text-gray-900" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* What they liked + their comment */}
        <div className="px-4 pt-2 pb-4">
          {/* Their info */}
          <div className="flex items-center gap-3 mb-4">
            {viewing.from_profile.photo_url ? (
              <img src={viewing.from_profile.photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
            ) : <div className="w-10 h-10 rounded-full bg-gray-200" />}
            <div>
              <p className="text-[15px] font-medium text-gray-900">{viewing.from_profile.first_name}, {viewing.from_profile.age}</p>
              {viewing.from_profile.major && <p className="text-[13px] text-gray-400">{viewing.from_profile.major}</p>}
            </div>
          </div>

          {/* The content they liked (your photo or prompt) */}
          {likedContent?.type === "photo" && (
            <div className="rounded-[16px] overflow-hidden mb-3">
              <img src={likedContent.photo.url} alt="" className="w-full aspect-[4/5] object-cover" />
            </div>
          )}
          {likedContent?.type === "prompt" && (
            <div className="bg-cream rounded-[16px] px-5 py-4 mb-3">
              <p className="text-[12px] text-gray-500 tracking-wide mb-1">{likedContent.prompt.question}</p>
              <p className="text-[16px] text-gray-900 leading-[1.4]">{likedContent.prompt.answer}</p>
            </div>
          )}

          {/* Their comment */}
          {viewing.comment && (
            <div className="flex items-start gap-2.5 mb-4">
              {viewing.from_profile.photo_url ? (
                <img src={viewing.from_profile.photo_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-0.5" />
              ) : <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 mt-0.5" />}
              <div className="bg-gray-100 rounded-[16px] rounded-tl-[4px] px-4 py-2.5">
                <p className="text-[15px] text-gray-900 leading-relaxed">{viewing.comment}</p>
              </div>
            </div>
          )}
          {!viewing.comment && (
            <p className="text-[14px] text-gray-400 mb-4">
              {viewing.from_profile.first_name} liked your {likedContent?.type === "photo" ? "photo" : "prompt"}
            </p>
          )}
        </div>

        {/* Their full profile below */}
        {viewingProfile && (
          <div className="px-4 space-y-3">
            {viewingProfile.photos.map((photo) => (
              <div key={photo.id} className="rounded-[16px] overflow-hidden">
                <img src={photo.url} alt="" className="w-full aspect-[4/5] object-cover" draggable={false} />
              </div>
            ))}
            {viewingProfile.prompts.map((prompt) => (
              <div key={prompt.id} className="bg-cream rounded-[16px] px-5 py-5">
                <p className="text-[12px] text-gray-500 tracking-wide mb-1.5">{prompt.question}</p>
                <p className="text-[17px] text-gray-900 leading-[1.45]">{prompt.answer}</p>
              </div>
            ))}
          </div>
        )}

        {/* Fixed bottom — Dismiss or Reply */}
        <div className="fixed bottom-0 left-0 right-0 bg-white z-50" style={{ boxShadow: "0 -1px 0 rgba(0,0,0,0.06)" }}>
          <div className="max-w-lg mx-auto px-4 py-3" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
            <div className="flex items-center gap-2.5">
              <button onClick={handleDismiss}
                className="press w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center flex-shrink-0">
                <X className="w-5 h-5 text-gray-400" strokeWidth={2} />
              </button>
              <div className="flex-1 flex gap-2">
                <input
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (reply.trim() ? handleMatch(reply.trim()) : handleMatch())}
                  placeholder="Type a reply..."
                  className="flex-1 h-12 bg-gray-100 rounded-[14px] px-4 text-[15px] outline-none input-focus"
                />
                <button onClick={() => reply.trim() ? handleMatch(reply.trim()) : handleMatch()}
                  className={`press w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-150 ${
                    reply.trim() ? "bg-accent" : "bg-accent"
                  }`}
                  style={{ boxShadow: "0 2px 8px rgba(103,41,95,0.25)" }}>
                  {reply.trim() ? (
                    <Send className="w-5 h-5 text-white" strokeWidth={2} />
                  ) : (
                    <Heart className="w-5 h-5 text-white" fill="white" strokeWidth={0} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid view
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
              <button key={like.id} onClick={() => openLike(like)}
                className="relative rounded-[14px] overflow-hidden bg-gray-100 aspect-square text-left press">
                {like.from_profile.photo_url ? (
                  <img src={like.from_profile.photo_url} alt="" className="w-full h-full object-cover" draggable={false} />
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
