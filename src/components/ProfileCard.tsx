"use client";

import { useState } from "react";
import { Heart, X } from "lucide-react";
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

  const sendLike = () => {
    if (!activeHeart) return;
    setExiting(true);
    setTimeout(() => onLike(activeHeart.type, activeHeart.id, comment.trim() || undefined), 200);
  };

  const handleSkip = () => { setExiting(true); setTimeout(() => onSkip(), 200); };

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
          const isOpen = activeHeart?.id === photo.id;
          return (
            <div key={photo.id}>
              <div className="relative mx-4 mt-2">
                <img src={photo.url} alt="" className="w-full aspect-square object-cover rounded-[12px]" draggable={false} />
                {/* Name on first photo */}
                {idx === 0 && (
                  <div className="absolute top-4 left-4">
                    <p className="text-white text-[22px] font-semibold drop-shadow-sm">{profile.first_name}</p>
                  </div>
                )}
                {/* Heart */}
                <button onClick={() => handleHeartTap("photo", photo.id)}
                  className={`absolute bottom-4 right-4 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-150 ${
                    isOpen ? "bg-rose scale-110" : "bg-white"
                  }`} style={{ boxShadow: isOpen ? "none" : "0 2px 8px rgba(0,0,0,0.12)" }}>
                  <Heart className={`w-5 h-5 ${isOpen ? "text-white" : "text-gray-900"}`}
                    strokeWidth={isOpen ? 0 : 1.5} fill={isOpen ? "currentColor" : "none"} />
                </button>
              </div>
              {/* Inline comment */}
              {isOpen && (
                <div className="mx-4 mt-2 animate-fade-in">
                  <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment"
                    rows={2} className="w-full border border-gray-200 rounded-[10px] px-4 py-3 text-[15px] outline-none resize-none placeholder:text-gray-400 bg-surface input-focus" autoFocus />
                  <button onClick={sendLike}
                    className="w-full mt-2 h-[44px] bg-gray-900 text-white rounded-[10px] text-[14px] font-medium press">
                    Send Like
                  </button>
                </div>
              )}
            </div>
          );
        } else {
          const prompt = item.data as (typeof profile.prompts)[0];
          const isOpen = activeHeart?.id === prompt.id;
          return (
            <div key={prompt.id}>
              {/* Prompt — no box, just text with subtle separator */}
              <div className="mx-4 mt-2 bg-surface rounded-[12px] relative">
                <div className="px-5 py-4">
                  <p className="text-[13px] text-gray-400 mb-1">{prompt.question}</p>
                  <p className="text-[18px] text-gray-900 leading-[1.4] pr-10">{prompt.answer}</p>
                </div>
                <button onClick={() => handleHeartTap("prompt", prompt.id)}
                  className={`absolute bottom-4 right-4 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-150 ${
                    isOpen ? "bg-rose scale-110" : "bg-gray-50"
                  }`}>
                  <Heart className={`w-[16px] h-[16px] ${isOpen ? "text-white" : "text-gray-400"}`}
                    strokeWidth={isOpen ? 0 : 1.5} fill={isOpen ? "currentColor" : "none"} />
                </button>
              </div>
              {isOpen && (
                <div className="mx-4 mt-2 animate-fade-in">
                  <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment"
                    rows={2} className="w-full border border-gray-200 rounded-[10px] px-4 py-3 text-[15px] outline-none resize-none placeholder:text-gray-400 bg-surface input-focus" autoFocus />
                  <button onClick={sendLike}
                    className="w-full mt-2 h-[44px] bg-gray-900 text-white rounded-[10px] text-[14px] font-medium press">
                    Send Like
                  </button>
                </div>
              )}
            </div>
          );
        }
      })}

      {/* Vitals — clean list, no boxes */}
      <div className="mx-4 mt-2 bg-surface rounded-[12px]">
        <div className="px-5 py-4">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[14px] text-gray-500">
            {profile.age && <span>{profile.age}</span>}
            {profile.gender && <><span className="text-gray-300">·</span><span>{profile.gender}</span></>}
            {heightDisplay && <><span className="text-gray-300">·</span><span>{heightDisplay}</span></>}
          </div>
          {(profile.major || profile.residence_hall || profile.hometown || profile.graduation_year) && (
            <div className="mt-3 space-y-2">
              {profile.major && <p className="text-[14px] text-gray-900">{profile.major}</p>}
              {profile.residence_hall && <p className="text-[14px] text-gray-500">{profile.residence_hall}</p>}
              {profile.hometown && <p className="text-[14px] text-gray-500">{profile.hometown}</p>}
              {profile.graduation_year && <p className="text-[14px] text-gray-500">Class of {profile.graduation_year}</p>}
            </div>
          )}
        </div>
      </div>

      {/* Skip */}
      <div className="flex justify-center py-8 pb-28">
        <button onClick={handleSkip} className="w-14 h-14 rounded-full bg-surface flex items-center justify-center press"
          style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
          <X className="w-6 h-6 text-gray-400" strokeWidth={1.8} />
        </button>
      </div>
    </div>
  );
}
