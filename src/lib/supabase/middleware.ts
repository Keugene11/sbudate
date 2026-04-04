import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthPage = request.nextUrl.pathname === "/login";
  const isOnboarding = request.nextUrl.pathname === "/onboarding";
  const isPending = request.nextUrl.pathname === "/pending";
  const isCallback = request.nextUrl.pathname === "/auth/callback";
  const isAdmin = request.nextUrl.pathname === "/admin";
  const isApi = request.nextUrl.pathname.startsWith("/api/");

  if (isCallback || isApi) return supabaseResponse;

  if (!user && !isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/discover";
    return NextResponse.redirect(url);
  }

  // Check if user has completed onboarding and profile status
  if (user && !isOnboarding && !isAuthPage) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, status")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      if (!isOnboarding) {
        const url = request.nextUrl.clone();
        url.pathname = "/onboarding";
        return NextResponse.redirect(url);
      }
    } else if ((profile.status === "pending" || profile.status === "rejected") && !isPending && !isAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = "/pending";
      return NextResponse.redirect(url);
    } else if (profile.status === "approved" && isPending) {
      const url = request.nextUrl.clone();
      url.pathname = "/discover";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
