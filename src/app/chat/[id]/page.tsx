"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, MoreHorizontal, Send, Cake, User, Ruler, MapPin, GraduationCap, Home, Building, Wine, Cigarette, Globe, Flag } from "lucide-react";
import { REPORT_REASONS } from "@/types";
import type { ProfileWithContent } from "@/types";

interface ChatMessage { id: string; content: string; sender_id: string; created_at: string; }
interface OtherProfile { id: string; first_name: string; photo_url: string | null; }

function formatDateSeparator(date: string) {
  const d = new Date(date);
  const now = new Date();
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  const dayDiff = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (dayDiff === 0) return `Today ${h12}:${m} ${ampm}`;
  if (dayDiff === 1) return `Yesterday ${h12}:${m} ${ampm}`;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${d.getDate()} ${h12}:${m} ${ampm}`;
}

function shouldShowDate(messages: ChatMessage[], idx: number) {
  if (idx === 0) return true;
  const prev = new Date(messages[idx - 1].created_at);
  const curr = new Date(messages[idx].created_at);
  return (curr.getTime() - prev.getTime()) > 3600000;
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
  const [showMenu, setShowMenu] = useState(false);
  const [showUnmatchConfirm, setShowUnmatchConfirm] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSent, setReportSent] = useState(false);
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

  const switchToProfile = () => { loadProfile(); setTab("profile"); };

  const handleUnmatch = async () => {
    const res = await fetch("/api/unmatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId }),
    });
    if (!res.ok) console.error("unmatch failed:", await res.json());
    setShowUnmatchConfirm(false);
    router.replace("/matches");
  };

  const submitReport = async () => {
    if (!reportReason || !myProfileId || !other) return;
    await supabase.from("reports").insert({
      reporter_profile_id: myProfileId,
      reported_profile_id: other.id,
      reason: reportReason,
      details: reportDetails.trim() || null,
    });
    setReportSent(true);
    setTimeout(() => { setShowReport(false); setReportSent(false); setReportReason(""); setReportDetails(""); }, 1500);
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
    <div className="h-[100dvh] flex items-center justify-center bg-surface">
      <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
    </div>
  );

  const ht = otherFullProfile?.height_inches
    ? `${Math.floor(otherFullProfile.height_inches / 12)}'${otherFullProfile.height_inches % 12}"`
    : null;

  return (
    <div className="h-[100dvh] flex flex-col bg-surface animate-push-in">
      <div className="max-w-lg mx-auto w-full flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-3 h-[56px] flex-shrink-0 border-b border-border">
          <div className="flex items-center gap-2.5">
            <button onClick={() => router.push("/matches")} className="press p-1.5 -ml-1">
              <ChevronLeft className="w-6 h-6 text-gray-900" strokeWidth={2} />
            </button>
            {/* Avatar in header */}
            <button onClick={switchToProfile} className="flex items-center gap-2.5 press">
              {other?.photo_url ? (
                <img src={other.photo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-200" />
              )}
              <span className="text-[17px] font-semibold text-gray-900">{other?.first_name}</span>
            </button>
          </div>
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="press p-2">
              <MoreHorizontal className="w-5 h-5 text-gray-400" strokeWidth={2} />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-10 z-50 bg-surface rounded-2xl py-1.5 w-[180px] animate-scale-in border border-border" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
                  <button onClick={switchToProfile} className="w-full text-left px-4 py-3 text-[15px] text-gray-900 press">
                    View Profile
                  </button>
                  <div className="h-px bg-border mx-3" />
                  <button onClick={() => { setShowMenu(false); setShowReport(true); }} className="w-full text-left px-4 py-3 text-[15px] text-gray-500 press flex items-center gap-2.5">
                    <Flag className="w-4 h-4" strokeWidth={1.8} />
                    Report
                  </button>
                  <div className="h-px bg-border mx-3" />
                  <button onClick={() => { setShowMenu(false); setShowUnmatchConfirm(true); }} className="w-full text-left px-4 py-3 text-[15px] text-red-500 press">
                    Unmatch
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex items-center flex-shrink-0 px-4">
          <button
            onClick={() => setTab("chat")}
            className={`flex-1 py-3 text-center text-[14px] font-medium transition-all duration-200 border-b-2 ${
              tab === "chat" ? "text-gray-900 border-gray-900" : "text-gray-400 border-transparent"
            }`}
          >
            Chat
          </button>
          <button
            onClick={switchToProfile}
            className={`flex-1 py-3 text-center text-[14px] font-medium transition-all duration-200 border-b-2 ${
              tab === "profile" ? "text-gray-900 border-gray-900" : "text-gray-400 border-transparent"
            }`}
          >
            Profile
          </button>
        </div>

        {tab === "chat" ? (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5">
              {messages.length === 0 && (
                <div className="text-center py-16 animate-fade-in">
                  {other?.photo_url && (
                    <img src={other.photo_url} alt="" className="w-20 h-20 rounded-full object-cover mx-auto mb-4 ring-2 ring-rose/20 ring-offset-2" />
                  )}
                  <p className="text-gray-900 text-[18px] font-semibold mb-1 tracking-tight">You matched!</p>
                  <p className="text-gray-400 text-[14px] mb-6">Start a conversation with {other?.first_name}</p>
                  {/* Conversation starters */}
                  <div className="space-y-2 max-w-[260px] mx-auto">
                    {[
                      `Hey ${other?.first_name}! What made you swipe?`,
                      "What's your go-to campus spot?",
                      "What are you studying?",
                    ].map((starter) => (
                      <button
                        key={starter}
                        onClick={() => setNewMessage(starter)}
                        className="w-full text-left px-4 py-3 bg-gray-50 rounded-2xl text-[14px] text-gray-600 press hover:bg-gray-100 transition-colors"
                      >
                        {starter}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((msg, idx) => {
                const mine = msg.sender_id === myProfileId;
                const showDate = shouldShowDate(messages, idx);
                const isLastFromThem = !mine && (idx === messages.length - 1 || messages[idx + 1]?.sender_id === myProfileId);
                const isLastMessage = idx === messages.length - 1;
                // Check if next message is from same sender for grouping
                const nextSameSender = idx < messages.length - 1 && messages[idx + 1]?.sender_id === msg.sender_id;

                return (
                  <div key={msg.id}>
                    {showDate && (
                      <p className="text-center text-[11px] text-gray-400 py-4 font-medium tracking-wide uppercase">
                        {formatDateSeparator(msg.created_at)}
                      </p>
                    )}
                    <div className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"} ${nextSameSender ? "mb-0.5" : "mb-2"}`}>
                      {!mine && (
                        <div className="w-7 flex-shrink-0">
                          {isLastFromThem && other?.photo_url ? (
                            <img src={other.photo_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                          ) : isLastFromThem ? (
                            <div className="w-7 h-7 rounded-full bg-gray-200" />
                          ) : null}
                        </div>
                      )}
                      <div className={mine ? "flex flex-col items-end" : ""}>
                        <div className={`max-w-[260px] px-4 py-2.5 text-[15px] leading-[1.45] ${
                          mine
                            ? "bg-gray-900 text-white rounded-[20px] rounded-br-[6px]"
                            : "bg-gray-100 text-gray-900 rounded-[20px] rounded-bl-[6px]"
                        }`}>
                          {msg.content}
                        </div>
                        {mine && isLastMessage && (
                          <p className="text-[11px] text-gray-400 mt-1 mr-1">Sent</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 bg-surface flex-shrink-0 border-t border-border" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
              <div className="flex gap-2.5 items-end">
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder="Type a message..."
                  className="flex-1 h-[46px] bg-gray-50 border border-border rounded-full px-5 text-[15px] outline-none input-hinge transition-colors"
                />
                <button
                  onClick={send}
                  disabled={!newMessage.trim()}
                  className={`press w-[46px] h-[46px] rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                    newMessage.trim()
                      ? "bg-gray-900 shadow-md shadow-black/10"
                      : "bg-gray-100"
                  }`}
                >
                  <Send className={`w-[18px] h-[18px] transition-colors ${newMessage.trim() ? "text-white" : "text-gray-400"}`} strokeWidth={2} />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Profile tab */
          <div className="flex-1 overflow-y-auto">
            {!otherFullProfile ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
              </div>
            ) : (
              <div className="px-3 py-4 space-y-2.5 pb-20">
                {/* Vitals pills */}
                {(() => {
                  const vitals: { icon: typeof Cake; value: string }[] = [];
                  if (otherFullProfile.age) vitals.push({ icon: Cake, value: String(otherFullProfile.age) });
                  if (otherFullProfile.gender) vitals.push({ icon: User, value: otherFullProfile.gender });
                  if (ht) vitals.push({ icon: Ruler, value: ht });
                  if (otherFullProfile.hometown) vitals.push({ icon: MapPin, value: otherFullProfile.hometown });
                  return vitals.length > 0 && (
                    <div className="flex flex-wrap gap-2 px-1">
                      {vitals.map((item, i) => {
                        const Icon = item.icon;
                        return (
                          <span key={i} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-50 rounded-full text-[13px] text-gray-700">
                            <Icon className="w-[14px] h-[14px] text-gray-400" strokeWidth={1.8} />
                            {item.value}
                          </span>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* Details card */}
                {(() => {
                  const details: { icon: typeof Cake; value: string }[] = [];
                  if (otherFullProfile.major) details.push({ icon: GraduationCap, value: otherFullProfile.major });
                  if (otherFullProfile.residence_hall) details.push({ icon: Building, value: otherFullProfile.residence_hall });
                  if (otherFullProfile.hometown) details.push({ icon: Home, value: otherFullProfile.hometown });
                  if (otherFullProfile.graduation_year) details.push({ icon: GraduationCap, value: `Class of ${otherFullProfile.graduation_year}` });
                  if (otherFullProfile.ethnicity) details.push({ icon: Globe, value: otherFullProfile.ethnicity });
                  return details.length > 0 && (
                    <div className="bg-gray-50 rounded-2xl overflow-hidden">
                      {details.map((item, i) => {
                        const Icon = item.icon;
                        return (
                          <div key={i} className={`flex items-center gap-3.5 px-5 py-3.5 ${i < details.length - 1 ? "border-b border-gray-100" : ""}`}>
                            <Icon className="w-[18px] h-[18px] text-gray-400" strokeWidth={1.6} />
                            <span className="text-[15px] text-gray-900">{item.value}</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* Lifestyle */}
                {(otherFullProfile.drinking || otherFullProfile.smoking) && (
                  <div className="bg-gray-50 rounded-2xl overflow-hidden">
                    {[
                      { icon: Wine, value: otherFullProfile.drinking ? (otherFullProfile.drinking === "Yes" ? "Drinks" : otherFullProfile.drinking === "Sometimes" ? "Drinks sometimes" : "Doesn't drink") : null },
                      { icon: Cigarette, value: otherFullProfile.smoking ? (otherFullProfile.smoking === "Yes" ? "Smokes" : otherFullProfile.smoking === "Sometimes" ? "Smokes sometimes" : "Doesn't smoke") : null },
                    ].filter((item) => item.value).map((item, i, arr) => {
                      const Icon = item.icon;
                      return (
                        <div key={i} className={`flex items-center gap-3.5 px-5 py-3.5 ${i < arr.length - 1 ? "border-b border-gray-100" : ""}`}>
                          <Icon className="w-[18px] h-[18px] text-gray-400" strokeWidth={1.6} />
                          <span className="text-[15px] text-gray-900">{item.value}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Photos + Prompts interleaved */}
                {(() => {
                  const items: Array<{ type: "photo" | "prompt"; data: (typeof otherFullProfile.photos)[0] | (typeof otherFullProfile.prompts)[0] }> = [];
                  const maxLen = Math.max(otherFullProfile.photos.length, otherFullProfile.prompts.length);
                  for (let i = 0; i < maxLen; i++) {
                    if (otherFullProfile.photos[i]) items.push({ type: "photo", data: otherFullProfile.photos[i] });
                    if (otherFullProfile.prompts[i]) items.push({ type: "prompt", data: otherFullProfile.prompts[i] });
                  }
                  let promptCount = 0;
                  return items.map((item, idx) => {
                    if (item.type === "photo") {
                      const photo = item.data as (typeof otherFullProfile.photos)[0];
                      return (
                        <div key={photo.id} className="relative rounded-2xl overflow-hidden">
                          <img src={photo.url} alt="" className="w-full aspect-square object-cover" draggable={false} />
                          {idx === 0 && (
                            <>
                              <div className="absolute inset-0 photo-gradient" />
                              <div className="absolute bottom-5 left-5">
                                <p className="text-white text-[26px] font-semibold tracking-tight">
                                  {otherFullProfile.first_name}, {otherFullProfile.age}
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    } else {
                      const prompt = item.data as (typeof otherFullProfile.prompts)[0];
                      const bg = promptCount % 2 === 0 ? "bg-gray-50" : "bg-gray-100";
                      promptCount++;
                      return (
                        <div key={prompt.id} className={`${bg} rounded-2xl px-5 py-5`}>
                          <p className="text-[12px] text-gray-500 uppercase tracking-[0.08em] font-medium mb-2">{prompt.question}</p>
                          <p className="text-[18px] text-gray-900 leading-[1.4] font-medium">{prompt.answer}</p>
                        </div>
                      );
                    }
                  });
                })()}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Report modal */}
      {showReport && createPortal(
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40 animate-backdrop" onClick={() => { setShowReport(false); setReportReason(""); setReportDetails(""); }} />
          <div className="relative z-10 bg-surface rounded-t-2xl px-6 py-6 w-full max-w-lg animate-slide-up" style={{ maxHeight: "85vh", overflowY: "auto" }}>
            {reportSent ? (
              <div className="text-center py-8">
                <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                  <Flag className="w-6 h-6 text-green-500" strokeWidth={1.8} />
                </div>
                <p className="text-[18px] font-semibold text-gray-900">Report submitted</p>
                <p className="text-[14px] text-gray-400 mt-1">Thanks for helping keep SBUdate safe.</p>
              </div>
            ) : (
              <>
                <h3 className="text-[18px] font-semibold text-gray-900 mb-1">Report {other?.first_name}</h3>
                <p className="text-[14px] text-gray-400 mb-5">Why are you reporting this person?</p>
                <div className="space-y-2 mb-5">
                  {REPORT_REASONS.map((reason) => (
                    <button key={reason} onClick={() => setReportReason(reason)}
                      className={`press w-full h-[48px] rounded-xl text-[14px] font-medium text-left px-5 transition-all duration-200 ${
                        reportReason === reason ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-700 border border-border"
                      }`}>{reason}</button>
                  ))}
                </div>
                {reportReason && (
                  <div className="mb-5 animate-slide-up">
                    <label className="text-[12px] text-gray-500 font-medium mb-1.5 block">Additional details (optional)</label>
                    <textarea
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                      placeholder="Tell us more..."
                      rows={3}
                      className="w-full bg-gray-50 border border-border rounded-xl px-4 py-3 text-[14px] outline-none resize-none placeholder:text-gray-400 input-hinge transition-colors"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <button onClick={submitReport} disabled={!reportReason}
                    className={`w-full h-[48px] rounded-xl text-[15px] font-semibold press transition-all duration-200 ${
                      reportReason ? "bg-red-500 text-white" : "bg-gray-200 text-gray-400"
                    }`}>
                    Submit Report
                  </button>
                  <button onClick={() => { setShowReport(false); setReportReason(""); setReportDetails(""); }}
                    className="w-full h-[48px] bg-gray-100 text-gray-700 rounded-xl text-[15px] font-medium press">
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Unmatch confirmation dialog */}
      {showUnmatchConfirm && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 animate-backdrop" onClick={() => setShowUnmatchConfirm(false)} />
          <div className="relative z-10 bg-surface rounded-2xl px-6 py-6 mx-6 max-w-[320px] w-full animate-scale-in">
            <h3 className="text-[18px] font-semibold text-gray-900 text-center mb-2">Unmatch {other?.first_name}?</h3>
            <p className="text-[14px] text-gray-400 text-center mb-6 leading-relaxed">
              This will delete your conversation and cannot be undone.
            </p>
            <div className="space-y-2">
              <button
                onClick={handleUnmatch}
                className="w-full h-[48px] bg-red-500 text-white rounded-xl text-[15px] font-semibold press"
              >
                Unmatch
              </button>
              <button
                onClick={() => setShowUnmatchConfirm(false)}
                className="w-full h-[48px] bg-gray-100 text-gray-700 rounded-xl text-[15px] font-medium press"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
