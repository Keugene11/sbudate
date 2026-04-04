"use client";

import { useState, useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { BadgeCheck, ChevronLeft, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PremiumPage() {
  return (
    <Suspense fallback={
      <div className="max-w-lg mx-auto flex items-center justify-center h-[60vh]">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
      </div>
    }>
      <PremiumContent />
    </Suspense>
  );
}

function PremiumContent() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const [plan, setPlan] = useState<"monthly" | "yearly">("yearly");
  const [loading, setLoading] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_premium")
        .eq("user_id", user.id)
        .single();
      setIsPremium(profile?.is_premium || false);
      setChecking(false);
    })();
  }, [supabase]);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      setLoading(false);
    }
  };

  if (checking) return (
    <div className="max-w-lg mx-auto flex items-center justify-center h-[60vh]">
      <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
    </div>
  );

  if (success || isPremium) return (
    <div className="max-w-lg mx-auto flex flex-col items-center justify-center h-[70vh] px-8 text-center animate-slide-up">
      <div className="w-20 h-20 rounded-full bg-gray-900 flex items-center justify-center mb-6">
        <BadgeCheck className="w-10 h-10 text-white" strokeWidth={1.8} />
      </div>
      <h1 className="text-[24px] font-bold text-gray-900 tracking-tight mb-2">
        You&apos;re Premium
      </h1>
      <p className="text-gray-400 text-[15px] leading-relaxed mb-8">
        Your verified badge is now visible on your profile.
      </p>
      <button
        onClick={() => router.push("/profile")}
        className="press px-6 py-3 bg-gray-900 text-white rounded-2xl text-[15px] font-semibold"
      >
        View your profile
      </button>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto min-h-screen animate-tab-in">
      {/* Header */}
      <div className="flex items-center px-4 h-[56px]">
        <button onClick={() => router.back()} className="press p-1.5 -ml-1">
          <ChevronLeft className="w-6 h-6 text-gray-900" strokeWidth={2} />
        </button>
      </div>

      <div className="px-6 pt-4 pb-32">
        {/* Hero */}
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-6 h-6 text-gray-900" strokeWidth={1.8} />
          <h1 className="text-[28px] font-bold text-gray-900 tracking-tight">SBUdate Premium</h1>
        </div>
        <p className="text-gray-400 text-[15px] leading-relaxed mb-8">
          Get a verified badge next to your name so people know you&apos;re real.
        </p>

        {/* Badge preview */}
        <div className="bg-gray-50 rounded-2xl px-6 py-5 mb-8 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
            <span className="text-[20px] font-bold text-gray-400">You</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[18px] font-semibold text-gray-900">Your Name</span>
              <BadgeCheck className="w-5 h-5 text-gray-900" strokeWidth={2} fill="currentColor" />
            </div>
            <p className="text-[13px] text-gray-400 mt-0.5">Verified SBUdate member</p>
          </div>
        </div>

        {/* Plan selector */}
        <div className="space-y-3 mb-8">
          <button
            onClick={() => setPlan("yearly")}
            className={`press w-full rounded-2xl px-6 py-5 text-left transition-all duration-200 ${
              plan === "yearly"
                ? "bg-gray-900 text-white"
                : "bg-surface border border-border text-gray-900"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[16px] font-semibold">Yearly</p>
                <p className={`text-[13px] mt-0.5 ${plan === "yearly" ? "text-gray-400" : "text-gray-400"}`}>
                  $4.17/mo · billed annually
                </p>
              </div>
              <div className="text-right">
                <p className="text-[20px] font-bold">$50</p>
                <p className={`text-[12px] font-medium ${plan === "yearly" ? "text-green-400" : "text-green-500"}`}>Save 58%</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setPlan("monthly")}
            className={`press w-full rounded-2xl px-6 py-5 text-left transition-all duration-200 ${
              plan === "monthly"
                ? "bg-gray-900 text-white"
                : "bg-surface border border-border text-gray-900"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[16px] font-semibold">Monthly</p>
                <p className={`text-[13px] mt-0.5 ${plan === "monthly" ? "text-gray-400" : "text-gray-400"}`}>
                  Billed monthly
                </p>
              </div>
              <p className="text-[20px] font-bold">$10</p>
            </div>
          </button>
        </div>
      </div>

      {/* CTA */}
      <div className="fixed bottom-0 left-0 right-0 px-6 pb-10 pt-6 bg-gradient-to-t from-surface via-surface to-transparent">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="press w-full h-[56px] rounded-2xl text-[15px] font-semibold bg-gray-900 text-white shadow-lg shadow-black/15 transition-all duration-300"
          >
            {loading ? "Loading..." : `Subscribe · $${plan === "yearly" ? "50/year" : "10/month"}`}
          </button>
        </div>
      </div>
    </div>
  );
}
