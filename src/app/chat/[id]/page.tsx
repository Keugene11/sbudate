"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, MoreHorizontal, Send } from "lucide-react";
import type { ProfileWithContent } from "@/types";

interface ChatMessage { id: string; content: string; sender_id: string; created_at: string; }
interface OtherProfile { id: string; first_name: string; photo_url: string | null; }

function formatDateSeparator(date: string) {
  const d = new Date(date);
  const now = new Date();
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  const dayDiff = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (dayDiff === 0) return `Today ${h12}:${m}${ampm}`;
  if (dayDiff === 1) return `Yesterday ${h12}:${m}${ampm}`;
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()} ${h12}:${m}${ampm}`;
}

function shouldShowDate(messages: ChatMessage[], idx: number) {
  if (idx === 0) return true;
  const prev = new Date(messages[idx - 1].created_at);
  const curr = new Date(messages[idx].created_at);
  return (curr.getTime() - prev.getTime()) > 3600000; // 1 hour gap
}

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
  const [tab, setTab] = useState<"chat" | "profile">("chat");
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
          setMessages((prev) => prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]);
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, matchId, fetchMessages]);

  useEffect(() => {
    if (!loading && tab === "chat") scrollToBottom();
  }, [messages, loading, tab, scrollToBottom]);

  const loadProfile = async () => {
    if (!other || otherFullProfile) return;
    const { data: p } = await supabase.from("profiles").select("*").eq("id", other.id).single();
    if (!p) return;
    const [{ data: photos }, { data: prompts }] = await Promise.all([
      supabase.from("photos").select("*").eq("profile_id", other.id).order("position"),
      supabase.from("prompts").select("*").eq("profile_id", other.id).order("position"),
    ]);
    setOtherFullProfile({ ...p, photos: photos || [], prompts: prompts || [] });
  };

  const switchToProfile = () => {
    loadProfile();
    setTab("profile");
  };

  const send = async () => {
    if (!newMessage.trim() || !myProfileId) return;
    const content = newMessage.trim();
    setNewMessage("");
    const optimisticId = `temp-${Date.now()}`;
    setMessages((prev) => [...prev, { id: optimisticId, sender_id: myProfileId, content, created_at: new Date().toISOString() } as ChatMessage]);
    const { data, error } = await supabase.from("messages").insert({ match_id: matchId, sender_id: myProfileId, content }).select().single();
    if (data) setMessages((prev) => prev.map((m) => m.id === optimisticId ? data : m));
    else if (error) setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
  };

  if (loading) return (
    <div className="h-[100dvh] flex items-center justify-center bg-white">
      <div className="w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
    </div>
  );

  const ht = otherFullProfile?.height_inches
    ? `${Math.floor(otherFullProfile.height_inches / 12)}'${otherFullProfile.height_inches % 12}"`
    : null;

  return (
    <div className="h-[100dvh] flex flex-col bg-white">
      <div className="max-w-lg mx-auto w-full flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-[52px] flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/matches")} className="press">
              <ChevronLeft className="w-6 h-6 text-black" strokeWidth={2} />
            </button>
            <p className="text-[20px] font-medium">{other?.first_name}</p>
          </div>
          <button className="press p-1">
            <MoreHorizontal className="w-6 h-6 text-black" strokeWidth={2} />
          </button>
        </div>

        {/* Chat / Profile tabs */}
        <div className="flex items-center border-b border-gray-200 flex-shrink-0">
          <button
            onClick={() => setTab("chat")}
            className={`flex-1 py-3 text-center text-[15px] font-medium transition-colors ${
              tab === "chat" ? "text-black border-b-2 border-black" : "text-gray-400"
            }`}
          >
            Chat
          </button>
          <span className="text-gray-300 text-[14px]">/</span>
          <button
            onClick={switchToProfile}
            className={`flex-1 py-3 text-center text-[15px] font-medium transition-colors ${
              tab === "profile" ? "text-black border-b-2 border-black" : "text-gray-400"
            }`}
          >
            Profile
          </button>
        </div>

        {tab === "chat" ? (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
              {messages.length === 0 && (
                <div className="text-center py-16 animate-fade-in">
                  <p className="text-gray-400 text-[14px]">Say hello!</p>
                </div>
              )}
              {messages.map((msg, idx) => {
                const mine = msg.sender_id === myProfileId;
                const showDate = shouldShowDate(messages, idx);
                // Show avatar on received messages when next message is from someone else or is last
                const isLastFromThem = !mine && (idx === messages.length - 1 || messages[idx + 1]?.sender_id === myProfileId);

                return (
                  <div key={msg.id}>
                    {showDate && (
                      <p className="text-center text-[12px] text-gray-400 py-4 font-medium">
                        {formatDateSeparator(msg.created_at)}
                      </p>
                    )}
                    <div className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"} mb-1`}>
                      {/* Avatar for received messages */}
                      {!mine && (
                        <div className="w-8 flex-shrink-0">
                          {isLastFromThem && other?.photo_url ? (
                            <img src={other.photo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : isLastFromThem ? (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center"><span className="text-xs">👤</span></div>
                          ) : null}
                        </div>
                      )}
                      <div className={mine ? "flex flex-col items-end" : ""}>
                        <div className={`max-w-[260px] px-4 py-2.5 text-[15px] leading-relaxed ${
                          mine
                            ? "bg-[#67295F] text-white rounded-[20px] rounded-br-[6px]"
                            : "bg-[#F0F0F0] text-black rounded-[20px] rounded-bl-[6px]"
                        }`}>
                          {msg.content}
                        </div>
                        {mine && idx === messages.length - 1 && (
                          <p className="text-[11px] text-gray-400 mt-0.5 mr-1">Sent</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 bg-white flex-shrink-0" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
              <div className="flex gap-2">
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder="Send a message"
                  className="flex-1 h-[44px] bg-white border border-gray-300 rounded-full px-4 text-[15px] outline-none input-hinge"
                />
                <button
                  onClick={send}
                  disabled={!newMessage.trim()}
                  className={`press w-[44px] h-[44px] rounded-full flex items-center justify-center transition-all duration-200 ${
                    newMessage.trim() ? "bg-[#67295F]" : "bg-gray-100"
                  }`}
                >
                  <Send className={`w-[18px] h-[18px] ${newMessage.trim() ? "text-white" : "text-gray-400"}`} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Profile tab */
          <div className="flex-1 overflow-y-auto">
            {!otherFullProfile ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
