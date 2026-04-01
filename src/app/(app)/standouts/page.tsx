"use client";

import { Star } from "lucide-react";

export default function StandoutsPage() {
  return (
    <div className="max-w-lg mx-auto bg-white min-h-screen">
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm">
        <div className="px-4 h-[52px] flex items-center">
          <h1 className="text-[18px] font-semibold">Standouts</h1>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center py-24 px-8 text-center animate-slide-up">
        <Star className="w-10 h-10 text-gray-300 mb-4" strokeWidth={1.5} />
        <p className="text-[18px] font-bold mb-1">Coming soon</p>
        <p className="text-gray-500 text-[14px]">
          Standout profiles from Stony Brook will appear here.
        </p>
      </div>
    </div>
  );
}
