"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Heart, MessageCircle } from "lucide-react";

interface LikeWithProfile {
  id: string;
  content_type: string;
  comment: string | null;
  created_at: string;
  from_profile: {
    id: string;
    first_name: string;
    age: number;
    photos: { url: string }[];
  };
}

export default function LikesPage() {
  const supabase = createClient();
  const [likes, setLikes] = useState<LikeWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [myProfileId, setMyProfileId] = useState<string | null>(null);

  useEffect(() => {
    const fetchLikes = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: myProfile } = await supabase.from("profiles").select("id").eq("user_id", user.id).single();
      if (!myProfile) return;
      setMyProfileId(myProfile.id);

      const { data: matches } = await supabase.from("matches").select("profile1_id, profile2_id")
        .or(`profile1_id.eq.${myProfile.id},profile2_id.eq.${myProfile.id}`);
      const matchedIds = new Set(
        matches?.flatMap((m) => m.profile1_id === myProfile.id ? [m.profile2_id] : [m.profile1_id]) || []
      );

      const { data: incomingLikes } = await supabase.from("likes").select("id, content_type, comment, created_at, from_profile_id")
        .eq("to_profile_id", myProfile.id).order("created_at", { ascending: false });
      if (!incomingLikes) { setLoading(false); return; }

      const unmatched = incomingLikes.filter((l) => !matchedIds.has(l.from_profile_id));
      const enriched: LikeWithProfile[] = [];
      for (const like of unmatched) {
        const { data: profile } = await supabase.from("profiles").select("id, first_name, age").eq("id", like.from_profile_id).single();
        const { data: photos } = await supabase.from("photos").select("url").eq("profile_id", like.from_profile_id).order("position").limit(1);
        if (profile) enriched.push({ ...like, from_profile: { ...profile, photos: photos || [] } });
      }
      setLikes(enriched);
      setLoading(false);
    };
    fetchLikes();
  }, [supabase]);

  const handleLikeBack = async (id: string) => {
    if (!myProfileId) return;
    await supabase.from("likes").insert({ from_profile_id: myProfileId, to_profile_id: id, content_type: "photo", content_id: "like-back" });
    await supabase.from("matches").insert({ profile1_id: myProfileId, profile2_id: id });
    setLikes((prev) => prev.filter((l) => l.from_profile.id !== id));
  };

  return (
    <div className="max-w-lg mx-auto bg-white min-h-screen">
      <div className="px-5 pt-4 pb-2">
        <h1 className="text-[28px] font-medium">Likes You</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
        </div>
      ) : likes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-8 text-center animate-slide-up">
          {/* Empty state illustration placeholder */}
          <div className="w-48 h-48 mb-6 flex items-center justify-center">
            <Heart className="w-20 h-20 text-gray-200" strokeWidth={1} />
          </div>
          <p className="text-[20px] font-medium mb-2">No likes yet&mdash;we&apos;re here to help</p>
          <p className="text-gray-400 text-[14px] mb-6">We can get you seen by more daters, sooner.</p>
          <button className="press w-full h-[48px] bg-[#097270] text-white rounded-full text-[14px] font-medium mb-3">
            Boost your profile
          </button>
        </div>
      ) : (
        <div className="px-3 pt-2 pb-4">
          <div className="grid grid-cols-2 gap-2 stagger">
            {likes.map((like) => (
              <div key={like.id} className="relative rounded-xl overflow-hidden bg-gray-100 aspect-square">
                {like.from_profile.photos[0] ? (
                  <img src={like.from_profile.photos[0].url} alt="" className="w-full h-full object-cover" draggable={false} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <span className="text-[36px]">👤</span>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
                  <p className="text-white font-medium text-[15px]">
                    {like.from_profile.first_name}, {like.from_profile.age}
                  </p>
                  {like.comment && (
                    <div className="flex items-start gap-1 mt-0.5">
                      <MessageCircle className="w-3 h-3 text-white/60 mt-0.5 flex-shrink-0" strokeWidth={2} />
                      <p className="text-white/80 text-[11px] line-clamp-2 leading-tight">{like.comment}</p>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleLikeBack(like.from_profile.id)}
                  className="press absolute top-2 right-2 w-9 h-9 rounded-full bg-[#D45847] flex items-center justify-center"
                >
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
