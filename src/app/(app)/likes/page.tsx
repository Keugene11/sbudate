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

      const { data: myProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!myProfile) return;
      setMyProfileId(myProfile.id);

      // Get likes where I'm the target, excluding matched ones
      const { data: matches } = await supabase
        .from("matches")
        .select("profile1_id, profile2_id")
        .or(`profile1_id.eq.${myProfile.id},profile2_id.eq.${myProfile.id}`);

      const matchedIds = new Set(
        matches?.flatMap((m) =>
          m.profile1_id === myProfile.id ? [m.profile2_id] : [m.profile1_id]
        ) || []
      );

      const { data: incomingLikes } = await supabase
        .from("likes")
        .select("id, content_type, comment, created_at, from_profile_id")
        .eq("to_profile_id", myProfile.id)
        .order("created_at", { ascending: false });

      if (!incomingLikes) {
        setLoading(false);
        return;
      }

      // Filter out already matched and fetch profiles
      const unmatched = incomingLikes.filter((l) => !matchedIds.has(l.from_profile_id));

      const enriched: LikeWithProfile[] = [];
      for (const like of unmatched) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, first_name, age")
          .eq("id", like.from_profile_id)
          .single();

        const { data: photos } = await supabase
          .from("photos")
          .select("url")
          .eq("profile_id", like.from_profile_id)
          .order("position")
          .limit(1);

        if (profile) {
          enriched.push({
            ...like,
            from_profile: { ...profile, photos: photos || [] },
          });
        }
      }

      setLikes(enriched);
      setLoading(false);
    };

    fetchLikes();
  }, [supabase]);

  const handleLikeBack = async (likeFromProfileId: string) => {
    if (!myProfileId) return;

    // Create a like back
    await supabase.from("likes").insert({
      from_profile_id: myProfileId,
      to_profile_id: likeFromProfileId,
      content_type: "photo",
      content_id: "like-back",
    });

    // Create match
    await supabase.from("matches").insert({
      profile1_id: myProfileId,
      profile2_id: likeFromProfileId,
    });

    setLikes((prev) => prev.filter((l) => l.from_profile.id !== likeFromProfileId));
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="sticky top-0 z-40 bg-hinge-white/90 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-center py-3">
          <h1 className="font-serif text-[20px] font-semibold text-hinge-black">
            Likes You
          </h1>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-border border-t-hinge-black rounded-full animate-spin" />
        </div>
      ) : likes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-slide-up">
          <div className="w-16 h-16 rounded-full bg-pebble flex items-center justify-center mb-4">
            <Heart className="w-8 h-8 text-coral" strokeWidth={1.5} />
          </div>
          <h2 className="font-serif text-[22px] font-semibold mb-2">No likes yet</h2>
          <p className="text-dove text-[14px] leading-relaxed max-w-xs">
            When someone likes your profile, they&apos;ll appear here.
          </p>
        </div>
      ) : (
        <div className="p-4 stagger">
          <p className="text-[13px] text-dove mb-4 font-medium">
            {likes.length} {likes.length === 1 ? "person" : "people"} liked you
          </p>
          <div className="grid grid-cols-2 gap-3">
            {likes.map((like) => (
              <div
                key={like.id}
                className="relative rounded-2xl overflow-hidden border border-border bg-bg-card"
              >
                {like.from_profile.photos[0] ? (
                  <img
                    src={like.from_profile.photos[0].url}
                    alt={like.from_profile.first_name}
                    className="w-full aspect-[3/4] object-cover"
                  />
                ) : (
                  <div className="w-full aspect-[3/4] bg-bg-input flex items-center justify-center">
                    <span className="text-[40px]">👤</span>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                  <p className="text-white font-semibold text-[15px]">
                    {like.from_profile.first_name}, {like.from_profile.age}
                  </p>
                  {like.comment && (
                    <div className="flex items-start gap-1 mt-1">
                      <MessageCircle className="w-3 h-3 text-white/70 mt-0.5 flex-shrink-0" />
                      <p className="text-white/80 text-[12px] line-clamp-2">{like.comment}</p>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleLikeBack(like.from_profile.id)}
                  className="press absolute top-2 right-2 w-10 h-10 rounded-full bg-coral flex items-center justify-center shadow-lg"
                >
                  <Heart className="w-5 h-5 text-white" fill="white" strokeWidth={0} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
