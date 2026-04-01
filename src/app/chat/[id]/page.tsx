"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Send } from "lucide-react";
import type { ProfileWithContent } from "@/types";

interface ChatMessage { id: string; content: string; sender_id: string; created_at: string; }
interface OtherProfile { id: string; first_name: string; photo_url: string | null; }

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
  const [viewingProfile, setViewingProfile] = useState(false);
  const [otherFullProfile, setOtherFullProfile] = useState<ProfileWithContent | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, []);

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
      setOther({ id: otherId, first_name: op?.first_name || "Match", photo_url: photos?.[0]?.url || null });

      await supabase.from("messages").update({ read: true }).eq("match_id", matchId).neq("sender_id", myProfile.id);
      await fetchMessages();
      setLoading(false);
    };
    init();

    const channel = supabase.channel(`chat-${matchId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, matchId, fetchMessages]);

  useEffect(() => {
    if (!loading) scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  const openProfile = async () => {
    if (!other) return;
    if (otherFullProfile) { setViewingProfile(true); return; }
    const { data: p } = await supabase.from("profiles").select("*").eq("id", other.id).single();
    if (!p) return;
    const [{ data: photos }, { data: prompts }] = await Promise.all([
      supabase.from("photos").select("*").eq("profile_id", other.id).order("position"),
      supabase.from("prompts").select("*").eq("profile_id", other.id).order("position"),
    ]);
    setOtherFullProfile({ ...p, photos: photos || [], prompts: prompts || [] });
    setViewingProfile(true);
  };

  const send = async () => {
    if (!newMessage.trim() || !myProfileId) return;
    const content = newMessage.trim();
    setNewMessage("");

    const optimisticId = `temp-${Date.now()}`;
    setMessages((prev) => [...prev, { id: optimisticId, sender_id: myProfileId, content, created_at: new Date().toISOString() } as ChatMessage]);

    const { data, error } = await supabase.from("messages").insert({ match_id: matchId, sender_id: myProfileId, content }).select().single();
    if (data) {
      setMessages((prev) => prev.map((m) => m.id === optimisticId ? data : m));
    } else if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
    }
  };

  if (loading) return (
    <div className="h-[100dvh] flex items-center justify-center bg-white">
      <div className="w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
    </div>
  );

  // Profile view overlay
  if (viewingProfile && otherFullProfile) {
    const ht = otherFullProfile.height_inches
      ? `${Math.floor(otherFullProfile.height_inches / 12)}'${otherFullProfile.height_inches % 12}"`
      : null;

    return (
      <div className="h-[100dvh] overflow-y-auto bg-white animate-slide-up">
        <div className="max-w-lg mx-auto">
          <div className="sticky top-0 z-10 flex items-center px-4 h-[52px] bg-white/95 backdrop-blur-sm">
            <button onClick={() => setViewingProfile(false)} className="press p-1">
              <ChevronLeft className="w-6 h-6 text-black" strokeWidth={2} />
            </button>
            <p className="ml-3 text-[16px] font-medium">{otherFullProfile.first_name}</p>
          </div>

          {otherFullProfile.photos.map((photo, idx) => (
            <div key={photo.id} className="relative">
              {idx === 0 && (
                <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 pt-16 bg-gradient-to-t from-black/50 to-transparent">
                  <div className="flex items-baseline gap-2">
                    <span className="text-white text-[26px] font-medium">{otherFullProfile.first_name}</span>
                    <span className="text-white/80 text-[24px] font-normal">{otherFullProfile.age}</span>
                  </div>
                  {(otherFullProfile.major || otherFullProfile.hometown) && (
                    <p className="text-white/70 text-[14px] mt-0.5">
                      {otherFullProfile.major}{otherFullProfile.major && otherFullProfile.hometown ? " · " : ""}{otherFullProfile.hometown}
                    </p>
                  )}
                </div>
              )}
              <img src={photo.url} alt="" className="w-full aspect-[4/5] object-cover" draggable={false} />
            </div>
          ))}

          {otherFullProfile.prompts.map((prompt) => (
            <div key={prompt.id} className="bg-cream px-5 py-6">
              <p className="text-[12px] font-medium text-gray-500 uppercase tracking-[0.1em] mb-1.5">{prompt.question}</p>
              <p className="font-serif text-[20px] text-black leading-[1.35]">{prompt.answer}</p>
            </div>
          ))}

          <div className="px-5 py-5 pb-20">
            <p className="text-[12px] font-medium text-gray-500 uppercase tracking-[0.1em] mb-3">About {otherFullProfile.first_name}</p>
            <div className="flex flex-wrap gap-2">
              {ht && <span className="px-3 py-1.5 bg-gray-100 rounded-full text-[13px] text-gray-800 font-medium">{ht}</span>}
              {otherFullProfile.graduation_year && <span className="px-3 py-1.5 bg-gray-100 rounded-full text-[13px] text-gray-800 font-medium">Class of {otherFullProfile.graduation_year}</span>}
              {otherFullProfile.residence_hall && <span className="px-3 py-1.5 bg-gray-100 rounded-full text-[13px] text-gray-800 font-medium">{otherFullProfile.residence_hall}</span>}
              {otherFullProfile.hometown && <span className="px-3 py-1.5 bg-gray-100 rounded-full text-[13px] text-gray-800 font-medium">{otherFullProfile.hometown}</span>}
              {otherFullProfile.major && <span className="px-3 py-1.5 bg-gray-100 rounded-full text-[13px] text-gray-800 font-medium">{otherFullProfile.major}</span>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-white">
      <div className="max-w-lg mx-auto w-full flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-3 px-3 h-[56px] border-b border-gray-100 bg-white flex-shrink-0">
          <button onClick={() => router.push("/matches")} className="press p-1">
            <ChevronLeft className="w-6 h-6 text-black" strokeWidth={2} />
          </button>
          <button onClick={openProfile} className="flex items-center gap-3 press flex-1 min-w-0">
            {other?.photo_url ? (
              <img src={other.photo_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0"><span className="text-sm">👤</span></div>
            )}
            <p className="font-medium text-[16px] truncate">{other?.first_name}</p>
          </button>
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
        <div className="px-4 py-3 border-t border-gray-100 bg-white flex-shrink-0" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
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
    </div>
  );
}
