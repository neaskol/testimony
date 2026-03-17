"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AuthConfirmPage() {
  const [status, setStatus] = useState("Vérification en cours...");
  const router = useRouter();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    async function handleAuth() {
      // Check for PKCE flow: token_hash in query params
      const params = new URLSearchParams(window.location.search);
      const tokenHash = params.get("token_hash");
      const type = params.get("type");

      if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as "invite" | "recovery" | "email",
        });

        if (!error) {
          if (type === "invite") {
            router.push("/auth/set-password");
          } else {
            router.push("/");
          }
          return;
        }

        setStatus("Lien invalide ou expiré");
        setTimeout(() => router.push("/login"), 2000);
        return;
      }

      // Check for implicit flow: hash fragment with access_token
      const hash = window.location.hash;
      if (hash && hash.includes("access_token")) {
        // Parse the hash to check type
        const hashParams = new URLSearchParams(hash.substring(1));
        const hashType = hashParams.get("type");

        // The Supabase client auto-detects hash fragment tokens
        // Listen for the auth state change
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            if (session && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION")) {
              if (hashType === "invite" || session.user.user_metadata?.role === "translator") {
                router.push("/auth/set-password");
              } else {
                router.push("/");
              }
              subscription.unsubscribe();
            }
          }
        );

        // Timeout fallback
        setTimeout(() => {
          setStatus("Lien invalide ou expiré");
          subscription.unsubscribe();
          setTimeout(() => router.push("/login"), 2000);
        }, 8000);
        return;
      }

      // Check for PKCE flow: code in query params
      const code = params.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          router.push("/auth/set-password");
          return;
        }

        setStatus("Lien invalide ou expiré");
        setTimeout(() => router.push("/login"), 2000);
        return;
      }

      // No tokens found — check if there's already a session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        if (session.user.user_metadata?.role === "translator") {
          router.push("/auth/set-password");
        } else {
          router.push("/");
        }
        return;
      }

      // Nothing to process
      setStatus("Lien invalide ou expiré");
      setTimeout(() => router.push("/login"), 2000);
    }

    handleAuth();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="font-serif text-2xl leading-tight tracking-tight">
            Suivi<br /><span className="font-bold">Témoignages</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-muted-foreground">
            {status}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
