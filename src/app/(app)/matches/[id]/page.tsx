"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Send } from "lucide-react";

interface ChatMessage { id: string; content: string; sender_id: string; created_at: string; }
interface OtherProfile { first_name: string; photo_url: string | null; }

export default function ChatPage() {
  const supabase = createClient();
  const params = useParams();
  const router = useRouter();
  const matchId = params.id as string;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [myProfileId, setMyProfileId] = useState<string | null>(null);
  const [other, setOther] = useState<OtherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    const { data } = await supabase.from("messages").select("*").eq("match_id", matchId).order("created_at", { ascending: true });
    if (data) setMessages(data);
  }, [supabase, matchId]);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: myProfile } = await supabase.from("profiles").select("id").eq("user_id", user.id).single();
      if (!myProfile) return;
      setMyProfileId(myProfile.id);

      const { data: match } = await supabase.from("matches").select("*").eq("id", matchId).single();
      if (!match) return;
      const otherId = match.profile1_id === myProfile.id ? match.profile2_id : match.profile1_id;
      const { data: op } = await supabase.from("profiles").select("first_name").eq("id", otherId).single();
      const { data: photos } = await supabase.from("photos").select("url").eq("profile_id", otherId).order("position").limit(1);
      setOther({ first_name: op?.first_name || "Match", photo_url: photos?.[0]?.url || null });

      await supabase.from("messages").update({ read: true }).eq("match_id", matchId).neq("sender_id", myProfile.id);
      await fetchMessages();
      setLoading(false);
    };
    init();

    const channel = supabase.channel(`chat-${matchId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
        (payload) => setMessages((prev) => [...prev, payload.new as ChatMessage])
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, matchId, fetchMessages]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!newMessage.trim() || !myProfileId) return;
    const content = newMessage.trim();
    setNewMessage("");
    await supabase.from("messages").insert({ match_id: matchId, sender_id: myProfileId, content });
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin" /></div>;

  return (
    <div className="flex flex-col h-screen max-w-lg mx-auto bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 h-[56px] border-b border-gray-100 bg-white flex-shrink-0">
        <button onClick={() => router.push("/matches")} className="press p-1">
          <ChevronLeft className="w-6 h-6 text-black" strokeWidth={2} />
        </button>
        {other?.photo_url ? (
          <img src={other.photo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center"><span className="text-sm">👤</span></div>
        )}
        <p className="font-bold text-[16px]">{other?.first_name}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {messages.length === 0 && (
          <div className="text-center py-16 animate-fade-in">
            <p className="text-gray-400 text-[14px]">Say hello!</p>
          </div>
        )}
        {messages.map((msg) => {
          const mine = msg.sender_id === myProfileId;
          return (
            <div key={msg.id} className={`flex ${mine ? "justify-end" : "justify-start"} animate-bubble`}>
              <div className={`max-w-[72%] px-4 py-2.5 text-[15px] leading-relaxed ${
                mine
                  ? "bg-black text-white rounded-[20px] rounded-br-[6px]"
                  : "bg-gray-100 text-black rounded-[20px] rounded-bl-[6px]"
              }`}>
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-100 bg-white pb-[max(12px,env(safe-area-inset-bottom))] flex-shrink-0">
        <div className="flex gap-2">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Type a message..."
            className="flex-1 h-[44px] bg-gray-100 rounded-full px-4 text-[15px] outline-none input-hinge border border-transparent"
          />
          <button
            onClick={send}
            disabled={!newMessage.trim()}
            className={`press w-[44px] h-[44px] rounded-full flex items-center justify-center transition-all duration-200 ${
              newMessage.trim() ? "bg-black" : "bg-gray-200"
            }`}
          >
            <Send className={`w-[18px] h-[18px] ${newMessage.trim() ? "text-white" : "text-gray-400"}`} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
