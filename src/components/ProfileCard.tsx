"use client";

import { useState } from "react";
import { Heart, MessageCircle, X } from "lucide-react";
import type { ProfileWithContent } from "@/types";

interface ProfileCardProps {
  profile: ProfileWithContent;
  onLike: (contentType: "photo" | "prompt", contentId: string, comment?: string) => void;
  onSkip: () => void;
}

export default function ProfileCard({ profile, onLike, onSkip }: ProfileCardProps) {
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const [animating, setAnimating] = useState<Set<string>>(new Set());
  const [commentingOn, setCommentingOn] = useState<{ type: "photo" | "prompt"; id: string } | null>(null);
  const [comment, setComment] = useState("");
  const [exiting, setExiting] = useState(false);

  const heightDisplay = profile.height_inches
    ? `${Math.floor(profile.height_inches / 12)}'${profile.height_inches % 12}"`
    : null;

  const doLike = (type: "photo" | "prompt", id: string, msg?: string) => {
    if (likedItems.has(id)) return;
    setLikedItems((p) => new Set(p).add(id));
    setAnimating((p) => new Set(p).add(id));
    setTimeout(() => setAnimating((p) => { const n = new Set(p); n.delete(id); return n; }), 450);
    setTimeout(() => { setExiting(true); setTimeout(() => onLike(type, id, msg), 300); }, 500);
  };

  const handleCommentSubmit = () => {
    if (!commentingOn || !comment.trim()) return;
    const c = { ...commentingOn };
    const msg = comment.trim();
    setCommentingOn(null);
    setComment("");
    doLike(c.type, c.id, msg);
  };

  const handleSkip = () => {
    setExiting(true);
    setTimeout(() => onSkip(), 300);
  };

  // Interleave: photo, prompt, photo, prompt...
  const items: Array<{ type: "photo" | "prompt"; data: (typeof profile.photos)[0] | (typeof profile.prompts)[0] }> = [];
  const maxLen = Math.max(profile.photos.length, profile.prompts.length);
  for (let i = 0; i < maxLen; i++) {
    if (profile.photos[i]) items.push({ type: "photo", data: profile.photos[i] });
    if (profile.prompts[i]) items.push({ type: "prompt", data: profile.prompts[i] });
  }

  return (
    <div className={exiting ? "animate-profile-exit" : "animate-profile-enter"}>
      {items.map((item, idx) => {
        if (item.type === "photo") {
          const photo = item.data as (typeof profile.photos)[0];
          const isLiked = likedItems.has(photo.id);
          const isAnim = animating.has(photo.id);
          const isFirst = idx === 0;

          return (
            <div key={photo.id} className="relative">
              <img
                src={photo.url}
                alt=""
                className="w-full aspect-[4/5] object-cover"
                draggable={false}
              />

              {/* Name overlay — first photo only */}
              {isFirst && (
                <div className="absolute bottom-0 left-0 right-0 px-5 pb-14 pt-20 bg-gradient-to-t from-black/50 to-transparent">
                  <div className="flex items-baseline gap-2">
                    <span className="text-white text-[26px] font-bold">{profile.first_name}</span>
                    <span className="text-white/80 text-[24px] font-normal">{profile.age}</span>
                  </div>
                  {(profile.major || profile.hometown) && (
                    <p className="text-white/70 text-[14px] mt-0.5">
                      {profile.major}{profile.major && profile.hometown ? " · " : ""}{profile.hometown}
                    </p>
                  )}
                </div>
              )}

              {/* Action buttons — bottom right of every photo */}
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <button
                  onClick={() => setCommentingOn({ type: "photo", id: photo.id })}
                  className="press w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30"
                >
                  <MessageCircle className="w-[18px] h-[18px] text-white" strokeWidth={2} />
                </button>
                <div className="relative">
                  {isAnim && (
                    <div className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-coral/40 animate-heart-ring" />
                  )}
                  <button
                    onClick={() => doLike("photo", photo.id)}
                    className={`press w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300 ${
                      isLiked
                        ? "bg-coral border-coral"
                        : "bg-white/20 backdrop-blur-sm border-white/30"
                    }`}
                  >
                    <Heart
                      className={`w-[18px] h-[18px] transition-all duration-300 ${isLiked ? "text-white" : "text-white"} ${isAnim ? "animate-heart" : ""}`}
                      strokeWidth={isLiked ? 0 : 2}
                      fill={isLiked ? "currentColor" : "none"}
                    />
                  </button>
                </div>
              </div>
            </div>
          );
        } else {
          // Prompt card — cream background, full width, no border
          const prompt = item.data as (typeof profile.prompts)[0];
          const isLiked = likedItems.has(prompt.id);
          const isAnim = animating.has(prompt.id);

          return (
            <div key={prompt.id} className="bg-cream px-5 py-6 relative">
              <p className="text-[13px] font-semibold text-gray-600 uppercase tracking-wide mb-2">
                {prompt.question}
              </p>
              <p className="font-serif text-[22px] font-bold text-black leading-[1.3]">
                {prompt.answer}
              </p>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-4 justify-end">
                <button
                  onClick={() => setCommentingOn({ type: "prompt", id: prompt.id })}
                  className="press w-9 h-9 rounded-full bg-cream-dark flex items-center justify-center"
                >
                  <MessageCircle className="w-4 h-4 text-gray-700" strokeWidth={2} />
                </button>
                <div className="relative">
                  {isAnim && (
                    <div className="absolute inset-0 m-auto w-9 h-9 rounded-full bg-coral/30 animate-heart-ring" />
                  )}
                  <button
                    onClick={() => doLike("prompt", prompt.id)}
                    className={`press w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isLiked ? "bg-coral" : "bg-cream-dark"
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 transition-all duration-300 ${isLiked ? "text-white" : "text-coral"} ${isAnim ? "animate-heart" : ""}`}
                      strokeWidth={isLiked ? 0 : 2}
                      fill={isLiked ? "currentColor" : "none"}
                    />
                  </button>
                </div>
              </div>
            </div>
          );
        }
      })}

      {/* Vitals section */}
      <div className="px-5 py-5 bg-white">
        <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-3">My vitals</p>
        <div className="flex flex-wrap gap-2">
          {heightDisplay && (
            <span className="px-3 py-1.5 bg-gray-100 rounded-full text-[13px] text-gray-800 font-medium">
              {heightDisplay}
            </span>
          )}
          {profile.graduation_year && (
            <span className="px-3 py-1.5 bg-gray-100 rounded-full text-[13px] text-gray-800 font-medium">
              Class of {profile.graduation_year}
            </span>
          )}
          {profile.dating_intention && (
            <span className="px-3 py-1.5 bg-gray-100 rounded-full text-[13px] text-gray-800 font-medium">
              {profile.dating_intention}
            </span>
          )}
          {profile.hometown && (
            <span className="px-3 py-1.5 bg-gray-100 rounded-full text-[13px] text-gray-800 font-medium">
              {profile.hometown}
            </span>
          )}
          {profile.religion && (
            <span className="px-3 py-1.5 bg-gray-100 rounded-full text-[13px] text-gray-800 font-medium">
              {profile.religion}
            </span>
          )}
          {profile.major && (
            <span className="px-3 py-1.5 bg-gray-100 rounded-full text-[13px] text-gray-800 font-medium">
              {profile.major}
            </span>
          )}
        </div>
      </div>

      {/* Skip (X) button — bottom of entire profile */}
      <div className="flex justify-center py-8 pb-28 bg-white">
        <button
          onClick={handleSkip}
          className="press w-14 h-14 rounded-full border-2 border-gray-300 flex items-center justify-center"
        >
          <X className="w-6 h-6 text-gray-500" strokeWidth={2.5} />
        </button>
      </div>

      {/* Comment bottom sheet */}
      {commentingOn && (
        <div className="fixed inset-0 z-50 flex items-end animate-backdrop">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setCommentingOn(null); setComment(""); }} />
          <div className="relative w-full bg-white rounded-t-2xl px-5 pt-3 pb-8 animate-sheet-up">
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-5" />
            <p className="text-[15px] font-semibold mb-3">Add a comment</p>
            <div className="flex gap-2.5">
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Say something..."
                className="flex-1 h-[44px] bg-gray-100 rounded-full px-4 text-[15px] outline-none input-hinge border border-transparent"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleCommentSubmit()}
              />
              <button
                onClick={handleCommentSubmit}
                disabled={!comment.trim()}
                className={`press w-[44px] h-[44px] rounded-full flex items-center justify-center transition-all duration-200 ${
                  comment.trim() ? "bg-black" : "bg-gray-200"
                }`}
              >
                <Heart className={`w-5 h-5 ${comment.trim() ? "text-white" : "text-gray-400"}`} fill="currentColor" strokeWidth={0} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
