"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { MessageSquare, ChevronDown } from "lucide-react";

interface MatchWithProfile {
  match_id: string;
  profile: { id: string; first_name: string; age: number; photo_url: string | null; };
  last_message: string | null; last_message_at: string | null; unread: boolean;
  last_sender_is_me: boolean;
  has_received_approved: boolean;
}

export default function MatchesPage() {
  const supabase = createClient();
  const [matches, setMatches] = useState<MatchWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [theirTurnOpen, setTheirTurnOpen] = useState(false);

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

        // Check if I've received at least one approved message from them
        const { data: approvedFromThem } = await supabase
          .from("messages")
          .select("id")
          .eq("match_id", match.id)
          .eq("sender_id", otherId)
          .eq("status", "approved")
          .limit(1);
        const hasReceivedApproved = (approvedFromThem?.length || 0) > 0;

        // Get last message (my own messages + approved from them)
        const { data: allMsgs } = await supabase
          .from("messages")
          .select("content, created_at, sender_id, read, status")
          .eq("match_id", match.id)
          .order("created_at", { ascending: false })
          .limit(20);

        const visibleMsgs = allMsgs?.filter(
          (m) => m.sender_id === myProfile.id || m.status === "approved"
        ) || [];
        const lastMsg = visibleMsgs[0] || null;
        const lastSenderIsMe = lastMsg ? lastMsg.sender_id === myProfile.id : false;

        // Check if I have sent any messages
        const hasSentMessages = allMsgs?.some((m) => m.sender_id === myProfile.id) || false;

        // Only show match if: I've received an approved message, or I've sent messages
        if (!hasReceivedApproved && !hasSentMessages) continue;

        if (profile) {
          enriched.push({
            match_id: match.id,
            profile: { ...profile, photo_url: photos?.[0]?.url || null },
            last_message: lastMsg?.content || null,
            last_message_at: lastMsg?.created_at || match.created_at,
            unread: lastMsg ? !lastMsg.read && lastMsg.sender_id !== myProfile.id : false,
            last_sender_is_me: lastSenderIsMe,
            has_received_approved: hasReceivedApproved,
          });
        }
      }
      setMatches(enriched);
      setLoading(false);
    })();
  }, [supabase]);

  const formatTime = (d: string) => {
    const diff = (Date.now() - new Date(d).getTime()) / 3600000;
    if (diff < 1) return "Now"; if (diff < 24) return `${Math.floor(diff)}h`;
    if (diff < 48) return "Yesterday";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Active: received approved messages AND it's my turn (they sent last)
  const active = matches
    .filter((m) => m.has_received_approved && !m.last_sender_is_me)
    .sort((a, b) => new Date(b.last_message_at || "").getTime() - new Date(a.last_message_at || "").getTime());

  // Their turn: I sent the last message (waiting for reply)
  const theirTurn = matches
    .filter((m) => m.last_sender_is_me)
    .sort((a, b) => new Date(b.last_message_at || "").getTime() - new Date(a.last_message_at || "").getTime());

  const renderMatch = (match: MatchWithProfile) => (
    <Link
      key={match.match_id}
      href={`/chat/${match.match_id}`}
      className="flex items-center gap-3.5 px-5 py-3.5 press hover:bg-gray-50 transition-colors duration-100"
    >
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
          {match.last_message || "Start chatting!"}
        </p>
      </div>
    </Link>
  );

  return (
    <div className="max-w-lg mx-auto min-h-screen animate-tab-in">
      <div className="px-5 pt-4 pb-2">
        <h1 className="text-[26px] font-semibold text-gray-900 tracking-tight">Messages</h1>
      </div>

      {loading ? (
        <div className="px-4 space-y-0">
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
        <div className="flex flex-col items-center pt-20 px-8 text-center animate-slide-up">
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
              <MessageSquare className="w-9 h-9 text-gray-300" strokeWidth={1.5} />
            </div>
          </div>
          <p className="text-[22px] font-semibold text-gray-900 mb-2 tracking-tight">No messages yet</p>
          <p className="text-gray-400 text-[15px] leading-relaxed max-w-[260px]">
            When you and someone like each other, you can start chatting here.
          </p>
        </div>
      ) : (
        <div className="animate-fade-in pb-24">
          {/* Active conversations */}
          {active.length > 0 && (
            <div>
              {active.map(renderMatch)}
            </div>
          )}

          {/* Their turn — collapsed by default */}
          {theirTurn.length > 0 && (
            <div className="mt-2">
              <button
                onClick={() => setTheirTurnOpen(!theirTurnOpen)}
                className="w-full flex items-center justify-between px-5 py-3 press"
              >
                <p className="text-[12px] text-gray-400 uppercase tracking-[0.08em] font-medium">
                  Their turn · {theirTurn.length}
                </p>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${theirTurnOpen ? "rotate-180" : ""}`} strokeWidth={2} />
              </button>
              {theirTurnOpen && (
                <div className="animate-slide-up">
                  {theirTurn.map(renderMatch)}
                </div>
              )}
            </div>
          )}

          {active.length === 0 && !theirTurnOpen && (
            <div className="pt-12 px-5 text-center">
              <p className="text-gray-400 text-[14px]">Waiting for replies</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
