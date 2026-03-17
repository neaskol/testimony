"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MobileNav } from "./mobile-nav";
import type { Profile } from "@/lib/types";

export function Header({ profile }: { profile: Profile }) {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.refresh();
    router.push("/login");
  }

  const roleLabel =
    profile.role === "superadmin"
      ? "Super Admin"
      : profile.role === "admin"
        ? "Pasteur"
        : "Traducteur";

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <MobileNav role={profile.role} />
        <span className="text-sm text-muted-foreground">{roleLabel}</span>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-sm hover:bg-accent focus:outline-none">
          <span className="hidden sm:inline-block">{profile.full_name}</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
            {profile.full_name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem className="text-muted-foreground" disabled>
            {profile.email}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSignOut}>
            Se déconnecter
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
