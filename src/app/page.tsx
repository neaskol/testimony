"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Supabase sends invite/recovery tokens as URL hash fragments
    // e.g. /#access_token=...&type=invite
    const hash = window.location.hash;
    if (hash && hash.includes("access_token")) {
      // Redirect to auth confirm page, preserving the hash
      window.location.href = `/auth/confirm${hash}`;
      return;
    }

    // No hash tokens — proceed with normal redirect
    router.replace("/login");
  }, [router]);

  return null;
}
