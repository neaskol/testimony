"use client";

import type { ReunionTestimony } from "@/lib/types";

interface ReunionTestimonyViewProps {
  testimony: ReunionTestimony;
  isDarkMode: boolean;
}

export function ReunionTestimonyView({
  testimony,
  isDarkMode,
}: ReunionTestimonyViewProps) {
  const hasTranslation =
    testimony.translatedContent && testimony.translatedContent.trim().length > 0;

  return (
    <article className="space-y-6">
      {/* Witness name */}
      <header>
        <h2
          className={`font-serif text-2xl font-bold leading-tight ${
            isDarkMode ? "text-reunion-fg" : "text-foreground"
          }`}
        >
          {testimony.witnessName}
        </h2>
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

      {/* Original content */}
      <section>
        {hasTranslation && (
          <p
            className={`mb-2 text-xs font-medium uppercase tracking-wider ${
              isDarkMode ? "text-reunion-fg/50" : "text-muted-foreground"
            }`}
          >
            Texte original
          </p>
        )}
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

      {/* Translated content */}
      {hasTranslation && (
        <>
          <div
            className={`border-t ${
              isDarkMode ? "border-white/10" : "border-border"
            }`}
          />

          <section>
            <p
              className={`mb-2 text-xs font-medium uppercase tracking-wider ${
                isDarkMode ? "text-reunion-fg/50" : "text-muted-foreground"
              }`}
            >
              Traduction
            </p>
            <div
              className={`whitespace-pre-wrap text-lg leading-[1.75] ${
                isDarkMode ? "text-reunion-fg" : "text-foreground"
              }`}
            >
              {testimony.translatedContent}
            </div>
          </section>
        </>
      )}
    </article>
  );
}
