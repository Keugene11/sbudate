"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Star, Heart, MessageSquare } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();
  const [tapped, setTapped] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const fetchAvatar = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", user.id).single();
      if (!profile) return;
      const { data: photos } = await supabase.from("photos").select("url").eq("profile_id", profile.id).order("position").limit(1);
      if (photos?.[0]) setAvatarUrl(photos[0].url);
    };
    fetchAvatar();
  }, []);

  const tabs = [
    { href: "/discover", label: "discover" },
    { href: "/standouts", label: "standouts" },
    { href: "/likes", label: "likes" },
    { href: "/matches", label: "matches" },
    { href: "/profile", label: "profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50">
      <div className="max-w-lg mx-auto flex items-center justify-around h-[50px] pb-[env(safe-area-inset-bottom)]">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          const isTapped = tapped === tab.href;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              onClick={() => { setTapped(tab.href); setTimeout(() => setTapped(null), 350); }}
              className={`flex items-center justify-center w-12 h-12 ${isTapped ? "animate-icon-bounce" : ""}`}
            >
              {tab.label === "discover" && (
                <span className={`text-[20px] font-medium ${isActive ? "text-black" : "text-gray-400"}`}>H</span>
              )}
              {tab.label === "standouts" && (
                <Star className={`w-[22px] h-[22px] ${isActive ? "text-black" : "text-gray-400"}`} strokeWidth={isActive ? 2.5 : 1.8} fill={isActive ? "currentColor" : "none"} />
              )}
              {tab.label === "likes" && (
                <Heart className={`w-[22px] h-[22px] ${isActive ? "text-black" : "text-gray-400"}`} strokeWidth={isActive ? 2.5 : 1.8} fill={isActive ? "currentColor" : "none"} />
              )}
              {tab.label === "matches" && (
                <MessageSquare className={`w-[22px] h-[22px] ${isActive ? "text-black" : "text-gray-400"}`} strokeWidth={isActive ? 2.5 : 1.8} fill={isActive ? "currentColor" : "none"} />
              )}
              {tab.label === "profile" && (
                avatarUrl ? (
                  <img src={avatarUrl} alt="" className={`w-7 h-7 rounded-full object-cover ${isActive ? "ring-2 ring-black" : "ring-1 ring-gray-300"}`} />
                ) : (
                  <div className={`w-7 h-7 rounded-full ${isActive ? "bg-black" : "bg-gray-300"} flex items-center justify-center`}>
                    <span className="text-white text-[11px]">👤</span>
                  </div>
                )
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
