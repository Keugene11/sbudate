"use client";

import { useState } from "react";
import { Heart, X, MessageCircle } from "lucide-react";
import type { ProfileWithContent } from "@/types";

interface ProfileCardProps {
  profile: ProfileWithContent;
  onLike: (contentType: "photo" | "prompt", contentId: string, comment?: string) => void;
  onSkip: () => void;
}

export default function ProfileCard({ profile, onLike, onSkip }: ProfileCardProps) {
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const [commentingOn, setCommentingOn] = useState<{ type: "photo" | "prompt"; id: string } | null>(null);
  const [comment, setComment] = useState("");

  const heightDisplay = profile.height_inches
    ? `${Math.floor(profile.height_inches / 12)}'${profile.height_inches % 12}"`
    : null;

  const handleLike = (type: "photo" | "prompt", id: string) => {
    setLikedItems((prev) => new Set(prev).add(id));
    onLike(type, id);
  };

  const handleCommentSubmit = () => {
    if (commentingOn && comment.trim()) {
      onLike(commentingOn.type, commentingOn.id, comment.trim());
      setLikedItems((prev) => new Set(prev).add(commentingOn.id));
      setCommentingOn(null);
      setComment("");
    }
  };

  // Interleave photos and prompts
  const items: Array<{ type: "photo" | "prompt"; data: typeof profile.photos[0] | typeof profile.prompts[0]; index: number }> = [];
  const maxLen = Math.max(profile.photos.length, profile.prompts.length);
  for (let i = 0; i < maxLen; i++) {
    if (profile.photos[i]) items.push({ type: "photo", data: profile.photos[i], index: i });
    if (profile.prompts[i]) items.push({ type: "prompt", data: profile.prompts[i], index: i });
  }

  return (
    <div className="animate-slide-up">
      {items.map((item, idx) => {
        if (item.type === "photo") {
          const photo = item.data as typeof profile.photos[0];
          return (
            <div key={`photo-${photo.id}`} className="relative">
              {/* Name overlay on first photo */}
              {idx === 0 && (
                <div className="absolute bottom-0 left-0 right-0 z-10 p-5 bg-gradient-to-t from-black/60 to-transparent">
                  <h2 className="text-white text-[28px] font-bold tracking-tight leading-tight">
                    {profile.first_name}, {profile.age}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
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
                className="w-full aspect-[3/4] object-cover"
              />

              {/* Like button */}
              <div className="absolute bottom-4 right-4 flex gap-2 z-20">
                <button
                  onClick={() => setCommentingOn({ type: "photo", id: photo.id })}
                  className="press w-11 h-11 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-lg"
                >
                  <MessageCircle className="w-5 h-5 text-hinge-black" strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => handleLike("photo", photo.id)}
                  className={`press w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-colors ${
                    likedItems.has(photo.id)
                      ? "bg-coral"
                      : "bg-white/90 backdrop-blur"
                  }`}
                >
                  <Heart
                    className={`w-5 h-5 ${likedItems.has(photo.id) ? "text-white animate-heart" : "text-coral"}`}
                    strokeWidth={1.5}
                    fill={likedItems.has(photo.id) ? "currentColor" : "none"}
                  />
                </button>
              </div>
            </div>
          );
        } else {
          const prompt = item.data as typeof profile.prompts[0];
          return (
            <div key={`prompt-${prompt.id}`} className="bg-bg-card mx-4 my-3 rounded-2xl border border-border p-6 relative">
              <p className="text-[12px] uppercase tracking-wider text-dove font-semibold mb-2">
                {prompt.question}
              </p>
              <p className="font-serif text-[22px] font-medium text-hinge-black leading-snug">
                {prompt.answer}
              </p>

              {/* Like button */}
              <div className="flex gap-2 mt-4 justify-end">
                <button
                  onClick={() => setCommentingOn({ type: "prompt", id: prompt.id })}
                  className="press w-10 h-10 rounded-full bg-bg-input flex items-center justify-center"
                >
                  <MessageCircle className="w-4.5 h-4.5 text-hinge-black" strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => handleLike("prompt", prompt.id)}
                  className={`press w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    likedItems.has(prompt.id)
                      ? "bg-coral"
                      : "bg-bg-input"
                  }`}
                >
                  <Heart
                    className={`w-4.5 h-4.5 ${likedItems.has(prompt.id) ? "text-white animate-heart" : "text-coral"}`}
                    strokeWidth={1.5}
                    fill={likedItems.has(prompt.id) ? "currentColor" : "none"}
                  />
                </button>
              </div>
            </div>
          );
        }
      })}

      {/* Vitals section */}
      <div className="mx-4 my-3 bg-bg-card rounded-2xl border border-border p-6">
        <p className="text-[12px] uppercase tracking-wider text-dove font-semibold mb-4">About {profile.first_name}</p>
        <div className="flex flex-wrap gap-2">
          {heightDisplay && (
            <span className="px-3 py-1.5 bg-bg-input rounded-full text-[13px] text-stone font-medium">
              📏 {heightDisplay}
            </span>
          )}
          {profile.hometown && (
            <span className="px-3 py-1.5 bg-bg-input rounded-full text-[13px] text-stone font-medium">
              📍 {profile.hometown}
            </span>
          )}
          {profile.dating_intention && (
            <span className="px-3 py-1.5 bg-bg-input rounded-full text-[13px] text-stone font-medium">
              💜 {profile.dating_intention}
            </span>
          )}
          {profile.religion && (
            <span className="px-3 py-1.5 bg-bg-input rounded-full text-[13px] text-stone font-medium">
              🙏 {profile.religion}
            </span>
          )}
          {profile.drinking && (
            <span className="px-3 py-1.5 bg-bg-input rounded-full text-[13px] text-stone font-medium">
              🍸 {profile.drinking}
            </span>
          )}
          {profile.smoking && (
            <span className="px-3 py-1.5 bg-bg-input rounded-full text-[13px] text-stone font-medium">
              🚬 {profile.smoking}
            </span>
          )}
        </div>
      </div>

      {/* Skip button */}
      <div className="flex justify-center py-6 pb-28">
        <button
          onClick={onSkip}
          className="press w-14 h-14 rounded-full bg-bg-card border border-border flex items-center justify-center shadow-sm"
        >
          <X className="w-7 h-7 text-dove" strokeWidth={1.5} />
        </button>
      </div>

      {/* Comment overlay */}
      {commentingOn && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 animate-fade-in">
          <div className="bg-hinge-white w-full max-w-md rounded-t-2xl p-5 pb-8 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[16px]">Add a comment</h3>
              <button
                onClick={() => { setCommentingOn(null); setComment(""); }}
                className="press p-1"
              >
                <X className="w-5 h-5 text-dove" />
              </button>
            </div>
            <div className="flex gap-3">
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Say something nice..."
                className="flex-1 bg-bg-input border border-border rounded-full px-4 py-3 text-[14px] outline-none focus:border-dove transition-colors"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleCommentSubmit()}
              />
              <button
                onClick={handleCommentSubmit}
                disabled={!comment.trim()}
                className="press w-11 h-11 rounded-full bg-coral flex items-center justify-center disabled:opacity-40"
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
