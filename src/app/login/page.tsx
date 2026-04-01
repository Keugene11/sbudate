"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true); setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) { setError(error.message); setLoading(false); }
  };

  return (
    <div className="h-full flex flex-col bg-surface">
      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 max-w-[400px] mx-auto w-full">
        {/* Logo + tagline */}
        <div className="animate-slide-up text-center">
          <div className="mb-6">
            <h1 className="text-[36px] font-bold text-gray-900 tracking-tight leading-none">
              SBUdate
            </h1>
            <div className="w-8 h-[3px] bg-rose rounded-full mx-auto mt-3" />
          </div>
          <p className="text-gray-500 text-[16px] leading-relaxed">
            Designed to be deleted.
          </p>
          <p className="text-gray-400 text-[14px] mt-1">
            For Stony Brook students only.
          </p>
        </div>

        {/* CTA */}
        <div className="w-full mt-14 space-y-3 animate-slide-up" style={{ animationDelay: "80ms" }}>
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="press w-full h-[56px] bg-gray-900 text-white rounded-2xl text-[15px] font-semibold flex items-center justify-center gap-3 disabled:opacity-50 tracking-[-0.2px] shadow-lg shadow-black/10"
          >
            <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {loading ? "Signing in..." : "Continue with Google"}
          </button>
        </div>

        {error && (
          <p className="text-rose text-[13px] mt-4 text-center animate-fade-in">{error}</p>
        )}
      </div>

      {/* Footer */}
      <div className="px-8 pb-10 text-center animate-fade-in" style={{ animationDelay: "200ms" }}>
        <p className="text-gray-400 text-[12px] leading-relaxed">
          By continuing, you agree to our Terms of Service
          <br />and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
