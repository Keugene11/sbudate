"use client";

import { Heart, Star } from "lucide-react";

export default function StandoutsPage() {
  return (
    <div className="max-w-md mx-auto">
      <div className="sticky top-0 z-40 bg-hinge-white/90 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-center py-3">
          <h1 className="font-serif text-[20px] font-semibold text-hinge-black">
            Standouts
          </h1>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-slide-up">
        <div className="w-16 h-16 rounded-full bg-mist flex items-center justify-center mb-4 animate-gentle-pulse">
          <Star className="w-8 h-8 text-midnight" strokeWidth={1.5} />
        </div>
        <h2 className="font-serif text-[22px] font-semibold mb-2">
          Standouts coming soon
        </h2>
        <p className="text-dove text-[14px] leading-relaxed max-w-xs">
          We&apos;re curating the most exceptional profiles at Stony Brook for you.
        </p>
      </div>
    </div>
  );
}
