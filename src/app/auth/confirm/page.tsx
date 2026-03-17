"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AuthConfirmPage() {
  const [status, setStatus] = useState("Vérification en cours...");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function handleAuth() {
      // Supabase client auto-detects tokens in URL hash fragment
      // and exchanges them for a session via onAuthStateChange
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        setStatus("Lien invalide ou expiré");
        setTimeout(() => router.push("/login"), 2000);
        return;
      }

      if (session) {
        // Check if user needs to set password (invited user)
        const isInvited = session.user.user_metadata?.role === "translator"
          && !session.user.user_metadata?.password_set;

        if (isInvited) {
          router.push("/auth/set-password");
        } else {
          router.push("/");
        }
        return;
      }

      // Listen for auth state change (Supabase processes hash fragment async)
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          if (event === "SIGNED_IN" && session) {
            const isInvited = session.user.user_metadata?.role === "translator";
            if (isInvited) {
              router.push("/auth/set-password");
            } else {
              router.push("/");
            }
            subscription.unsubscribe();
          } else if (event === "TOKEN_REFRESHED") {
            // Session established
            router.push("/auth/set-password");
            subscription.unsubscribe();
          }
        }
      );

      // Timeout fallback
      setTimeout(() => {
        setStatus("Lien invalide ou expiré");
        subscription.unsubscribe();
        setTimeout(() => router.push("/login"), 2000);
      }, 10000);
    }

    handleAuth();
  }, [router, supabase]);

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
