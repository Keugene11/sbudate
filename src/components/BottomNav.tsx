"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Heart, MessageSquare, Layers } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();
  const [tapped, setTapped] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", user.id).single();
      if (!profile) return;
      const { data: photos } = await supabase.from("photos").select("url").eq("profile_id", profile.id).order("position").limit(1);
      if (photos?.[0]) setAvatarUrl(photos[0].url);
    })();
  }, []);

  const tabs = [
    { href: "/discover", label: "discover" },
    { href: "/likes", label: "likes" },
    { href: "/matches", label: "matches" },
    { href: "/profile", label: "profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-50">
      <div className="max-w-lg mx-auto flex items-center justify-around h-[56px]" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          const isTapped = tapped === tab.href;
          return (
            <Link key={tab.href} href={tab.href}
              onClick={() => { setTapped(tab.href); setTimeout(() => setTapped(null), 200); }}
              className={`flex items-center justify-center w-14 h-12 ${isTapped ? "animate-icon-bounce" : ""}`}>
              {tab.label === "discover" && <Layers className="w-6 h-6" strokeWidth={isActive ? 2.2 : 1.5} fill={isActive ? "#1A1A1A" : "none"} color={isActive ? "#1A1A1A" : "#8E8E93"} />}
              {tab.label === "likes" && <Heart className="w-6 h-6" strokeWidth={isActive ? 2.2 : 1.5} fill={isActive ? "#1A1A1A" : "none"} color={isActive ? "#1A1A1A" : "#8E8E93"} />}
              {tab.label === "matches" && <MessageSquare className="w-6 h-6" strokeWidth={isActive ? 2.2 : 1.5} fill={isActive ? "#1A1A1A" : "none"} color={isActive ? "#1A1A1A" : "#8E8E93"} />}
              {tab.label === "profile" && (
                avatarUrl ? (
                  <img src={avatarUrl} alt="" className={`w-7 h-7 rounded-full object-cover ${isActive ? "ring-[2px] ring-gray-900 ring-offset-1" : ""}`} />
                ) : (
                  <div className={`w-7 h-7 rounded-full ${isActive ? "bg-gray-900" : "bg-gray-400"}`} />
                )
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
