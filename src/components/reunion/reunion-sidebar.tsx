"use client";

import { CheckCircle2, Circle, SkipForward } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import type { ReunionTestimony } from "@/lib/types";

interface ReunionSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testimonies: ReunionTestimony[];
  currentIndex: number;
  isDarkMode: boolean;
  onJumpTo: (index: number) => void;
  readCount: number;
  total: number;
}

function StatusIcon({
  status,
  isDarkMode,
}: {
  status: ReunionTestimony["status"];
  isDarkMode: boolean;
}) {
  switch (status) {
    case "read":
      return (
        <CheckCircle2
          className={`size-4 shrink-0 ${
            isDarkMode ? "text-green-400" : "text-green-600"
          }`}
        />
      );
    case "skipped":
      return (
        <SkipForward
          className={`size-4 shrink-0 ${
            isDarkMode ? "text-yellow-400" : "text-yellow-600"
          }`}
        />
      );
    default:
      return (
        <Circle
          className={`size-4 shrink-0 ${
            isDarkMode ? "text-reunion-fg/30" : "text-border"
          }`}
        />
      );
  }
}

export function ReunionSidebar({
  open,
  onOpenChange,
  testimonies,
  currentIndex,
  isDarkMode,
  onJumpTo,
  readCount,
  total,
}: ReunionSidebarProps) {
  function handleJump(index: number) {
    onJumpTo(index);
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className={
          isDarkMode
            ? "border-white/10 bg-reunion-bg text-reunion-fg"
            : "bg-white"
        }
      >
        <SheetHeader>
          <SheetTitle
            className={isDarkMode ? "text-reunion-fg" : ""}
          >
            Temoignages
          </SheetTitle>
          <SheetDescription
            className={isDarkMode ? "text-reunion-fg/60" : ""}
          >
            {readCount} sur {total} lu{readCount !== 1 ? "s" : ""}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <ul className="space-y-1 p-px">
            {testimonies.map((testimony, index) => {
              const isCurrent = index === currentIndex;

              return (
                <li key={testimony.id}>
                  <button
                    type="button"
                    onClick={() => handleJump(index)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors ${
                      isCurrent
                        ? isDarkMode
                          ? "bg-white/10 ring-1 ring-gold"
                          : "bg-gold/5 ring-1 ring-gold"
                        : isDarkMode
                          ? "hover:bg-white/5"
                          : "hover:bg-muted/50"
                    }`}
                  >
                    <span
                      className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                        isCurrent
                          ? "bg-gold text-white"
                          : isDarkMode
                            ? "bg-white/10 text-reunion-fg/70"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {index + 1}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p
                          className={`text-sm font-medium truncate ${
                            isDarkMode ? "text-reunion-fg" : "text-foreground"
                          }`}
                        >
                          {testimony.witnessName}
                        </p>
                        <span
                          className={`shrink-0 rounded px-1 py-px text-[9px] font-semibold uppercase ${
                            isDarkMode
                              ? "bg-white/10 text-reunion-fg/50"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {testimony.sourceLanguage === "mg" ? "MG" : "FR"}
                        </span>
                      </div>
                    </div>

                    <StatusIcon
                      status={testimony.status}
                      isDarkMode={isDarkMode}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </SheetContent>
    </Sheet>
  );
}
