"use client";

import { useState, useRef } from "react";
import { Heart, X, MessageCircle } from "lucide-react";
import type { ProfileWithContent } from "@/types";

interface ProfileCardProps {
  profile: ProfileWithContent;
  onLike: (contentType: "photo" | "prompt", contentId: string, comment?: string) => void;
  onSkip: () => void;
}

export default function ProfileCard({ profile, onLike, onSkip }: ProfileCardProps) {
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const [animatingItems, setAnimatingItems] = useState<Set<string>>(new Set());
  const [commentingOn, setCommentingOn] = useState<{ type: "photo" | "prompt"; id: string } | null>(null);
  const [comment, setComment] = useState("");
  const [exiting, setExiting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const heightDisplay = profile.height_inches
    ? `${Math.floor(profile.height_inches / 12)}'${profile.height_inches % 12}"`
    : null;

  const triggerLikeAnimation = (id: string) => {
    setAnimatingItems((prev) => new Set(prev).add(id));
    setTimeout(() => {
      setAnimatingItems((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 500);
  };

  const handleLike = (type: "photo" | "prompt", id: string) => {
    if (likedItems.has(id)) return;
    setLikedItems((prev) => new Set(prev).add(id));
    triggerLikeAnimation(id);
    // Small delay so the user sees the heart fill before card exits
    setTimeout(() => {
      setExiting(true);
      setTimeout(() => onLike(type, id), 350);
    }, 400);
  };

  const handleCommentSubmit = () => {
    if (commentingOn && comment.trim()) {
      setLikedItems((prev) => new Set(prev).add(commentingOn.id));
      triggerLikeAnimation(commentingOn.id);
      const c = { ...commentingOn };
      const msg = comment.trim();
      setCommentingOn(null);
      setComment("");
      setTimeout(() => {
        setExiting(true);
        setTimeout(() => onLike(c.type, c.id, msg), 350);
      }, 400);
    }
  };

  const handleSkip = () => {
    setExiting(true);
    setTimeout(() => onSkip(), 350);
  };

  // Interleave photos and prompts
  const items: Array<{ type: "photo" | "prompt"; data: typeof profile.photos[0] | typeof profile.prompts[0]; index: number }> = [];
  const maxLen = Math.max(profile.photos.length, profile.prompts.length);
  for (let i = 0; i < maxLen; i++) {
    if (profile.photos[i]) items.push({ type: "photo", data: profile.photos[i], index: i });
    if (profile.prompts[i]) items.push({ type: "prompt", data: profile.prompts[i], index: i });
  }

  return (
    <div
      ref={cardRef}
      className={exiting ? "animate-profile-exit" : "animate-profile-enter"}
    >
      {items.map((item, idx) => {
        if (item.type === "photo") {
          const photo = item.data as typeof profile.photos[0];
          const isLiked = likedItems.has(photo.id);
          const isAnimating = animatingItems.has(photo.id);
          return (
            <div
              key={`photo-${photo.id}`}
              className="relative overflow-hidden"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              {/* Name overlay on first photo */}
              {idx === 0 && (
                <div className="absolute bottom-0 left-0 right-0 z-10 p-5 bg-gradient-to-t from-black/60 via-black/20 to-transparent">
                  <h2 className="text-white text-[28px] font-bold tracking-tight leading-tight animate-slide-up">
                    {profile.first_name}, {profile.age}
                  </h2>
                  <div className="flex items-center gap-2 mt-1 animate-slide-up" style={{ animationDelay: "80ms" }}>
                    {profile.major && (
                      <span className="text-white/80 text-[14px]">{profile.major}</span>
                    )}
                    {profile.graduation_year && (
                      <span className="text-white/60 text-[14px]">• Class of {profile.graduation_year}</span>
                    )}
                  </div>
                </div>
              )}

              <img
                src={photo.url}
                alt={`${profile.first_name}'s photo`}
                className="w-full aspect-[3/4] object-cover animate-photo-in img-interactive"
                style={{ animationDelay: `${idx * 80}ms` }}
              />

              {/* Like buttons */}
              <div className="absolute bottom-4 right-4 flex gap-2.5 z-20">
                <button
                  onClick={() => setCommentingOn({ type: "photo", id: photo.id })}
                  className="press-sm w-11 h-11 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-black/10"
                >
                  <MessageCircle className="w-5 h-5 text-hinge-black" strokeWidth={1.5} />
                </button>
                <div className="relative">
                  {/* Burst ring */}
                  {isAnimating && (
                    <div className="absolute inset-0 rounded-full bg-coral/30 animate-heart-ring" />
                  )}
                  <button
                    onClick={() => handleLike("photo", photo.id)}
                    className={`press-sm w-11 h-11 rounded-full flex items-center justify-center shadow-lg shadow-black/10 transition-all duration-300 ${
                      isLiked
                        ? "bg-coral scale-100"
                        : "bg-white/90 backdrop-blur-sm"
                    }`}
                  >
                    <Heart
                      className={`w-5 h-5 transition-all duration-300 ${
                        isLiked ? "text-white" : "text-coral"
                      } ${isAnimating ? "animate-heart" : ""}`}
                      strokeWidth={isLiked ? 0 : 1.5}
                      fill={isLiked ? "currentColor" : "none"}
                    />
                  </button>
                </div>
              </div>
            </div>
          );
        } else {
          const prompt = item.data as typeof profile.prompts[0];
          const isLiked = likedItems.has(prompt.id);
          const isAnimating = animatingItems.has(prompt.id);
          return (
            <div
              key={`prompt-${prompt.id}`}
              className="bg-bg-card mx-4 my-3 rounded-2xl border border-border p-6 relative animate-prompt-in card-lift"
              style={{ animationDelay: `${idx * 70}ms` }}
            >
              <p className="text-[12px] uppercase tracking-wider text-dove font-semibold mb-2">
                {prompt.question}
              </p>
              <p className="font-serif text-[22px] font-medium text-hinge-black leading-snug">
                {prompt.answer}
              </p>

              {/* Like buttons */}
              <div className="flex gap-2.5 mt-4 justify-end">
                <button
                  onClick={() => setCommentingOn({ type: "prompt", id: prompt.id })}
                  className="press-sm w-10 h-10 rounded-full bg-bg-input flex items-center justify-center transition-colors duration-200 hover:bg-border"
                >
                  <MessageCircle className="w-[18px] h-[18px] text-hinge-black" strokeWidth={1.5} />
                </button>
                <div className="relative">
                  {isAnimating && (
                    <div className="absolute inset-0 rounded-full bg-coral/25 animate-heart-ring" />
                  )}
                  <button
                    onClick={() => handleLike("prompt", prompt.id)}
                    className={`press-sm w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isLiked
                        ? "bg-coral"
                        : "bg-bg-input hover:bg-border"
                    }`}
                  >
                    <Heart
                      className={`w-[18px] h-[18px] transition-all duration-300 ${
                        isLiked ? "text-white" : "text-coral"
                      } ${isAnimating ? "animate-heart" : ""}`}
                      strokeWidth={isLiked ? 0 : 1.5}
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
      <div
        className="mx-4 my-3 bg-bg-card rounded-2xl border border-border p-6 animate-prompt-in"
        style={{ animationDelay: `${items.length * 70}ms` }}
      >
        <p className="text-[12px] uppercase tracking-wider text-dove font-semibold mb-4">About {profile.first_name}</p>
        <div className="flex flex-wrap gap-2 stagger">
          {heightDisplay && (
            <span className="px-3 py-1.5 bg-bg-input rounded-full text-[13px] text-stone font-medium transition-colors duration-200 hover:bg-border">
              📏 {heightDisplay}
            </span>
          )}
          {profile.hometown && (
            <span className="px-3 py-1.5 bg-bg-input rounded-full text-[13px] text-stone font-medium transition-colors duration-200 hover:bg-border">
              📍 {profile.hometown}
            </span>
          )}
          {profile.dating_intention && (
            <span className="px-3 py-1.5 bg-bg-input rounded-full text-[13px] text-stone font-medium transition-colors duration-200 hover:bg-border">
              💜 {profile.dating_intention}
            </span>
          )}
          {profile.religion && (
            <span className="px-3 py-1.5 bg-bg-input rounded-full text-[13px] text-stone font-medium transition-colors duration-200 hover:bg-border">
              🙏 {profile.religion}
            </span>
          )}
          {profile.drinking && (
            <span className="px-3 py-1.5 bg-bg-input rounded-full text-[13px] text-stone font-medium transition-colors duration-200 hover:bg-border">
              🍸 {profile.drinking}
            </span>
          )}
          {profile.smoking && (
            <span className="px-3 py-1.5 bg-bg-input rounded-full text-[13px] text-stone font-medium transition-colors duration-200 hover:bg-border">
              🚬 {profile.smoking}
            </span>
          )}
        </div>
      </div>

      {/* Skip button */}
      <div className="flex justify-center py-6 pb-28 animate-fade-in" style={{ animationDelay: "300ms" }}>
        <button
          onClick={handleSkip}
          className="press w-14 h-14 rounded-full bg-bg-card border border-border flex items-center justify-center shadow-sm hover:shadow-md transition-shadow duration-300"
        >
          <X className="w-7 h-7 text-dove" strokeWidth={1.5} />
        </button>
      </div>

      {/* Comment overlay */}
      {commentingOn && (
        <div className="fixed inset-0 z-50 flex items-end justify-center animate-backdrop">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => { setCommentingOn(null); setComment(""); }}
          />
          <div className="relative bg-hinge-white w-full max-w-md rounded-t-2xl p-5 pb-8 animate-sheet-up">
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[16px]">Add a comment</h3>
              <button
                onClick={() => { setCommentingOn(null); setComment(""); }}
                className="press-sm p-1.5 rounded-full hover:bg-bg-input transition-colors duration-200"
              >
                <X className="w-5 h-5 text-dove" />
              </button>
            </div>
            <div className="flex gap-3">
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Say something nice..."
                className="flex-1 bg-bg-input border border-border rounded-full px-4 py-3 text-[14px] outline-none input-hinge"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleCommentSubmit()}
              />
              <button
                onClick={handleCommentSubmit}
                disabled={!comment.trim()}
                className={`press-sm w-11 h-11 rounded-full bg-coral flex items-center justify-center transition-all duration-300 ${
                  comment.trim() ? "opacity-100 scale-100" : "opacity-40 scale-95"
                }`}
              >
                <Heart className="w-5 h-5 text-white" fill="white" strokeWidth={0} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
