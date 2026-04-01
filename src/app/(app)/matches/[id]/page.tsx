"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Send } from "lucide-react";

interface ChatMessage {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
}

interface OtherProfile {
  first_name: string;
  photo_url: string | null;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = useCallback(async () => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("match_id", matchId)
      .order("created_at", { ascending: true });

    if (data) setMessages(data);
  }, [supabase, matchId]);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: myProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!myProfile) return;
      setMyProfileId(myProfile.id);

      const { data: match } = await supabase
        .from("matches")
        .select("*")
        .eq("id", matchId)
        .single();

      if (!match) return;

      const otherId = match.profile1_id === myProfile.id ? match.profile2_id : match.profile1_id;
      const { data: otherProfile } = await supabase
        .from("profiles")
        .select("first_name")
        .eq("id", otherId)
        .single();

      const { data: photos } = await supabase
        .from("photos")
        .select("url")
        .eq("profile_id", otherId)
        .order("position")
        .limit(1);

      setOther({
        first_name: otherProfile?.first_name || "Match",
        photo_url: photos?.[0]?.url || null,
      });

      // Mark messages as read
      await supabase
        .from("messages")
        .update({ read: true })
        .eq("match_id", matchId)
        .neq("sender_id", myProfile.id);

      await fetchMessages();
      setLoading(false);
    };

    init();

    // Subscribe to new messages
    const channel = supabase
      .channel(`chat-${matchId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, matchId, fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !myProfileId) return;

    const content = newMessage.trim();
    setNewMessage("");

    await supabase.from("messages").insert({
      match_id: matchId,
      sender_id: myProfileId,
      content,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-border border-t-hinge-black rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-hinge-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-hinge-white/90 backdrop-blur-md">
        <button onClick={() => router.push("/matches")} className="press p-1">
          <ChevronLeft className="w-6 h-6 text-hinge-black" />
        </button>
        {other?.photo_url ? (
          <img src={other.photo_url} alt="" className="w-9 h-9 rounded-full object-cover" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-bg-input flex items-center justify-center">
            <span className="text-[16px]">👤</span>
          </div>
        )}
        <h2 className="font-semibold text-[16px] text-hinge-black">{other?.first_name}</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-12 animate-fade-in">
            <p className="text-dove text-[14px]">Say hello to start the conversation!</p>
          </div>
        )}
        {messages.map((msg) => {
          const isMine = msg.sender_id === myProfileId;
          return (
            <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"} animate-bubble`}>
              <div
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed transition-all duration-200 ${
                  isMine
                    ? "bg-hinge-black text-white rounded-br-md"
                    : "bg-bg-input text-hinge-black rounded-bl-md"
                }`}
              >
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border bg-hinge-white pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex gap-2">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 bg-bg-input border border-border rounded-full px-4 py-2.5 text-[14px] outline-none input-hinge"
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="press-sm w-10 h-10 rounded-full bg-hinge-black flex items-center justify-center disabled:opacity-30 transition-opacity duration-200"
          >
            <Send className="w-4.5 h-4.5 text-white" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
