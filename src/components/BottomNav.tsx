"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Star, Heart, MessageCircle, User } from "lucide-react";
import { useState } from "react";

const tabs = [
  { href: "/discover", icon: Compass, label: "Discover" },
  { href: "/standouts", icon: Star, label: "Standouts" },
  { href: "/likes", icon: Heart, label: "Likes" },
  { href: "/matches", icon: MessageCircle, label: "Matches" },
  { href: "/profile", icon: User, label: "Profile" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [tappedTab, setTappedTab] = useState<string | null>(null);

  const handleTap = (href: string) => {
    setTappedTab(href);
    setTimeout(() => setTappedTab(null), 400);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-hinge-white/95 backdrop-blur-md border-t border-border z-50">
      <div className="max-w-md mx-auto flex items-center justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          const isTapped = tappedTab === tab.href;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              onClick={() => handleTap(tab.href)}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 -webkit-tap-highlight-color-transparent"
            >
              <div className={`transition-all duration-200 ${isTapped ? "animate-icon-bounce" : ""}`}>
                <Icon
                  className={`w-[22px] h-[22px] transition-all duration-250 ${
                    isActive ? "text-hinge-black" : "text-dove"
                  }`}
                  strokeWidth={isActive ? 2.2 : 1.5}
                  fill={isActive && tab.icon === Heart ? "currentColor" : "none"}
                />
              </div>
              <span className={`text-[10px] font-medium transition-colors duration-250 ${
                isActive ? "text-hinge-black" : "text-dove"
              }`}>
                {tab.label}
              </span>
              {/* Active indicator dot */}
              <div className={`h-0.5 w-0.5 rounded-full transition-all duration-300 ${
                isActive ? "bg-hinge-black scale-100 opacity-100" : "scale-0 opacity-0"
              }`} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
