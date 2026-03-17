"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Moon,
  Sun,
  Menu,
  BookOpen,
  ChevronDown,
  ChevronUp,
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
  const [showDetails, setShowDetails] = useState(false);

  const hasDetails =
    service.subject || service.inspiration || service.scriptures.length > 0;

  return (
    <header
      className={`sticky top-0 z-40 border-b px-4 py-2 ${
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
          <span className="sr-only">Quitter le mode reunion</span>
        </Button>

        {/* Title in center (compact) */}
        {hasDetails ? (
          <button
            onClick={() => setShowDetails((prev) => !prev)}
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium transition-colors ${
              isDarkMode
                ? "text-reunion-fg/80 hover:bg-white/10"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {service.title}
            {showDetails ? (
              <ChevronUp className="size-3.5" />
            ) : (
              <ChevronDown className="size-3.5" />
            )}
          </button>
        ) : (
          <span
            className={`text-sm font-medium ${
              isDarkMode ? "text-reunion-fg/80" : "text-muted-foreground"
            }`}
          >
            {service.title}
          </span>
        )}

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
            <span className="sr-only">Liste des temoignages</span>
          </Button>
        </div>
      </div>

      {/* Service details (collapsible) */}
      {showDetails && hasDetails && (
        <div
          className={`mt-2 space-y-1 border-t pt-2 ${
            isDarkMode ? "border-white/10" : "border-border"
          }`}
        >
          {service.subject && (
            <p
              className={`text-sm ${
                isDarkMode ? "text-reunion-fg/70" : "text-muted-foreground"
              }`}
            >
              <span className="font-medium">Sujet :</span> {service.subject}
            </p>
          )}

          {service.inspiration && (
            <p
              className={`text-sm ${
                isDarkMode ? "text-reunion-fg/70" : "text-muted-foreground"
              }`}
            >
              <span className="font-medium">Inspiration :</span>{" "}
              {service.inspiration}
            </p>
          )}

          {service.scriptures.length > 0 && (
            <p
              className={`flex items-center gap-1.5 text-sm ${
                isDarkMode ? "text-reunion-fg/70" : "text-muted-foreground"
              }`}
            >
              <BookOpen className="size-3.5 shrink-0" />
              {service.scriptures.join(" \u00B7 ")}
            </p>
          )}
        </div>
      )}
    </header>
  );
}
