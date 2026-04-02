"use client";

import { useState, useRef } from "react";
import { Heart, X, Wine, Cigarette, MoreHorizontal, Flag, GraduationCap, Cake, User, Ruler, Calendar, Briefcase, Home, Globe } from "lucide-react";
import type { ProfileWithContent } from "@/types";
import { REPORT_REASONS } from "@/types";
import { createClient } from "@/lib/supabase/client";

interface ProfileCardProps {
  profile: ProfileWithContent;
  myProfileId?: string;
  onLike: (contentType: "photo" | "prompt", contentId: string, comment?: string) => void;
  onSkip: () => void;
}

export default function ProfileCard({ profile, myProfileId, onLike, onSkip }: ProfileCardProps) {
  const [activeHeart, setActiveHeart] = useState<{ type: "photo" | "prompt"; id: string } | null>(null);
  const [comment, setComment] = useState("");
  const [exiting, setExiting] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSent, setReportSent] = useState(false);

  const heightDisplay = profile.height_inches
    ? `${Math.floor(profile.height_inches / 12)}'${profile.height_inches % 12}"`
    : null;

  const handleHeartTap = (type: "photo" | "prompt", id: string) => {
    if (activeHeart?.id === id) { setActiveHeart(null); setComment(""); }
    else { setActiveHeart({ type, id }); setComment(""); }
  };

  const [likeSent, setLikeSent] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [doubleTapHeart, setDoubleTapHeart] = useState<string | null>(null);
  const lastTapRef = useRef<{ id: string; time: number } | null>(null);

  const handleDoubleTap = (photoId: string) => {
    const now = Date.now();
    if (lastTapRef.current && lastTapRef.current.id === photoId && now - lastTapRef.current.time < 300) {
      handleHeartTap("photo", photoId);
      setDoubleTapHeart(photoId);
      setTimeout(() => setDoubleTapHeart(null), 600);
      lastTapRef.current = null;
    } else {
      lastTapRef.current = { id: photoId, time: now };
    }
  };

  const sendLike = () => {
    if (!activeHeart) return;
    setLikeSent(true);
    setTimeout(() => {
      setExiting(true);
      setTimeout(() => onLike(activeHeart.type, activeHeart.id, comment.trim() || undefined), 250);
    }, 400);
  };

  const handleSkip = () => { setExiting(true); setTimeout(() => onSkip(), 250); };

  const submitReport = async () => {
    if (!reportReason || !myProfileId) return;
    const supabase = createClient();
    await supabase.from("reports").insert({
      reporter_profile_id: myProfileId,
      reported_profile_id: profile.id,
      reason: reportReason,
      details: reportDetails.trim() || null,
    });
    setReportSent(true);
    setTimeout(() => { setShowReport(false); setReportSent(false); setReportReason(""); setReportDetails(""); }, 1500);
  };

  // Interleave photos and prompts like Hinge
  const photos = profile.photos.slice(0, 6);
  const items: Array<{ type: "photo" | "prompt"; data: (typeof profile.photos)[0] | (typeof profile.prompts)[0] }> = [];
  const maxLen = Math.max(photos.length, profile.prompts.length);
  for (let i = 0; i < maxLen; i++) {
    if (photos[i]) items.push({ type: "photo", data: photos[i] });
    if (profile.prompts[i]) items.push({ type: "prompt", data: profile.prompts[i] });
  }

  const totalItems = items.length + 1; // +1 for vitals section

  return (
    <div className={`${exiting ? "animate-profile-exit" : "animate-profile-enter"} ${likeSent ? "animate-like-flash" : ""}`}>
      {/* Content progress dots */}
      <div className="flex justify-center gap-1 px-4 py-2">
        {Array.from({ length: totalItems }, (_, i) => (
          <div key={i} className="h-[3px] flex-1 max-w-[28px] rounded-full bg-gray-300" />
        ))}
      </div>

      {/* Name header — Hinge style */}
      <div className="flex items-center justify-between px-5 pt-1 pb-2">
        <h2 className="text-[20px] font-semibold text-gray-900 tracking-tight">{profile.first_name}</h2>
        <div className="relative">
          <button
            onClick={() => setShowMore(!showMore)}
            className="w-8 h-8 rounded-full flex items-center justify-center press hover:bg-gray-100 transition-colors"
          >
            <MoreHorizontal className="w-5 h-5 text-gray-900" strokeWidth={2} />
          </button>
          {showMore && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMore(false)} />
              <div className="absolute right-0 top-10 z-50 bg-surface rounded-2xl py-1.5 w-[160px] animate-scale-in border border-border" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
                <button
                  onClick={() => { setShowMore(false); setShowReport(true); }}
                  className="w-full text-left px-4 py-3 text-[14px] text-gray-400 press flex items-center gap-2.5"
                >
                  <Flag className="w-4 h-4" strokeWidth={1.8} />
                  Report
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {items.map((item, idx) => {
        if (item.type === "photo") {
          const photo = item.data as (typeof profile.photos)[0];
          const isOpen = activeHeart?.id === photo.id;
          return (
            <div key={photo.id}>
              <div className="relative mx-3 mt-2.5">
                <img
                  src={photo.url}
                  alt=""
                  className="w-full aspect-square object-cover rounded-[16px] shadow-photo"
                  draggable={false}
                  onClick={() => handleDoubleTap(photo.id)}
                />
                {doubleTapHeart === photo.id && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <Heart className="w-20 h-20 text-white drop-shadow-lg animate-heart-pop" fill="white" strokeWidth={0} />
                  </div>
                )}
                <button
                  onClick={() => handleHeartTap("photo", photo.id)}
                  className={`absolute bottom-4 right-4 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
                    isOpen
                      ? "bg-rose scale-110 shadow-lg shadow-rose/30"
                      : "bg-white/95 shadow-md"
                  }`}
                >
                  <Heart
                    className={`w-[22px] h-[22px] transition-colors duration-150 ${
                      isOpen ? "text-white" : "text-gray-800"
                    } ${isOpen ? "animate-heart-pop" : ""}`}
                    strokeWidth={isOpen ? 0 : 1.5}
                    fill={isOpen ? "currentColor" : "none"}
                  />
                </button>
              </div>
              {isOpen && (
                <div className="mx-3 mt-2.5 animate-slide-up">
                  <div className="bg-surface rounded-[14px] border border-border shadow-soft overflow-hidden">
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Add a comment..."
                      rows={2}
                      className="w-full px-4 py-3 text-[15px] outline-none resize-none placeholder:text-gray-400 bg-transparent"
                      autoFocus
                    />
                    <div className="px-3 pb-3">
                      <button
                        onClick={sendLike}
                        className="w-full h-[44px] bg-gray-900 text-white rounded-xl text-[14px] font-medium press tracking-wide"
                      >
                        {likeSent ? "Sent!" : "Send Like"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        } else {
          const prompt = item.data as (typeof profile.prompts)[0];
          const isOpen = activeHeart?.id === prompt.id;
          const promptIdx = items.filter((it, ii) => ii < idx && it.type === "prompt").length;
          const promptBg = "bg-surface";
          return (
            <div key={prompt.id}>
              <div className={`mx-3 mt-2.5 ${promptBg} rounded-[16px] border border-border shadow-card relative overflow-hidden`}>
                <div className="px-6 pt-7 pb-14">
                  <p className="text-[12px] font-medium text-gray-500 uppercase tracking-[0.08em] mb-3">
                    {prompt.question}
                  </p>
                  <p className="text-[24px] text-gray-900 leading-[1.4] font-medium">
                    {prompt.answer}
                  </p>
                </div>
                <button
                  onClick={() => handleHeartTap("prompt", prompt.id)}
                  className={`absolute bottom-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                    isOpen
                      ? "bg-rose scale-110 shadow-lg shadow-rose/30"
                      : "bg-white shadow-sm"
                  }`}
                >
                  <Heart
                    className={`w-[17px] h-[17px] transition-colors duration-150 ${
                      isOpen ? "text-white" : "text-gray-400"
                    } ${isOpen ? "animate-heart-pop" : ""}`}
                    strokeWidth={isOpen ? 0 : 1.5}
                    fill={isOpen ? "currentColor" : "none"}
                  />
                </button>
              </div>
              {isOpen && (
                <div className="mx-3 mt-2.5 animate-slide-up">
                  <div className="bg-surface rounded-[14px] border border-border shadow-soft overflow-hidden">
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Add a comment..."
                      rows={2}
                      className="w-full px-4 py-3 text-[15px] outline-none resize-none placeholder:text-gray-400 bg-transparent"
                      autoFocus
                    />
                    <div className="px-3 pb-3">
                      <button
                        onClick={sendLike}
                        className="w-full h-[44px] bg-gray-900 text-white rounded-xl text-[14px] font-medium press tracking-wide"
                      >
                        {likeSent ? "Sent!" : "Send Like"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        }
      })}

      {/* Vitals section — Hinge style card */}
      <div className="mx-3 mt-2.5 bg-surface rounded-[16px] border border-border shadow-card overflow-hidden">
        {/* Top row — quick stats with icon dividers */}
        {(() => {
          const pills: { icon: typeof Cake; value: string }[] = [];
          if (profile.age) pills.push({ icon: Cake, value: String(profile.age) });
          if (profile.gender) pills.push({ icon: User, value: profile.gender });
          if (heightDisplay) pills.push({ icon: Ruler, value: heightDisplay });
          if (profile.graduation_year) pills.push({ icon: Calendar, value: `Class of ${profile.graduation_year}` });
          return pills.length > 0 ? (
            <div className="flex items-center overflow-x-auto">
              {pills.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-center">
                    <div className="flex items-center gap-2.5 px-4 py-3.5 flex-shrink-0">
                      <Icon className="w-[18px] h-[18px] text-gray-900" strokeWidth={1.5} />
                      <span className="text-[15px] text-gray-900 whitespace-nowrap">{item.value}</span>
                    </div>
                    {i < pills.length - 1 && <div className="w-px h-5 bg-gray-200 flex-shrink-0" />}
                  </div>
                );
              })}
            </div>
          ) : null;
        })()}

        {/* Detail rows with icons and dividers */}
        {(() => {
          const details: { icon: typeof Briefcase; value: string }[] = [];
          if (profile.major) details.push({ icon: Briefcase, value: profile.major });
          if (profile.residence_hall) details.push({ icon: Home, value: profile.residence_hall });
          if (profile.hometown) details.push({ icon: Home, value: profile.hometown });
          if (profile.ethnicity) details.push({ icon: Globe, value: profile.ethnicity });
          if (profile.drinking) details.push({ icon: Wine, value: profile.drinking === "Yes" ? "Drinks" : profile.drinking === "Sometimes" ? "Drinks sometimes" : "Doesn't drink" });
          if (profile.smoking) details.push({ icon: Cigarette, value: profile.smoking === "Yes" ? "Smokes" : profile.smoking === "Sometimes" ? "Smokes sometimes" : "Doesn't smoke" });
          return details.length > 0 ? (
            <>
              {details.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i}>
                    <div className="h-px bg-gray-100 mx-4" />
                    <div className="flex items-center gap-3.5 px-5 py-3.5">
                      <Icon className="w-[18px] h-[18px] text-gray-900 flex-shrink-0" strokeWidth={1.5} />
                      <span className="text-[15px] text-gray-900">{item.value}</span>
                    </div>
                  </div>
                );
              })}
            </>
          ) : null;
        })()}
      </div>

      {/* Skip button */}
      <div className="flex justify-center pt-5 pb-8">
        <button
          onClick={handleSkip}
          className="w-14 h-14 rounded-full bg-surface flex items-center justify-center press border border-border shadow-card-hover"
        >
          <X className="w-6 h-6 text-gray-400" strokeWidth={1.5} />
        </button>
      </div>

      {/* Report modal */}
      {showReport && (
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
                <h3 className="text-[18px] font-semibold text-gray-900 mb-1">Report {profile.first_name}</h3>
                <p className="text-[14px] text-gray-400 mb-5">Why are you reporting this profile?</p>
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
        </div>
      )}
    </div>
  );
}
