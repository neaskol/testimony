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
    // OAuth or PKCE flow
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
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
      // For invitations, redirect to set-password page
      if (type === "invite") {
        return NextResponse.redirect(
          new URL("/auth/set-password", origin)
        );
      }
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  // If we get here, something went wrong
  return NextResponse.redirect(
    new URL("/login?error=Lien invalide ou expiré", origin)
  );
}
