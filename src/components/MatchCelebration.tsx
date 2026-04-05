"use client";

import { useEffect, useState } from "react";
import { Heart, MessageCircle } from "lucide-react";

interface MatchCelebrationProps {
  name: string;
  photoUrl: string | null;
  onChat: () => void;
  onKeepBrowsing: () => void;
}

function FloatingHeart({ delay, x, size }: { delay: number; x: number; size: number }) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${x}%`,
        bottom: "40%",
        animation: `float-up ${2 + Math.random()}s ease-out ${delay}ms forwards`,
        opacity: 0,
      }}
    >
      <Heart
        className="text-white/60"
        style={{ width: size, height: size }}
        fill="currentColor"
        strokeWidth={0}
      />
    </div>
  );
}

export default function MatchCelebration({ name, photoUrl, onChat, onKeepBrowsing }: MatchCelebrationProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setShow(true));
  }, []);

  // Generate random floating hearts
  const hearts = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    delay: i * 150 + Math.random() * 200,
    x: 10 + Math.random() * 80,
    size: 12 + Math.random() * 16,
  }));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/65 transition-opacity duration-500"
        style={{ opacity: show ? 1 : 0 }}
        onClick={onKeepBrowsing}
      />

      {/* Floating hearts */}
      {show && hearts.map((h) => (
        <FloatingHeart key={h.id} delay={h.delay} x={h.x} size={h.size} />
      ))}

      {/* Content */}
      <div
        className="relative z-10 flex flex-col items-center px-8 text-center transition-all duration-600"
        style={{
          opacity: show ? 1 : 0,
          transform: show ? "translateY(0) scale(1)" : "translateY(32px) scale(0.9)",
          transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Photo with heart badge */}
        <div className="relative mb-7">
          <div className="relative">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt=""
                className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-2xl"
              />
            ) : (
              <div className="w-28 h-28 rounded-full bg-gray-300 border-4 border-white shadow-2xl" />
            )}
            {/* Glow ring */}
            <div className="absolute inset-0 rounded-full border-4 border-white/30 scale-[1.15]" style={{ animation: "gentle-pulse 2s ease-in-out infinite" }} />
          </div>
          <div className="absolute -top-1 -right-1 w-11 h-11 bg-foreground rounded-full flex items-center justify-center shadow-lg animate-heart-pop border-2 border-white">
            <Heart className="w-5 h-5 text-white" fill="white" strokeWidth={0} />
          </div>
        </div>

        <h2 className="text-white text-[30px] font-bold tracking-tight mb-2">
          It&apos;s a Match!
        </h2>
        <p className="text-white/65 text-[15px] mb-9">
          You and {name} liked each other
        </p>

        <div className="flex flex-col gap-3 w-full max-w-[280px]">
          <button
            onClick={onChat}
            className="press w-full h-[54px] bg-white text-gray-900 rounded-2xl text-[15px] font-semibold flex items-center justify-center gap-2.5 shadow-lg"
          >
            <MessageCircle className="w-5 h-5" strokeWidth={2} />
            Send a Message
          </button>
          <button
            onClick={onKeepBrowsing}
            className="press w-full h-[54px] bg-white/12 glass text-white rounded-2xl text-[15px] font-medium border border-white/10"
          >
            Keep Browsing
          </button>
        </div>
      </div>
    </div>
  );
}
