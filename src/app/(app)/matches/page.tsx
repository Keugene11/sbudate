"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { MessageSquare } from "lucide-react";

interface MatchWithProfile {
  match_id: string;
  profile: { id: string; first_name: string; age: number; photo_url: string | null; };
  last_message: string | null; last_message_at: string | null; unread: boolean;
}

export default function MatchesPage() {
  const supabase = createClient();
  const [matches, setMatches] = useState<MatchWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: myProfile } = await supabase.from("profiles").select("id").eq("user_id", user.id).single();
      if (!myProfile) return;
      const { data: matchData } = await supabase.from("matches").select("*").or(`profile1_id.eq.${myProfile.id},profile2_id.eq.${myProfile.id}`).order("created_at", { ascending: false });
      if (!matchData) { setLoading(false); return; }
      const enriched: MatchWithProfile[] = [];
      for (const match of matchData) {
        const otherId = match.profile1_id === myProfile.id ? match.profile2_id : match.profile1_id;
        const { data: profile } = await supabase.from("profiles").select("id, first_name, age").eq("id", otherId).single();
        const { data: photos } = await supabase.from("photos").select("url").eq("profile_id", otherId).order("position").limit(1);
        const { data: lastMsg } = await supabase.from("messages").select("content, created_at, sender_id, read").eq("match_id", match.id).order("created_at", { ascending: false }).limit(1);
        if (profile) enriched.push({
          match_id: match.id, profile: { ...profile, photo_url: photos?.[0]?.url || null },
          last_message: lastMsg?.[0]?.content || null, last_message_at: lastMsg?.[0]?.created_at || match.created_at,
          unread: lastMsg?.[0] ? !lastMsg[0].read && lastMsg[0].sender_id !== myProfile.id : false,
        });
      }
      setMatches(enriched); setLoading(false);
    })();
  }, [supabase]);

  const formatTime = (d: string) => {
    const diff = (Date.now() - new Date(d).getTime()) / 3600000;
    if (diff < 1) return "Now"; if (diff < 24) return `${Math.floor(diff)}h`;
    if (diff < 48) return "Yesterday";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="max-w-lg mx-auto min-h-screen">
      <div className="px-5 pt-4 pb-3">
        <h1 className="text-[24px] font-semibold text-gray-900 tracking-tight">Matches</h1>
      </div>

      {loading ? (
        <div className="mx-4 bg-surface rounded-[12px] overflow-hidden">
          {[0,1,2].map((i) => (
            <div key={i} className={`flex items-center gap-3 px-4 py-3.5 ${i < 2 ? "border-b border-gray-100" : ""}`}>
              <div className="w-[48px] h-[48px] rounded-full skeleton flex-shrink-0" />
              <div className="flex-1 space-y-2"><div className="h-4 w-20 skeleton rounded" /><div className="h-3 w-36 skeleton rounded" /></div>
            </div>
          ))}
        </div>
      ) : matches.length === 0 ? (
        <div className="flex flex-col items-center pt-20 px-8 text-center animate-slide-up">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <MessageSquare className="w-6 h-6 text-gray-300" strokeWidth={1.5} />
          </div>
          <p className="text-[18px] font-semibold text-gray-900 mb-1">No matches yet</p>
          <p className="text-gray-400 text-[14px]">When you and someone like each other, you can chat here.</p>
        </div>
      ) : (
        <div className="mx-4 bg-surface rounded-[12px] overflow-hidden stagger">
          {matches.map((match, i) => (
            <Link key={match.match_id} href={`/chat/${match.match_id}`}
              className={`flex items-center gap-3 px-4 py-3.5 press active:bg-gray-50 transition-colors duration-100 ${i < matches.length - 1 ? "border-b border-gray-100" : ""}`}>
              {match.profile.photo_url ? (
                <img src={match.profile.photo_url} alt="" className="w-[48px] h-[48px] rounded-full object-cover flex-shrink-0" />
              ) : <div className="w-[48px] h-[48px] rounded-full bg-gray-200 flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className={`text-[15px] text-gray-900 ${match.unread ? "font-medium" : ""}`}>{match.profile.first_name}</p>
                  <span className="text-[12px] text-gray-400">{formatTime(match.last_message_at || "")}</span>
                </div>
                <p className={`text-[14px] truncate mt-0.5 ${match.unread ? "text-gray-900" : "text-gray-400"}`}>{match.last_message || "Say hello 👋"}</p>
              </div>
              {match.unread && <div className="w-2 h-2 rounded-full bg-rose flex-shrink-0" />}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
