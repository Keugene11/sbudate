"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Heart, MessageCircle, X, Send, ChevronLeft, BadgeCheck } from "lucide-react";
import type { ProfileWithContent, Photo, Prompt } from "@/types";

interface IncomingLike {
  id: string; comment: string | null; content_type: string; content_id: string; from_profile_id: string;
  from_profile: { id: string; first_name: string; age: number; major: string | null; photo_url: string | null; is_premium: boolean; };
}

export default function LikesPage() {
  const supabase = createClient();
  const [likes, setLikes] = useState<IncomingLike[]>([]);
  const [loading, setLoading] = useState(true);
  const [myProfileId, setMyProfileId] = useState<string | null>(null);
  const [myPhotos, setMyPhotos] = useState<Photo[]>([]);
  const [myPrompts, setMyPrompts] = useState<Prompt[]>([]);
  const [viewing, setViewing] = useState<IncomingLike | null>(null);
  const [viewingProfile, setViewingProfile] = useState<ProfileWithContent | null>(null);
  const [reply, setReply] = useState("");

  const fetchLikes = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: myProfile } = await supabase.from("profiles").select("id").eq("user_id", user.id).single();
    if (!myProfile) return;
    setMyProfileId(myProfile.id);
    const [{ data: photos }, { data: prompts }] = await Promise.all([
      supabase.from("photos").select("*").eq("profile_id", myProfile.id).order("position"),
      supabase.from("prompts").select("*").eq("profile_id", myProfile.id).order("position"),
    ]);
    setMyPhotos(photos || []); setMyPrompts(prompts || []);
    const { data: matches } = await supabase.from("matches").select("profile1_id, profile2_id").or(`profile1_id.eq.${myProfile.id},profile2_id.eq.${myProfile.id}`);
    const matchedIds = new Set(matches?.flatMap((m) => m.profile1_id === myProfile.id ? [m.profile2_id] : [m.profile1_id]) || []);
    const { data: incomingLikes } = await supabase.from("likes").select("id, comment, content_type, content_id, created_at, from_profile_id, status").eq("to_profile_id", myProfile.id).order("created_at", { ascending: false });
    if (!incomingLikes) { setLoading(false); return; }
    const enriched: IncomingLike[] = [];
    for (const like of incomingLikes.filter((l) => !matchedIds.has(l.from_profile_id))) {
      const { data: profile } = await supabase.from("profiles").select("id, first_name, age, major, is_premium").eq("id", like.from_profile_id).single();
      const { data: theirPhotos } = await supabase.from("photos").select("url").eq("profile_id", like.from_profile_id).order("position").limit(1);
      if (profile) {
        // Hide comment if not yet approved
        const visibleComment = like.status === "approved" ? like.comment : null;
        enriched.push({ ...like, comment: visibleComment, from_profile: { ...profile, is_premium: profile.is_premium || false, photo_url: theirPhotos?.[0]?.url || null } });
      }
    }
    setLikes(enriched); setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchLikes(); }, [fetchLikes]);

  const openLike = async (like: IncomingLike) => {
    setViewing(like); setReply("");
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
    await supabase.from("likes").insert({ from_profile_id: myProfileId, to_profile_id: viewing.from_profile_id, content_type: "photo", content_id: "like-back", status: "approved" });
    const { data: match } = await supabase.from("matches").insert({ profile1_id: myProfileId, profile2_id: viewing.from_profile_id }).select().single();
    if (message && match) {
      const { data: msg } = await supabase.from("messages").insert({ match_id: match.id, sender_id: myProfileId, content: message }).select().single();
      if (msg) fetch("/api/notify-message", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messageId: msg.id }) }).catch(() => {});
    }
    setLikes((prev) => prev.filter((l) => l.id !== viewing.id));
    setViewing(null); setViewingProfile(null); setReply("");
  };

  const handleDismiss = async () => {
    if (!viewing) return;
    await fetch("/api/dismiss-like", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ likeId: viewing.id }) });
    setLikes((prev) => prev.filter((l) => l.id !== viewing.id));
    setViewing(null); setViewingProfile(null); setReply("");
  };

  const getLikedContent = (like: IncomingLike) => {
    if (like.content_type === "photo") { const photo = myPhotos.find((p) => p.id === like.content_id); return photo ? { type: "photo" as const, photo } : null; }
    else { const prompt = myPrompts.find((p) => p.id === like.content_id); return prompt ? { type: "prompt" as const, prompt } : null; }
  };

  if (viewing) {
    const likedContent = getLikedContent(viewing);
    return (
      <div className="max-w-lg mx-auto min-h-screen pb-24">
        {/* Header */}
        <div className="flex items-center justify-between px-3 h-[52px]">
          <button onClick={() => { setViewing(null); setViewingProfile(null); }} className="press p-1.5">
            <ChevronLeft className="w-6 h-6 text-gray-900" strokeWidth={2} />
          </button>
          <button onClick={handleDismiss} className="press text-[14px] text-gray-400 font-medium px-2">
            Remove
          </button>
        </div>

        {/* Hero: the liked content front and center */}
        <div className="px-4 pt-5">
          {/* Liker identity */}
          <div className="flex items-center gap-3 mb-5">
            {viewing.from_profile.photo_url ? (
              <img src={viewing.from_profile.photo_url} alt="" className="w-12 h-12 rounded-full object-cover" />
            ) : <div className="w-12 h-12 rounded-full bg-gray-200" />}
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-[17px] font-semibold text-gray-900">{viewing.from_profile.first_name}, {viewing.from_profile.age}</p>
                {viewing.from_profile.is_premium && <BadgeCheck className="w-4.5 h-4.5 text-gray-900" strokeWidth={2} fill="currentColor" />}
              </div>
              <div className="flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-foreground" fill="currentColor" strokeWidth={0} />
                <span className="text-[13px] text-gray-400 font-medium">
                  Liked your {likedContent?.type === "photo" ? "photo" : likedContent?.type === "prompt" ? "prompt" : "profile"}
                </span>
              </div>
            </div>
          </div>

          {/* The liked content — hero card */}
          {likedContent?.type === "photo" && (
            <div className="rounded-2xl overflow-hidden shadow-card">
              <img src={likedContent.photo.url} alt="" className="w-full aspect-square object-cover" />
            </div>
          )}
          {likedContent?.type === "prompt" && (
            <div className="bg-gray-50 rounded-2xl px-6 py-6 shadow-card">
              <p className="text-[12px] text-gray-400 uppercase tracking-[0.08em] font-semibold mb-3">{likedContent.prompt.question}</p>
              <p className="text-[20px] text-gray-900 leading-[1.4] font-medium">{likedContent.prompt.answer}</p>
            </div>
          )}

          {/* Their comment bubble */}
          {viewing.comment && (
            <div className="flex items-start gap-2.5 mt-3">
              {viewing.from_profile.photo_url ? (
                <img src={viewing.from_profile.photo_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-0.5" />
              ) : <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 mt-0.5" />}
              <div className="bg-gray-900 rounded-2xl rounded-tl-[6px] px-4 py-3">
                <p className="text-[15px] text-white">{viewing.comment}</p>
              </div>
            </div>
          )}

          {/* Reply input — directly below liked content */}
          <div className="mt-4 mb-6">
            <div className="flex items-center gap-2.5">
              <input
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && reply.trim() && handleMatch(reply.trim())}
                placeholder={`Reply to ${viewing.from_profile.first_name}...`}
                className="flex-1 h-12 bg-gray-50 border border-border rounded-full px-4 text-[15px] outline-none input-hinge"
              />
              <button
                onClick={() => reply.trim() && handleMatch(reply.trim())}
                disabled={!reply.trim()}
                className="press w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0 shadow-md shadow-black/10 disabled:opacity-30 transition-opacity"
              >
                <Send className="w-5 h-5 text-white" strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-border mx-4 mb-4" />

        {/* Their full profile below */}
        {viewingProfile && (
          <div className="px-3 space-y-2.5 pb-8">
            <p className="text-[12px] text-gray-400 uppercase tracking-[0.08em] font-medium px-1 mb-1">
              {viewingProfile.first_name}&apos;s Profile
            </p>
            {(() => {
              const items: Array<{ type: "photo" | "prompt"; data: (typeof viewingProfile.photos)[0] | (typeof viewingProfile.prompts)[0] }> = [];
              const maxLen = Math.max(viewingProfile.photos.length, viewingProfile.prompts.length);
              for (let i = 0; i < maxLen; i++) {
                if (viewingProfile.photos[i]) items.push({ type: "photo", data: viewingProfile.photos[i] });
                if (viewingProfile.prompts[i]) items.push({ type: "prompt", data: viewingProfile.prompts[i] });
              }
              let promptCount = 0;
              return items.map((item, idx) => {
                if (item.type === "photo") {
                  const photo = item.data as (typeof viewingProfile.photos)[0];
                  return (
                    <div key={photo.id} className="relative rounded-2xl overflow-hidden">
                      <img src={photo.url} alt="" className="w-full aspect-square object-cover" draggable={false} />
                      {idx === 0 && (
                        <>
                          <div className="absolute inset-0 photo-gradient" />
                          <div className="absolute bottom-5 left-5">
                            <p className="text-white text-[26px] font-semibold tracking-tight">
                              {viewingProfile.first_name}, {viewingProfile.age}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  );
                } else {
                  const prompt = item.data as (typeof viewingProfile.prompts)[0];
                  const bg = promptCount % 2 === 0 ? "bg-gray-50" : "bg-gray-100";
                  promptCount++;
                  return (
                    <div key={prompt.id} className={`${bg} rounded-2xl px-5 py-5`}>
                      <p className="text-[12px] text-gray-500 uppercase tracking-[0.08em] font-medium mb-2">{prompt.question}</p>
                      <p className="text-[18px] text-gray-900 leading-[1.4] font-medium">{prompt.answer}</p>
                    </div>
                  );
                }
              });
            })()}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto min-h-screen animate-tab-in">
      <div className="px-5 pt-4 pb-2">
        <h1 className="text-[26px] font-semibold text-gray-900 tracking-tight">Likes You</h1>
      </div>

      {loading ? (
        <div className="px-4 grid grid-cols-2 gap-2.5">
          {[0,1,2,3].map((i) => <div key={i} className="aspect-square rounded-2xl skeleton" />)}
        </div>
      ) : likes.length === 0 ? (
        <div className="flex flex-col items-center pt-20 px-8 text-center animate-slide-up">
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-full bg-foreground/5 flex items-center justify-center">
              <Heart className="w-9 h-9 text-foreground/30" strokeWidth={1.5} />
            </div>
            <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center">
              <Heart className="w-4 h-4 text-foreground/40" strokeWidth={1.5} />
            </div>
          </div>
          <p className="text-[22px] font-semibold text-gray-900 mb-2 tracking-tight">No likes yet</p>
          <p className="text-gray-400 text-[15px] leading-relaxed max-w-[240px]">
            When someone likes your profile, they&apos;ll appear here.
          </p>
        </div>
      ) : (
        <div className="px-4 pb-24">
          <p className="text-[13px] text-gray-400 mb-3 font-medium">
            {likes.length} {likes.length === 1 ? "person" : "people"} liked you
          </p>
          <div className="grid grid-cols-2 gap-2.5 stagger">
            {likes.map((like) => (
              <button
                key={like.id}
                onClick={() => openLike(like)}
                className="relative rounded-2xl overflow-hidden bg-gray-200 aspect-square text-left press shadow-photo"
              >
                {like.from_profile.photo_url ? (
                  <img src={like.from_profile.photo_url} alt="" className="w-full h-full object-cover" draggable={false} />
                ) : <div className="w-full h-full" />}
                <div className="absolute inset-0 photo-gradient" />
                <div className="absolute bottom-0 left-0 right-0 p-3.5">
                  <p className="text-white text-[16px] font-semibold tracking-tight">
                    {like.from_profile.first_name}, {like.from_profile.age}
                  </p>
                  {like.comment && (
                    <div className="flex items-start gap-1.5 mt-1">
                      <MessageCircle className="w-3 h-3 text-white/50 mt-0.5 flex-shrink-0" strokeWidth={2} />
                      <p className="text-white/75 text-[12px] line-clamp-2 leading-tight">{like.comment}</p>
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
