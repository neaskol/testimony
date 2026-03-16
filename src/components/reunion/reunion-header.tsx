"use client";

import {
  ArrowLeft,
  Moon,
  Sun,
  Menu,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Service } from "@/lib/types";

interface ReunionHeaderProps {
  service: Service;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onBack: () => void;
  onToggleSidebar: () => void;
}

export function ReunionHeader({
  service,
  isDarkMode,
  onToggleDarkMode,
  onBack,
  onToggleSidebar,
}: ReunionHeaderProps) {
  return (
    <header
      className={`sticky top-0 z-40 border-b px-4 py-3 ${
        isDarkMode
          ? "border-white/10 bg-reunion-bg/95 backdrop-blur-sm"
          : "border-border bg-white/95 backdrop-blur-sm"
      }`}
    >
      {/* Top row: navigation controls */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className={
            isDarkMode ? "text-reunion-fg hover:bg-white/10" : ""
          }
        >
          <ArrowLeft className="size-5" />
          <span className="sr-only">Quitter le mode réunion</span>
        </Button>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleDarkMode}
            className={
              isDarkMode ? "text-reunion-fg hover:bg-white/10" : ""
            }
          >
            {isDarkMode ? (
              <Sun className="size-5" />
            ) : (
              <Moon className="size-5" />
            )}
            <span className="sr-only">
              {isDarkMode ? "Mode clair" : "Mode sombre"}
            </span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className={
              isDarkMode ? "text-reunion-fg hover:bg-white/10" : ""
            }
          >
            <Menu className="size-5" />
            <span className="sr-only">Liste des témoignages</span>
          </Button>
        </div>
      </div>

      {/* Service info */}
      <div className="mt-2 space-y-1">
        <h1
          className={`font-serif text-lg font-bold leading-tight ${
            isDarkMode ? "text-reunion-fg" : "text-[#0A0A0A]"
          }`}
        >
          {service.title}
        </h1>

        {service.subject && (
          <p
            className={`text-sm ${
              isDarkMode ? "text-reunion-fg/70" : "text-[#64748B]"
            }`}
          >
            <span className="font-medium">Sujet :</span> {service.subject}
          </p>
        )}

        {service.inspiration && (
          <p
            className={`text-sm ${
              isDarkMode ? "text-reunion-fg/70" : "text-[#64748B]"
            }`}
          >
            <span className="font-medium">Inspiration :</span>{" "}
            {service.inspiration}
          </p>
        )}

        {service.scriptures.length > 0 && (
          <p
            className={`flex items-center gap-1.5 text-sm ${
              isDarkMode ? "text-reunion-fg/70" : "text-[#64748B]"
            }`}
          >
            <BookOpen className="size-3.5 shrink-0" />
            {service.scriptures.join(" \u00B7 ")}
          </p>
        )}
      </div>
    </header>
  );
}
