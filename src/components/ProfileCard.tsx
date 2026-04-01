"use client";

import { useState } from "react";
import { Heart, MessageCircle, X, Cake, User, Ruler, MapPin, GraduationCap, Home, Building } from "lucide-react";
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
            <div key={photo.id} className="relative px-3 pt-3">
              <img
                src={photo.url}
                alt=""
                className="w-full aspect-[4/5] object-cover rounded-2xl"
                draggable={false}
              />

              {/* Name overlay — first photo only */}
              {isFirst && (
                <div className="absolute bottom-0 left-3 right-3 px-5 pb-14 pt-20 bg-gradient-to-t from-black/50 to-transparent rounded-b-2xl">
                  <div className="flex items-baseline gap-2">
                    <span className="text-white text-[26px] font-medium">{profile.first_name}</span>
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
              <div className="absolute bottom-6 right-6 flex items-center gap-2">
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
            <div key={prompt.id} className="bg-cream mx-3 mt-3 px-5 py-5 rounded-2xl relative">
              <p className="text-[12px] font-medium text-gray-500 uppercase tracking-[0.1em] mb-1.5">
                {prompt.question}
              </p>
              <p className="text-[18px] font-medium text-black leading-[1.4]">
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

      {/* Vitals — Hinge style cards */}
      <div className="px-4 py-4 bg-white space-y-3">
        {/* Horizontal vitals row */}
        {(() => {
          const vitals: { icon: typeof Cake; value: string }[] = [];
          if (profile.age) vitals.push({ icon: Cake, value: String(profile.age) });
          if (profile.gender) vitals.push({ icon: User, value: profile.gender });
          if (heightDisplay) vitals.push({ icon: Ruler, value: heightDisplay });
          if (profile.hometown) vitals.push({ icon: MapPin, value: profile.hometown });
          return vitals.length > 0 && (
            <div className="bg-[#F8F7F5] rounded-2xl overflow-hidden">
              <div className="flex items-center overflow-x-auto">
                {vitals.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className={`flex items-center gap-2 px-4 py-3.5 flex-shrink-0 ${i < vitals.length - 1 ? "border-r border-gray-200" : ""}`}>
                      <Icon className="w-[18px] h-[18px] text-gray-600" strokeWidth={1.8} />
                      <span className="text-[14px] text-black">{item.value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Detail rows */}
        {(() => {
          const details: { icon: typeof Cake; value: string }[] = [];
          if (profile.major) details.push({ icon: GraduationCap, value: profile.major });
          if (profile.residence_hall) details.push({ icon: Building, value: profile.residence_hall });
          if (profile.hometown) details.push({ icon: Home, value: profile.hometown });
          if (profile.graduation_year) details.push({ icon: GraduationCap, value: `Class of ${profile.graduation_year}` });
          return details.length > 0 && (
            <div className="bg-[#F8F7F5] rounded-2xl overflow-hidden">
              {details.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className={`flex items-center gap-3.5 px-5 py-4 ${i < details.length - 1 ? "border-b border-gray-200" : ""}`}>
                    <Icon className="w-[20px] h-[20px] text-gray-700" strokeWidth={1.8} />
                    <span className="text-[15px] text-black">{item.value}</span>
                  </div>
                );
              })}
            </div>
          );
        })()}
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
            <p className="text-[15px] font-medium mb-3">Add a comment</p>
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
