"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function BottomNav() {
  const pathname = usePathname();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [likeCount, setLikeCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", user.id).single();
      if (!profile) return;

      // Avatar
      const { data: photos } = await supabase.from("photos").select("url").eq("profile_id", profile.id).order("position").limit(1);
      if (photos?.[0]) setAvatarUrl(photos[0].url);

      // Like count
      const { data: matches } = await supabase.from("matches").select("profile1_id, profile2_id").or(`profile1_id.eq.${profile.id},profile2_id.eq.${profile.id}`);
      const matchedIds = new Set(matches?.flatMap((m) => m.profile1_id === profile.id ? [m.profile2_id] : [m.profile1_id]) || []);
      const { data: likes } = await supabase.from("likes").select("id, from_profile_id").eq("to_profile_id", profile.id);
      const unmatchedLikes = likes?.filter((l) => !matchedIds.has(l.from_profile_id)) || [];
      setLikeCount(unmatchedLikes.length);

      // Unread count
      const { data: matchData } = await supabase.from("matches").select("id").or(`profile1_id.eq.${profile.id},profile2_id.eq.${profile.id}`);
      if (matchData) {
        let unread = 0;
        for (const match of matchData) {
          const { data: msgs } = await supabase.from("messages").select("id").eq("match_id", match.id).neq("sender_id", profile.id).eq("read", false);
          if (msgs && msgs.length > 0) unread++;
        }
        setUnreadCount(unread);
      }
    })();
  }, [pathname]);

  const tabs = [
    {
      href: "/discover",
      label: "Discover",
      badge: 0,
      icon: (active: boolean) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "#FFFFFF" : "none"} stroke={active ? "#FFFFFF" : "rgba(255,255,255,0.35)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="4" />
        </svg>
      ),
    },
    {
      href: "/likes",
      label: "Likes",
      badge: likeCount,
      icon: (active: boolean) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "#FFFFFF" : "none"} stroke={active ? "none" : "rgba(255,255,255,0.35)"} strokeWidth="1.8">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      ),
    },
    {
      href: "/matches",
      label: "Matches",
      badge: unreadCount,
      icon: (active: boolean) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "#FFFFFF" : "none"} stroke={active ? "none" : "rgba(255,255,255,0.35)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      href: "/premium",
      label: "Premium",
      badge: 0,
      icon: (active: boolean) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "#FFFFFF" : "none"} stroke={active ? "#FFFFFF" : "rgba(255,255,255,0.35)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
    },
    { href: "/profile", label: "Profile", badge: 0, icon: null },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#1a1a1a] z-50">
      <div
        className="max-w-lg mx-auto flex items-center justify-around h-[56px]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full press"
            >
              <div className="relative">
                {tab.icon ? (
                  tab.icon(isActive)
                ) : avatarUrl ? (
                  <div className={`w-[24px] h-[24px] rounded-full overflow-hidden transition-all duration-200 ${
                    isActive ? "ring-[1.5px] ring-white ring-offset-[1.5px] ring-offset-[#1a1a1a]" : "opacity-40"
                  }`}>
                    <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className={`w-[24px] h-[24px] rounded-full transition-colors ${
                    isActive ? "bg-white" : "bg-white/30"
                  }`} />
                )}
                {tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-[16px] bg-rose text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                    {tab.badge > 9 ? "9+" : tab.badge}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
