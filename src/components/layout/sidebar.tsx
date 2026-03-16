"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/types";

interface NavItem {
  label: string;
  href: string;
}

const adminNav: NavItem[] = [
  { label: "Tableau de bord", href: "/admin/dashboard" },
  { label: "Témoignages", href: "/admin/testimonies" },
  { label: "Témoins", href: "/admin/witnesses" },
  { label: "Reunions", href: "/admin/services" },
  { label: "Plannings", href: "/admin/plans" },
  { label: "Traducteurs", href: "/admin/translators" },
  { label: "Aide / FAQ", href: "/admin/faq" },
];

const translatorNav: NavItem[] = [
  { label: "Tableau de bord", href: "/translator/dashboard" },
  { label: "Témoignages", href: "/translator/testimonies" },
  { label: "Plannings", href: "/translator/plans" },
  { label: "Aide / FAQ", href: "/translator/faq" },
];

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = role === "translator" ? translatorNav : adminNav;

  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-sidebar lg:block">
      <div className="flex h-16 items-center border-b border-border px-6">
        <Link href="/" className="font-serif text-lg leading-tight tracking-tight">
          Suivi<br /><span className="font-bold">Témoignages</span>
        </Link>
      </div>
      <nav className="space-y-1 p-4">
        {items.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
