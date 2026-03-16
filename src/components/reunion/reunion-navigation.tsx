"use client";

import { ChevronRight, SkipForward, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReunionTestimony } from "@/lib/types";

interface ReunionNavigationProps {
  currentIndex: number;
  total: number;
  testimonies: ReunionTestimony[];
  isDarkMode: boolean;
  isFirst: boolean;
  isLast: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
}

export function ReunionNavigation({
  currentIndex,
  total,
  testimonies,
  isDarkMode,
  isFirst,
  isLast,
  onNext,
  onPrevious,
  onSkip,
}: ReunionNavigationProps) {
  const nextTestimony =
    currentIndex < total - 1 ? testimonies[currentIndex + 1] : null;

  return (
    <nav
      className={`fixed inset-x-0 bottom-0 z-40 border-t safe-bottom ${
        isDarkMode
          ? "border-white/10 bg-reunion-bg/95 backdrop-blur-sm"
          : "border-border bg-white/95 backdrop-blur-sm"
      }`}
    >
      {/* Next testimony preview */}
      {nextTestimony && (
        <div
          className={`border-b px-4 py-2 text-xs ${
            isDarkMode
              ? "border-white/5 text-reunion-fg/60"
              : "border-border/50 text-[#64748B]"
          }`}
        >
          Suivant : {nextTestimony.witnessName}
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between px-4 py-3">
        {/* Previous */}
        <Button
          variant="ghost"
          size="lg"
          disabled={isFirst}
          onClick={onPrevious}
          className={`min-h-[48px] min-w-[48px] ${
            isDarkMode
              ? "text-reunion-fg hover:bg-white/10 disabled:text-reunion-fg/30"
              : "disabled:text-muted-foreground/30"
          }`}
        >
          <ChevronLeft className="size-5" />
          <span className="sr-only">Précédent</span>
        </Button>

        {/* Progress indicator */}
        <div className="flex flex-col items-center gap-1">
          <span
            className={`text-sm font-medium tabular-nums ${
              isDarkMode ? "text-reunion-fg" : "text-[#0A0A0A]"
            }`}
          >
            {currentIndex + 1} / {total}
          </span>

          {/* Progress dots */}
          <div className="flex gap-1">
            {testimonies.map((t, i) => (
              <span
                key={t.id}
                className={`inline-block size-1.5 rounded-full transition-colors ${
                  i === currentIndex
                    ? "bg-[#B8860B]"
                    : t.status === "read"
                      ? isDarkMode
                        ? "bg-green-400/60"
                        : "bg-green-500/60"
                      : t.status === "skipped"
                        ? isDarkMode
                          ? "bg-yellow-400/60"
                          : "bg-yellow-500/60"
                        : isDarkMode
                          ? "bg-reunion-fg/20"
                          : "bg-[#E2E8F0]"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Skip + Next */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="lg"
            disabled={isLast}
            onClick={onSkip}
            className={`min-h-[48px] text-xs ${
              isDarkMode
                ? "text-reunion-fg/60 hover:bg-white/10 hover:text-reunion-fg disabled:text-reunion-fg/30"
                : "text-[#64748B] hover:text-foreground disabled:text-muted-foreground/30"
            }`}
          >
            <SkipForward className="size-4" />
            Ignorer
          </Button>

          <Button
            disabled={isLast}
            onClick={onNext}
            className="min-h-[48px] min-w-[48px] bg-[#B8860B] text-white hover:bg-[#996F09] disabled:opacity-40"
          >
            <ChevronRight className="size-5" />
            <span className="sr-only">Suivant</span>
          </Button>
        </div>
      </div>
    </nav>
  );
}
