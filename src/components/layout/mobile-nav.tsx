"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import type { Role } from "@/lib/types";

const adminNav = [
  { label: "Tableau de bord", href: "/admin/dashboard" },
  { label: "Témoignages", href: "/admin/testimonies" },
  { label: "Témoins", href: "/admin/witnesses" },
  { label: "Reunions", href: "/admin/services" },
  { label: "Plannings", href: "/admin/plans" },
  { label: "Traducteurs", href: "/admin/translators" },
  { label: "Aide / FAQ", href: "/admin/faq" },
];

const translatorNav = [
  { label: "Tableau de bord", href: "/translator/dashboard" },
  { label: "Témoignages", href: "/translator/testimonies" },
  { label: "Plannings", href: "/translator/plans" },
  { label: "Aide / FAQ", href: "/translator/faq" },
];

export function MobileNav({ role }: { role: Role }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const items = role === "translator" ? translatorNav : adminNav;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant="ghost" size="sm" className="lg:hidden" />}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
        <span className="sr-only">Menu</span>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="flex h-16 items-center border-b border-border px-6">
          <span className="font-serif text-lg leading-tight tracking-tight">
            Suivi<br /><span className="font-bold">Témoignages</span>
          </span>
        </div>
        <nav className="space-y-1 p-4">
          {items.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent text-primary"
                    : "text-foreground hover:bg-accent"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
