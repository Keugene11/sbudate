"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Star, Heart, MessageCircle, User } from "lucide-react";

const tabs = [
  { href: "/discover", icon: Compass, label: "Discover" },
  { href: "/standouts", icon: Star, label: "Standouts" },
  { href: "/likes", icon: Heart, label: "Likes" },
  { href: "/matches", icon: MessageCircle, label: "Matches" },
  { href: "/profile", icon: User, label: "Profile" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-hinge-white border-t border-border z-50">
      <div className="max-w-md mx-auto flex items-center justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 press ${
                isActive ? "text-hinge-black" : "text-dove"
              }`}
            >
              <Icon
                className="w-[22px] h-[22px]"
                strokeWidth={isActive ? 2.2 : 1.5}
                fill={isActive && tab.icon === Heart ? "currentColor" : "none"}
              />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
