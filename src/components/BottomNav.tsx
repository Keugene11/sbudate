"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function BottomNav() {
  const pathname = usePathname();
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
    { href: "/discover", label: "Discover", icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "#1A1A1A" : "none"} stroke={active ? "#1A1A1A" : "#8E8E93"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="4" />
      </svg>
    )},
    { href: "/likes", label: "Likes", icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "#1A1A1A" : "none"} stroke={active ? "none" : "#8E8E93"} strokeWidth="1.5">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    )},
    { href: "/matches", label: "Chat", icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "#1A1A1A" : "none"} stroke={active ? "none" : "#8E8E93"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    )},
    { href: "/profile", label: "Me", icon: null },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface z-50" style={{ borderTop: "1px solid #E0DFDB" }}>
      <div className="max-w-lg mx-auto flex items-center justify-around h-[52px]" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          return (
            <Link key={tab.href} href={tab.href}
              className="flex flex-col items-center justify-center gap-[2px] w-16 h-full">
              {tab.icon ? (
                tab.icon(isActive)
              ) : (
                avatarUrl ? (
                  <img src={avatarUrl} alt="" className={`w-[26px] h-[26px] rounded-full object-cover ${isActive ? "ring-[1.5px] ring-gray-900 ring-offset-1" : "opacity-60"}`} />
                ) : (
                  <div className={`w-[26px] h-[26px] rounded-full ${isActive ? "bg-gray-900" : "bg-gray-300"}`} />
                )
              )}
              <span className={`text-[10px] ${isActive ? "text-gray-900 font-medium" : "text-gray-400"}`}>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
