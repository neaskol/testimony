"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { ReunionTestimony } from "@/lib/types";

interface ReunionTestimonyViewProps {
  testimony: ReunionTestimony;
  isDarkMode: boolean;
  showOriginalToggle?: boolean;
}

export function ReunionTestimonyView({
  testimony,
  isDarkMode,
  showOriginalToggle = false,
}: ReunionTestimonyViewProps) {
  const [showOriginal, setShowOriginal] = useState(false);

  const hasOriginal =
    showOriginalToggle &&
    testimony.originalContent &&
    testimony.originalContent.trim().length > 0;

  const langLabel = testimony.sourceLanguage === "mg" ? "MG" : "FR";

  return (
    <article className="space-y-6">
      {/* Witness name + language badge */}
      <header>
        <div className="flex items-center gap-2">
          <h2
            className={`font-serif text-2xl font-bold leading-tight ${
              isDarkMode ? "text-reunion-fg" : "text-foreground"
            }`}
          >
            {testimony.witnessName}
          </h2>
          <span
            className={`inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
              isDarkMode
                ? "bg-white/10 text-reunion-fg/70"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {langLabel}
          </span>
        </div>
        {testimony.status !== "pending" && (
          <span
            className={`mt-1 inline-block text-xs font-medium uppercase tracking-wider ${
              testimony.status === "read"
                ? isDarkMode
                  ? "text-green-400"
                  : "text-green-700"
                : isDarkMode
                  ? "text-yellow-400"
                  : "text-yellow-700"
            }`}
          >
            {testimony.status === "read" ? "Lu" : "Ignore"}
          </span>
        )}
      </header>

      {/* Main content (in the reader's language) */}
      <section>
        <div
          className={`whitespace-pre-wrap text-lg leading-[1.75] ${
            isDarkMode ? "text-reunion-fg/90" : "text-foreground"
          }`}
        >
          {testimony.content || (
            <span
              className={`italic ${
                isDarkMode ? "text-reunion-fg/40" : "text-muted-foreground"
              }`}
            >
              Pas de contenu texte
            </span>
          )}
        </div>
      </section>

      {/* Toggle to show original text (admin only, for MG testimonies with FR translation) */}
      {hasOriginal && (
        <>
          <button
            type="button"
            onClick={() => setShowOriginal((prev) => !prev)}
            className={`flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider transition-colors ${
              isDarkMode
                ? "text-reunion-fg/50 hover:text-reunion-fg/70"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {showOriginal ? (
              <ChevronUp className="size-3.5" />
            ) : (
              <ChevronDown className="size-3.5" />
            )}
            Texte original ({langLabel})
          </button>

          {showOriginal && (
            <section>
              <div
                className={`border-t pt-4 ${
                  isDarkMode ? "border-white/10" : "border-border"
                }`}
              >
                <div
                  className={`whitespace-pre-wrap text-base leading-[1.75] ${
                    isDarkMode ? "text-reunion-fg/60" : "text-muted-foreground"
                  }`}
                >
                  {testimony.originalContent}
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </article>
  );
}
