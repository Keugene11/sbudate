"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { MessageSquare } from "lucide-react";

interface MatchWithProfile {
  match_id: string;
  profile: { id: string; first_name: string; age: number; photo_url: string | null; };
  last_message: string | null; last_message_at: string | null; unread: boolean;
  is_my_turn: boolean; last_sender_is_me: boolean;
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
        if (profile) {
          const lastSenderIsMe = lastMsg?.[0] ? lastMsg[0].sender_id === myProfile.id : false;
          enriched.push({
            match_id: match.id, profile: { ...profile, photo_url: photos?.[0]?.url || null },
            last_message: lastMsg?.[0]?.content || null, last_message_at: lastMsg?.[0]?.created_at || match.created_at,
            unread: lastMsg?.[0] ? !lastMsg[0].read && lastMsg[0].sender_id !== myProfile.id : false,
            is_my_turn: lastMsg?.[0] ? lastMsg[0].sender_id !== myProfile.id : true,
            last_sender_is_me: lastSenderIsMe,
          });
        }
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

  // Separate new matches (no messages) from conversations, sort by recency
  const newMatches = matches.filter((m) => !m.last_message);
  const conversations = matches
    .filter((m) => m.last_message)
    .sort((a, b) => new Date(b.last_message_at || "").getTime() - new Date(a.last_message_at || "").getTime());

  return (
    <div className="max-w-lg mx-auto min-h-screen">
      <div className="px-5 pt-4 pb-2">
        <h1 className="text-[26px] font-semibold text-gray-900 tracking-tight">Messages</h1>
      </div>

      {loading ? (
        <div className="px-4 space-y-0">
          {/* New matches skeleton */}
          <div className="flex gap-3 px-1 py-4 overflow-hidden">
            {[0,1,2,3].map((i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <div className="w-[60px] h-[60px] rounded-full skeleton" />
                <div className="h-3 w-12 skeleton rounded" />
              </div>
            ))}
          </div>
          {/* Conversation skeleton */}
          {[0,1,2].map((i) => (
            <div key={i} className="flex items-center gap-3.5 px-4 py-4">
              <div className="w-[52px] h-[52px] rounded-full skeleton flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 skeleton rounded-lg" />
                <div className="h-3 w-40 skeleton rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : matches.length === 0 ? (
        <div className="flex flex-col items-center pt-24 px-8 text-center animate-slide-up">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-5">
            <MessageSquare className="w-7 h-7 text-gray-300" strokeWidth={1.5} />
          </div>
          <p className="text-[20px] font-semibold text-gray-900 mb-2 tracking-tight">No matches yet</p>
          <p className="text-gray-400 text-[15px] leading-relaxed">When you and someone like each other,<br />you can chat here.</p>
        </div>
      ) : (
        <div className="animate-fade-in">
          {/* New matches — horizontal scroll like Hinge */}
          {newMatches.length > 0 && (
            <div className="pb-2">
              <p className="px-5 text-[12px] text-gray-400 uppercase tracking-[0.08em] font-medium mb-3">
                New Matches
              </p>
              <div className="flex gap-4 px-5 overflow-x-auto pb-3">
                {newMatches.map((match) => (
                  <Link
                    key={match.match_id}
                    href={`/chat/${match.match_id}`}
                    className="flex flex-col items-center gap-1.5 flex-shrink-0 press"
                  >
                    <div className="relative">
                      {match.profile.photo_url ? (
                        <img
                          src={match.profile.photo_url}
                          alt=""
                          className="w-[64px] h-[64px] rounded-full object-cover ring-2 ring-rose ring-offset-2"
                        />
                      ) : (
                        <div className="w-[64px] h-[64px] rounded-full bg-gray-200 ring-2 ring-rose ring-offset-2" />
                      )}
                    </div>
                    <span className="text-[12px] text-gray-900 font-medium">
                      {match.profile.first_name}
                    </span>
                  </Link>
                ))}
              </div>
              {conversations.length > 0 && <div className="h-px bg-border mx-5" />}
            </div>
          )}

          {/* Conversations */}
          {conversations.length > 0 && (
            <div>
              <p className="px-5 pt-3 text-[12px] text-gray-400 uppercase tracking-[0.08em] font-medium mb-1">
                Messages
              </p>
              <div className="stagger">
                {conversations.map((match) => (
                  <Link
                    key={match.match_id}
                    href={`/chat/${match.match_id}`}
                    className="flex items-center gap-3.5 px-5 py-3.5 press hover:bg-gray-50 transition-colors duration-100"
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      {match.profile.photo_url ? (
                        <img src={match.profile.photo_url} alt="" className="w-[52px] h-[52px] rounded-full object-cover" />
                      ) : (
                        <div className="w-[52px] h-[52px] rounded-full bg-gray-200" />
                      )}
                      {match.unread && (
                        <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-rose border-2 border-surface" />
                      )}
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-[16px] tracking-tight ${match.unread ? "text-gray-900 font-semibold" : "text-gray-900 font-medium"}`}>
                          {match.profile.first_name}
                        </p>
                        <span className={`text-[12px] ${match.unread ? "text-rose font-medium" : "text-gray-400"}`}>
                          {formatTime(match.last_message_at || "")}
                        </span>
                      </div>
                      <p className={`text-[14px] truncate mt-0.5 ${match.unread ? "text-gray-700 font-medium" : "text-gray-400"}`}>
                        {match.last_sender_is_me && <span className="text-gray-400">You: </span>}
                        {match.last_message}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* New matches that have no conversations yet — show as list too if they exist but no conversations section */}
          {newMatches.length > 0 && conversations.length === 0 && (
            <div className="pt-6 px-5 text-center">
              <p className="text-gray-400 text-[14px]">Start a conversation with your matches!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
