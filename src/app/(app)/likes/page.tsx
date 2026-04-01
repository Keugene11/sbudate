"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Heart, MessageCircle } from "lucide-react";

interface LikeWithProfile {
  id: string; comment: string | null;
  from_profile: { id: string; first_name: string; age: number; photos: { url: string }[]; };
}

export default function LikesPage() {
  const supabase = createClient();
  const [likes, setLikes] = useState<LikeWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [myProfileId, setMyProfileId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: myProfile } = await supabase.from("profiles").select("id").eq("user_id", user.id).single();
      if (!myProfile) return;
      setMyProfileId(myProfile.id);

      const { data: matches } = await supabase.from("matches").select("profile1_id, profile2_id")
        .or(`profile1_id.eq.${myProfile.id},profile2_id.eq.${myProfile.id}`);
      const matchedIds = new Set(matches?.flatMap((m) => m.profile1_id === myProfile.id ? [m.profile2_id] : [m.profile1_id]) || []);

      const { data: incomingLikes } = await supabase.from("likes").select("id, comment, created_at, from_profile_id")
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
    })();
  }, [supabase]);

  const handleLikeBack = async (id: string) => {
    if (!myProfileId) return;
    await supabase.from("likes").insert({ from_profile_id: myProfileId, to_profile_id: id, content_type: "photo", content_id: "like-back" });
    await supabase.from("matches").insert({ profile1_id: myProfileId, profile2_id: id });
    setLikes((prev) => prev.filter((l) => l.from_profile.id !== id));
  };

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
          <div className="grid grid-cols-2 gap-2 stagger">
            {likes.map((like) => (
              <div key={like.id} className="relative rounded-[14px] overflow-hidden bg-gray-100 aspect-square">
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
                <button onClick={() => handleLikeBack(like.from_profile.id)}
                  className="press absolute top-2.5 right-2.5 w-9 h-9 rounded-full bg-accent flex items-center justify-center">
                  <Heart className="w-4 h-4 text-white" fill="white" strokeWidth={0} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
