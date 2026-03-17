import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/";

  const supabase = await createClient();

  if (code) {
    // PKCE flow
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (type === "invite") {
        return NextResponse.redirect(new URL("/auth/set-password", origin));
      }
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  if (token_hash && type) {
    // Email link flow (invite, recovery, email change)
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as "invite" | "recovery" | "email",
    });

    if (!error) {
      if (type === "invite") {
        return NextResponse.redirect(new URL("/auth/set-password", origin));
      }
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  // No server-side params — Supabase may have sent tokens as URL fragment (#).
  // Redirect to a client-side page that can read the hash fragment.
  return NextResponse.redirect(
    new URL("/auth/confirm", origin)
  );
}
