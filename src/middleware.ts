import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const publicRoutes = ["/login", "/auth/callback", "/auth/set-password"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip public assets and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const { user, supabase, supabaseResponse } = await updateSession(request);

  // Allow public routes
  if (publicRoutes.includes(pathname)) {
    if (user) {
      // Already logged in — redirect to appropriate dashboard
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile) {
        const dest =
          profile.role === "translator" ? "/translator/dashboard" : "/admin/dashboard";
        return NextResponse.redirect(new URL(dest, request.url));
      }
    }
    return supabaseResponse;
  }

  // Protected routes — redirect to login if not authenticated
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Role-based routing
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    // Profile not found — sign out and redirect
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Root redirect
  if (pathname === "/") {
    const dest =
      profile.role === "translator" ? "/translator/dashboard" : "/admin/dashboard";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // Enforce route prefixes by role
  if (pathname.startsWith("/admin") && profile.role === "translator") {
    return NextResponse.redirect(
      new URL("/translator/dashboard", request.url)
    );
  }

  if (
    pathname.startsWith("/translator") &&
    profile.role !== "translator" &&
    profile.role !== "superadmin"
  ) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
