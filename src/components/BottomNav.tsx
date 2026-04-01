"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

function DiscoverIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3" fill={active ? "currentColor" : "none"} />
      {!active && (
        <>
          <line x1="8" y1="9" x2="16" y2="9" />
          <line x1="8" y1="13" x2="14" y2="13" />
        </>
      )}
    </svg>
  );
}

function HeartIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function ChatIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" fill={active ? "currentColor" : "none"} />
    </svg>
  );
}

function StarIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

const tabs = [
  { href: "/discover", Icon: DiscoverIcon },
  { href: "/standouts", Icon: StarIcon },
  { href: "/likes", Icon: HeartIcon },
  { href: "/matches", Icon: ChatIcon },
  { href: "/profile", Icon: ProfileIcon },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [tapped, setTapped] = useState<string | null>(null);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E8E8E8] z-50">
      <div className="max-w-lg mx-auto flex items-center justify-around h-[52px] pb-[env(safe-area-inset-bottom)]">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          const isTapped = tapped === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              onClick={() => {
                setTapped(tab.href);
                setTimeout(() => setTapped(null), 350);
              }}
              className={`flex items-center justify-center w-12 h-12 ${
                isActive ? "text-black" : "text-[#999]"
              }`}
            >
              <div className={isTapped ? "animate-icon-bounce" : ""}>
                <tab.Icon active={isActive} />
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
