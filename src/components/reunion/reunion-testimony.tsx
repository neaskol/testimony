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
            isDarkMode ? "text-reunion-fg" : "text-[#0A0A0A]"
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
              isDarkMode ? "text-reunion-fg/50" : "text-[#64748B]"
            }`}
          >
            Texte original
          </p>
        )}
        <div
          className={`whitespace-pre-wrap text-lg leading-[1.75] ${
            isDarkMode ? "text-reunion-fg/90" : "text-[#0A0A0A]"
          }`}
          style={{ fontSize: "18px" }}
        >
          {testimony.content || (
            <span
              className={`italic ${
                isDarkMode ? "text-reunion-fg/40" : "text-[#64748B]"
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
                isDarkMode ? "text-reunion-fg/50" : "text-[#64748B]"
              }`}
            >
              Traduction
            </p>
            <div
              className={`whitespace-pre-wrap text-lg leading-[1.75] ${
                isDarkMode ? "text-reunion-fg" : "text-[#0A0A0A]"
              }`}
              style={{ fontSize: "18px" }}
            >
              {testimony.translatedContent}
            </div>
          </section>
        </>
      )}
    </article>
  );
}
