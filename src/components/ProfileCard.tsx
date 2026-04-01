"use client";

import { useState } from "react";
import { Heart, X, Cake, User, Ruler, GraduationCap, Building, Home } from "lucide-react";
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
    if (activeHeart?.id === id) {
      // Toggle off
      setActiveHeart(null);
      setComment("");
    } else {
      setActiveHeart({ type, id });
      setComment("");
    }
  };

  const sendLike = () => {
    if (!activeHeart) return;
    const c = comment.trim() || undefined;
    const { type, id } = activeHeart;
    setActiveHeart(null);
    setComment("");
    setExiting(true);
    setTimeout(() => onLike(type, id, c), 250);
  };

  const handleSkip = () => {
    setExiting(true);
    setTimeout(() => onSkip(), 250);
  };

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
          const isOpen = activeHeart?.id === photo.id;
          return (
            <div key={photo.id}>
              <div className="relative mx-4 mt-3">
                <img src={photo.url} alt="" className="w-full aspect-[4/5] object-cover rounded-[16px]" draggable={false} />
                {/* Heart button */}
                <button onClick={() => handleHeartTap("photo", photo.id)}
                  className={`press absolute bottom-4 right-4 w-11 h-11 rounded-full flex items-center justify-center transition-colors duration-200 ${
                    isOpen ? "bg-accent" : "bg-white"
                  }`} style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>
                  <Heart className={`w-5 h-5 transition-colors duration-200 ${isOpen ? "text-white" : "text-gray-900"}`}
                    strokeWidth={isOpen ? 0 : 1.8} fill={isOpen ? "currentColor" : "none"} />
                </button>
              </div>
              {/* Inline comment area */}
              {isOpen && (
                <div className="mx-4 mt-2 animate-slide-up" style={{ animationDuration: "200ms" }}>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add a comment"
                    rows={3}
                    className="w-full bg-white border border-gray-200 rounded-[14px] px-4 py-3 text-[15px] text-gray-900 outline-none input-focus resize-none placeholder:text-gray-400"
                    autoFocus
                  />
                  <div className="flex gap-2 mt-2">
                    <button onClick={sendLike}
                      className="press flex-1 h-[44px] bg-[#EDE6D8] rounded-[12px] text-[14px] font-medium text-gray-900">
                      Send Like
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        } else {
          const prompt = item.data as (typeof profile.prompts)[0];
          const isOpen = activeHeart?.id === prompt.id;
          return (
            <div key={prompt.id}>
              <div className="mx-4 mt-3 bg-cream rounded-[16px] px-5 py-5 relative">
                <p className="text-[12px] text-gray-500 tracking-wide mb-1.5">{prompt.question}</p>
                <p className="text-[17px] text-gray-900 leading-[1.45]">{prompt.answer}</p>
                {/* Heart button */}
                <button onClick={() => handleHeartTap("prompt", prompt.id)}
                  className={`press absolute bottom-4 right-4 w-9 h-9 rounded-full flex items-center justify-center transition-colors duration-200 ${
                    isOpen ? "bg-accent" : "bg-cream-dark"
                  }`}>
                  <Heart className={`w-4 h-4 transition-colors duration-200 ${isOpen ? "text-white" : "text-gray-600"}`}
                    strokeWidth={isOpen ? 0 : 1.8} fill={isOpen ? "currentColor" : "none"} />
                </button>
              </div>
              {/* Inline comment area */}
              {isOpen && (
                <div className="mx-4 mt-2 animate-slide-up" style={{ animationDuration: "200ms" }}>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add a comment"
                    rows={3}
                    className="w-full bg-white border border-gray-200 rounded-[14px] px-4 py-3 text-[15px] text-gray-900 outline-none input-focus resize-none placeholder:text-gray-400"
                    autoFocus
                  />
                  <div className="flex gap-2 mt-2">
                    <button onClick={sendLike}
                      className="press flex-1 h-[44px] bg-[#EDE6D8] rounded-[12px] text-[14px] font-medium text-gray-900">
                      Send Like
                    </button>
                  </div>
                </div>
              )}
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
          if (profile.hometown) details.push({ icon: Home, value: profile.hometown });
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
    </div>
  );
}
