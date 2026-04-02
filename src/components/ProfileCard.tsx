"use client";

import { useState, useRef } from "react";
import { Heart, X, Target, Church, Wine, Cigarette, MoreHorizontal, Flag } from "lucide-react";
import type { ProfileWithContent } from "@/types";

interface ProfileCardProps {
  profile: ProfileWithContent;
  onLike: (contentType: "photo" | "prompt", contentId: string, comment?: string) => void;
  onSkip: () => void;
}

export default function ProfileCard({ profile, onLike, onSkip }: ProfileCardProps) {
  const [activeHeart, setActiveHeart] = useState<{ type: "photo" | "prompt"; id: string } | null>(null);
  const [comment, setComment] = useState("");
  const [exiting, setExiting] = useState(false);

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
      // Double tap detected
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

  // Interleave photos and prompts like Hinge
  const items: Array<{ type: "photo" | "prompt"; data: (typeof profile.photos)[0] | (typeof profile.prompts)[0] }> = [];
  const maxLen = Math.max(profile.photos.length, profile.prompts.length);
  for (let i = 0; i < maxLen; i++) {
    if (profile.photos[i]) items.push({ type: "photo", data: profile.photos[i] });
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

      {items.map((item, idx) => {
        if (item.type === "photo") {
          const photo = item.data as (typeof profile.photos)[0];
          const isOpen = activeHeart?.id === photo.id;
          const isFirst = idx === 0;
          return (
            <div key={photo.id}>
              <div className="relative mx-3 mt-2.5">
                <img
                  src={photo.url}
                  alt=""
                  className="w-full aspect-[4/5] object-cover rounded-[16px]"
                  draggable={false}
                  onClick={() => handleDoubleTap(photo.id)}
                />
                {/* Double-tap heart animation */}
                {doubleTapHeart === photo.id && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <Heart className="w-20 h-20 text-white drop-shadow-lg animate-heart-pop" fill="white" strokeWidth={0} />
                  </div>
                )}
                {/* Name + info overlay on first photo */}
                {isFirst && (
                  <>
                    <div className="absolute inset-0 rounded-[16px] photo-gradient" />
                    {/* Top bar: dating intention + more menu */}
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                      {profile.dating_intention ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/90 glass rounded-full text-[12px] text-gray-700 font-medium">
                          <Target className="w-3 h-3 text-gray-500" strokeWidth={2} />
                          {profile.dating_intention}
                        </span>
                      ) : <div />}
                      <div className="relative">
                        <button
                          onClick={() => setShowMore(!showMore)}
                          className="w-8 h-8 rounded-full bg-black/30 glass flex items-center justify-center press"
                        >
                          <MoreHorizontal className="w-4 h-4 text-white" strokeWidth={2} />
                        </button>
                        {showMore && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowMore(false)} />
                            <div className="absolute right-0 top-10 z-50 bg-surface rounded-2xl py-1.5 w-[160px] animate-scale-in border border-border" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
                              <button
                                onClick={() => setShowMore(false)}
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
                    <div className="absolute bottom-5 left-5 right-16">
                      <h2 className="text-white text-[28px] font-semibold tracking-tight leading-none drop-shadow-sm">
                        {profile.first_name}{profile.age ? `, ${profile.age}` : ""}
                      </h2>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {profile.major && (
                          <span className="text-white/80 text-[14px]">{profile.major}</span>
                        )}
                        {profile.major && (profile.residence_hall || profile.hometown) && (
                          <span className="text-white/40">·</span>
                        )}
                        {profile.residence_hall && (
                          <span className="text-white/70 text-[14px]">{profile.residence_hall}</span>
                        )}
                        {!profile.residence_hall && profile.hometown && (
                          <span className="text-white/70 text-[14px]">{profile.hometown}</span>
                        )}
                      </div>
                    </div>
                  </>
                )}
                {/* Heart button */}
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
              {/* Comment input when heart is active */}
              {isOpen && (
                <div className="mx-3 mt-2.5 animate-slide-up">
                  <div className="bg-surface rounded-[14px] border border-border overflow-hidden">
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
          // Alternate between cream backgrounds for visual variety
          const promptIdx = items.filter((it, ii) => ii < idx && it.type === "prompt").length;
          const promptBg = promptIdx % 2 === 0 ? "bg-cream" : "bg-[#EDE8F5]";
          return (
            <div key={prompt.id}>
              <div className={`mx-3 mt-2.5 ${promptBg} rounded-[16px] relative overflow-hidden`}>
                <div className="px-5 py-5">
                  <p className="text-[12px] font-medium text-gray-500 uppercase tracking-[0.08em] mb-2">
                    {prompt.question}
                  </p>
                  <p className="text-[20px] text-gray-900 leading-[1.35] font-medium pr-10">
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
                  <div className="bg-surface rounded-[14px] border border-border overflow-hidden">
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

      {/* Vitals section */}
      <div className="mx-3 mt-2.5 bg-surface rounded-[16px]">
        <div className="px-5 py-4">
          {/* Quick vitals row */}
          <div className="flex items-center gap-3 flex-wrap">
            {profile.age && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full text-[13px] text-gray-700">
                {profile.age}
              </span>
            )}
            {profile.gender && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full text-[13px] text-gray-700">
                {profile.gender}
              </span>
            )}
            {heightDisplay && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full text-[13px] text-gray-700">
                {heightDisplay}
              </span>
            )}
            {profile.graduation_year && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full text-[13px] text-gray-700">
                Class of {profile.graduation_year}
              </span>
            )}
          </div>
          {/* Detail rows */}
          {(profile.major || profile.residence_hall || profile.hometown) && (
            <div className="mt-3 space-y-2">
              {profile.major && (
                <p className="text-[15px] text-gray-900 font-medium">{profile.major}</p>
              )}
              {profile.residence_hall && (
                <p className="text-[14px] text-gray-500">{profile.residence_hall}</p>
              )}
              {profile.hometown && (
                <p className="text-[14px] text-gray-500">{profile.hometown}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lifestyle section */}
      {(profile.dating_intention || profile.religion || profile.drinking || profile.smoking) && (
        <div className="mx-3 mt-2.5 bg-surface rounded-[16px]">
          <div className="px-5 py-4 space-y-3">
            {profile.dating_intention && (
              <div className="flex items-center gap-3">
                <Target className="w-[18px] h-[18px] text-gray-400 flex-shrink-0" strokeWidth={1.6} />
                <span className="text-[14px] text-gray-700">{profile.dating_intention}</span>
              </div>
            )}
            {profile.religion && (
              <div className="flex items-center gap-3">
                <Church className="w-[18px] h-[18px] text-gray-400 flex-shrink-0" strokeWidth={1.6} />
                <span className="text-[14px] text-gray-700">{profile.religion}</span>
              </div>
            )}
            {profile.drinking && (
              <div className="flex items-center gap-3">
                <Wine className="w-[18px] h-[18px] text-gray-400 flex-shrink-0" strokeWidth={1.6} />
                <span className="text-[14px] text-gray-700">{profile.drinking === "Yes" ? "Drinks" : profile.drinking === "Sometimes" ? "Drinks sometimes" : "Doesn't drink"}</span>
              </div>
            )}
            {profile.smoking && (
              <div className="flex items-center gap-3">
                <Cigarette className="w-[18px] h-[18px] text-gray-400 flex-shrink-0" strokeWidth={1.6} />
                <span className="text-[14px] text-gray-700">{profile.smoking === "Yes" ? "Smokes" : profile.smoking === "Sometimes" ? "Smokes sometimes" : "Doesn't smoke"}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Skip button */}
      <div className="flex justify-center pt-5 pb-8">
        <button
          onClick={handleSkip}
          className="w-14 h-14 rounded-full bg-surface flex items-center justify-center press border border-border"
        >
          <X className="w-6 h-6 text-gray-400" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
