"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-hinge-white">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-12 animate-slide-up">
          <h1 className="font-serif text-[42px] font-semibold tracking-tight text-hinge-black">
            SBUDate
          </h1>
          <p className="text-dove text-[15px] mt-2 animate-fade-in" style={{ animationDelay: "200ms" }}>
            Designed to be deleted.
          </p>
        </div>

        {/* Tagline */}
        <div className="mb-10 text-center animate-slide-up" style={{ animationDelay: "120ms" }}>
          <h2 className="font-serif text-[24px] font-medium text-hinge-black leading-snug">
            The dating app for<br />Stony Brook students
          </h2>
          <p className="text-dove text-[14px] mt-3 leading-relaxed animate-fade-in" style={{ animationDelay: "350ms" }}>
            Only verified @stonybrook.edu email addresses can join.
          </p>
        </div>

        {/* Google Login Button */}
        <div className="animate-slide-up" style={{ animationDelay: "250ms" }}>
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="press w-full flex items-center justify-center gap-3 bg-hinge-black text-white py-4 rounded-2xl font-semibold text-[15px] tracking-wide disabled:opacity-50 transition-all duration-300"
          >
            <svg className={`w-5 h-5 transition-transform duration-300 ${loading ? "animate-spin" : ""}`} viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {loading ? "Signing in..." : "Continue with Google"}
          </button>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-[13px] text-center animate-toast">
            {error}
          </div>
        )}

        <p className="text-dove text-[12px] text-center mt-6 leading-relaxed animate-fade-in" style={{ animationDelay: "500ms" }}>
          By continuing, you agree to our Terms of Service.<br />
          Must use a @stonybrook.edu email.
        </p>
      </div>
    </div>
  );
}
