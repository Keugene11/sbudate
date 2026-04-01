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
    setTimeout(() => setAnimating((p) => { const n = new Set(p); n.delete(id); return n; }), 400);
    setTimeout(() => { setExiting(true); setTimeout(() => onLike(type, id, msg), 250); }, 450);
  };

  const handleCommentSubmit = () => {
    if (!commentingOn || !comment.trim()) return;
    const c = { ...commentingOn }; const msg = comment.trim();
    setCommentingOn(null); setComment("");
    doLike(c.type, c.id, msg);
  };

  const handleSkip = () => { setExiting(true); setTimeout(() => onSkip(), 250); };

  const items: Array<{ type: "photo" | "prompt"; data: (typeof profile.photos)[0] | (typeof profile.prompts)[0] }> = [];
  const maxLen = Math.max(profile.photos.length, profile.prompts.length);
  for (let i = 0; i < maxLen; i++) {
    if (profile.photos[i]) items.push({ type: "photo", data: profile.photos[i] });
    if (profile.prompts[i]) items.push({ type: "prompt", data: profile.prompts[i] });
  }

  return (
    <div className={exiting ? "animate-profile-exit" : "animate-profile-enter"}>
      {items.map((item) => {
        if (item.type === "photo") {
          const photo = item.data as (typeof profile.photos)[0];
          const isLiked = likedItems.has(photo.id);
          const isAnim = animating.has(photo.id);
          return (
            <div key={photo.id} className="relative mx-4 mt-3">
              <img src={photo.url} alt="" className="w-full aspect-[4/5] object-cover rounded-[16px]" draggable={false} />
              <div className="absolute bottom-4 right-4 flex items-center gap-2">
                <button onClick={() => setCommentingOn({ type: "photo", id: photo.id })}
                  className="press w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                  <MessageCircle className="w-[17px] h-[17px] text-gray-900" strokeWidth={1.8} />
                </button>
                <div className="relative">
                  {isAnim && <div className="absolute inset-0 rounded-full bg-accent/30 animate-heart-ring" />}
                  <button onClick={() => doLike("photo", photo.id)}
                    className={`press w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200 ${isLiked ? "bg-accent" : "bg-white/90 backdrop-blur-sm"}`}
                    style={isLiked ? {} : { boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                    <Heart className={`w-[17px] h-[17px] transition-colors duration-200 ${isLiked ? "text-white" : "text-accent"} ${isAnim ? "animate-heart" : ""}`}
                      strokeWidth={isLiked ? 0 : 1.8} fill={isLiked ? "currentColor" : "none"} />
                  </button>
                </div>
              </div>
            </div>
          );
        } else {
          const prompt = item.data as (typeof profile.prompts)[0];
          const isLiked = likedItems.has(prompt.id);
          const isAnim = animating.has(prompt.id);
          return (
            <div key={prompt.id} className="mx-4 mt-3 bg-cream rounded-[16px] px-5 py-5 relative">
              <p className="text-[12px] text-gray-500 tracking-wide mb-1.5">{prompt.question}</p>
              <p className="text-[17px] text-gray-900 leading-[1.45]">{prompt.answer}</p>
              <div className="flex items-center gap-2 mt-4 justify-end">
                <button onClick={() => setCommentingOn({ type: "prompt", id: prompt.id })}
                  className="press w-9 h-9 rounded-full bg-cream-dark flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-gray-600" strokeWidth={1.8} />
                </button>
                <div className="relative">
                  {isAnim && <div className="absolute inset-0 rounded-full bg-accent/25 animate-heart-ring" />}
                  <button onClick={() => doLike("prompt", prompt.id)}
                    className={`press w-9 h-9 rounded-full flex items-center justify-center transition-colors duration-200 ${isLiked ? "bg-accent" : "bg-cream-dark"}`}>
                    <Heart className={`w-4 h-4 transition-colors duration-200 ${isLiked ? "text-white" : "text-accent"} ${isAnim ? "animate-heart" : ""}`}
                      strokeWidth={isLiked ? 0 : 1.8} fill={isLiked ? "currentColor" : "none"} />
                  </button>
                </div>
              </div>
            </div>
          );
        }
      })}

      {/* Vitals */}
      <div className="mx-4 mt-3 space-y-2">
        {(() => {
          const vitals: { icon: typeof Cake; value: string }[] = [];
          if (profile.age) vitals.push({ icon: Cake, value: String(profile.age) });
          if (profile.gender) vitals.push({ icon: User, value: profile.gender });
          if (heightDisplay) vitals.push({ icon: Ruler, value: heightDisplay });
          if (profile.hometown) vitals.push({ icon: MapPin, value: profile.hometown });
          return vitals.length > 0 ? (
            <div className="bg-gray-50 rounded-[16px] overflow-hidden">
              <div className="flex items-center overflow-x-auto">
                {vitals.map((item, i) => { const Icon = item.icon; return (
                  <div key={i} className={`flex items-center gap-2 px-4 py-3 flex-shrink-0 ${i < vitals.length - 1 ? "border-r border-gray-200" : ""}`}>
                    <Icon className="w-4 h-4 text-gray-500" strokeWidth={1.6} />
                    <span className="text-[14px] text-gray-900">{item.value}</span>
                  </div>
                ); })}
              </div>
            </div>
          ) : null;
        })()}
        {(() => {
          const details: { icon: typeof Cake; value: string }[] = [];
          if (profile.major) details.push({ icon: GraduationCap, value: profile.major });
          if (profile.residence_hall) details.push({ icon: Building, value: profile.residence_hall });
          if (profile.graduation_year) details.push({ icon: GraduationCap, value: `Class of ${profile.graduation_year}` });
          return details.length > 0 ? (
            <div className="bg-gray-50 rounded-[16px] overflow-hidden">
              {details.map((item, i) => { const Icon = item.icon; return (
                <div key={i} className={`flex items-center gap-3 px-5 py-3.5 ${i < details.length - 1 ? "border-b border-gray-200" : ""}`}>
                  <Icon className="w-[18px] h-[18px] text-gray-500" strokeWidth={1.6} />
                  <span className="text-[14px] text-gray-900">{item.value}</span>
                </div>
              ); })}
            </div>
          ) : null;
        })()}
      </div>

      {/* Skip */}
      <div className="flex justify-center py-8 pb-28">
        <button onClick={handleSkip} className="press w-14 h-14 rounded-full border border-gray-200 flex items-center justify-center"
          style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
          <X className="w-6 h-6 text-gray-400" strokeWidth={2} />
        </button>
      </div>

      {/* Comment sheet */}
      {commentingOn && (
        <div className="fixed inset-0 z-50 flex items-end animate-backdrop">
          <div className="absolute inset-0 bg-black/30" onClick={() => { setCommentingOn(null); setComment(""); }} />
          <div className="relative w-full max-w-lg mx-auto bg-white rounded-t-[20px] px-5 pt-3 pb-8 animate-sheet-up">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <p className="text-[15px] font-medium text-gray-900 mb-3">Add a comment</p>
            <div className="flex gap-2.5">
              <input value={comment} onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCommentSubmit()}
                placeholder="Say something..."
                className="flex-1 h-[48px] bg-gray-100 rounded-[12px] px-4 text-[15px] outline-none input-focus" autoFocus />
              <button onClick={handleCommentSubmit} disabled={!comment.trim()}
                className={`press w-[48px] h-[48px] rounded-[12px] flex items-center justify-center transition-all duration-200 ${comment.trim() ? "bg-gray-900" : "bg-gray-100"}`}>
                <Heart className={`w-5 h-5 ${comment.trim() ? "text-white" : "text-gray-400"}`} fill="currentColor" strokeWidth={0} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
