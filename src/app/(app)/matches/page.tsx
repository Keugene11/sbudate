"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface MatchWithProfile {
  match_id: string;
  profile: {
    id: string;
    first_name: string;
    age: number;
    major: string | null;
    photo_url: string | null;
  };
  last_message: string | null;
  last_message_at: string | null;
  unread: boolean;
}

export default function MatchesPage() {
  const supabase = createClient();
  const [matches, setMatches] = useState<MatchWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: myProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!myProfile) return;

      const { data: matchData } = await supabase
        .from("matches")
        .select("*")
        .or(`profile1_id.eq.${myProfile.id},profile2_id.eq.${myProfile.id}`)
        .order("created_at", { ascending: false });

      if (!matchData) {
        setLoading(false);
        return;
      }

      const enriched: MatchWithProfile[] = [];

      for (const match of matchData) {
        const otherId = match.profile1_id === myProfile.id ? match.profile2_id : match.profile1_id;

        const { data: profile } = await supabase
          .from("profiles")
          .select("id, first_name, age, major")
          .eq("id", otherId)
          .single();

        const { data: photos } = await supabase
          .from("photos")
          .select("url")
          .eq("profile_id", otherId)
          .order("position")
          .limit(1);

        const { data: lastMsg } = await supabase
          .from("messages")
          .select("content, created_at, sender_id, read")
          .eq("match_id", match.id)
          .order("created_at", { ascending: false })
          .limit(1);

        if (profile) {
          enriched.push({
            match_id: match.id,
            profile: {
              ...profile,
              photo_url: photos?.[0]?.url || null,
            },
            last_message: lastMsg?.[0]?.content || null,
            last_message_at: lastMsg?.[0]?.created_at || match.created_at,
            unread: lastMsg?.[0] ? !lastMsg[0].read && lastMsg[0].sender_id !== myProfile.id : false,
          });
        }
      }

      setMatches(enriched);
      setLoading(false);
    };

    fetchMatches();
  }, [supabase]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHrs = diffMs / (1000 * 60 * 60);
    if (diffHrs < 1) return "Just now";
    if (diffHrs < 24) return `${Math.floor(diffHrs)}h ago`;
    if (diffHrs < 48) return "Yesterday";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="sticky top-0 z-40 bg-hinge-white/90 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-center py-3">
          <h1 className="font-serif text-[20px] font-semibold text-hinge-black">
            Matches
          </h1>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-border border-t-hinge-black rounded-full animate-spin" />
        </div>
      ) : matches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-slide-up">
          <h2 className="font-serif text-[22px] font-semibold mb-2">No matches yet</h2>
          <p className="text-dove text-[14px] leading-relaxed max-w-xs">
            When you and someone like each other, you&apos;ll match and can start chatting.
          </p>
        </div>
      ) : (
        <div className="stagger">
          {matches.map((match) => (
            <Link
              key={match.match_id}
              href={`/matches/${match.match_id}`}
              className="flex items-center gap-3.5 px-5 py-4 border-b border-border press hover:bg-bg-input/50 transition-colors"
            >
              {match.profile.photo_url ? (
                <img
                  src={match.profile.photo_url}
                  alt={match.profile.first_name}
                  className="w-14 h-14 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-bg-input flex items-center justify-center flex-shrink-0">
                  <span className="text-[24px]">👤</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className={`text-[15px] ${match.unread ? "font-bold" : "font-semibold"} text-hinge-black`}>
                    {match.profile.first_name}, {match.profile.age}
                  </h3>
                  <span className="text-[12px] text-dove">
                    {formatTime(match.last_message_at || "")}
                  </span>
                </div>
                <p className={`text-[13px] truncate ${match.unread ? "text-hinge-black font-medium" : "text-dove"}`}>
                  {match.last_message || "You matched! Say hello 👋"}
                </p>
              </div>
              {match.unread && (
                <div className="w-2.5 h-2.5 rounded-full bg-coral flex-shrink-0" />
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
