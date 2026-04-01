"use client";

import { useEffect, useState } from "react";
import { Heart, MessageCircle } from "lucide-react";

interface MatchCelebrationProps {
  name: string;
  photoUrl: string | null;
  onChat: () => void;
  onKeepBrowsing: () => void;
}

export default function MatchCelebration({ name, photoUrl, onChat, onKeepBrowsing }: MatchCelebrationProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setShow(true));
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 transition-opacity duration-500"
        style={{ opacity: show ? 1 : 0 }}
        onClick={onKeepBrowsing}
      />

      {/* Content */}
      <div
        className="relative z-10 flex flex-col items-center px-8 text-center transition-all duration-500"
        style={{
          opacity: show ? 1 : 0,
          transform: show ? "translateY(0) scale(1)" : "translateY(24px) scale(0.95)",
        }}
      >
        {/* Hearts animation */}
        <div className="relative mb-6">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt=""
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-2xl"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-300 border-4 border-white shadow-2xl" />
          )}
          <div className="absolute -top-2 -right-2 w-10 h-10 bg-rose rounded-full flex items-center justify-center shadow-lg animate-heart-pop">
            <Heart className="w-5 h-5 text-white" fill="white" strokeWidth={0} />
          </div>
        </div>

        <h2 className="text-white text-[28px] font-bold tracking-tight mb-2">
          It&apos;s a Match!
        </h2>
        <p className="text-white/70 text-[15px] mb-8">
          You and {name} liked each other
        </p>

        <div className="flex flex-col gap-3 w-full max-w-[280px]">
          <button
            onClick={onChat}
            className="press w-full h-[52px] bg-white text-gray-900 rounded-2xl text-[15px] font-semibold flex items-center justify-center gap-2.5 shadow-lg"
          >
            <MessageCircle className="w-5 h-5" strokeWidth={2} />
            Send a Message
          </button>
          <button
            onClick={onKeepBrowsing}
            className="press w-full h-[52px] bg-white/15 glass text-white rounded-2xl text-[15px] font-medium"
          >
            Keep Browsing
          </button>
        </div>
      </div>
    </div>
  );
}
