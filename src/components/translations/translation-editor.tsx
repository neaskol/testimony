"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useAutosave } from "@/hooks/use-autosave";
import { saveTranslation, markTranslationComplete } from "@/actions/translations";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/testimonies/status-badge";
import type { TestimonyStatus, LanguageCode } from "@/lib/types";
import { CheckCircle, Loader2, Save } from "lucide-react";

interface TranslationEditorProps {
  testimonyId: string;
  witnessName: string | null;
  originalContent: string | null;
  sourceLanguage: LanguageCode;
  testimonyStatus: TestimonyStatus;
  existingTranslationContent: string;
  targetLanguage: LanguageCode;
}

const LANGUAGE_LABELS: Record<LanguageCode, string> = {
  fr: "Français",
  mg: "Malgache",
};

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

export function TranslationEditor({
  testimonyId,
  witnessName,
  originalContent,
  sourceLanguage,
  testimonyStatus,
  existingTranslationContent,
  targetLanguage,
}: TranslationEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [markError, setMarkError] = useState<string | null>(null);
  const [markSuccess, setMarkSuccess] = useState(false);

  // Determine the target language for translation (opposite of source)
  const resolvedTarget: LanguageCode =
    targetLanguage || (sourceLanguage === "fr" ? "mg" : "fr");

  const handleSave = useCallback(
    async (content: string) => {
      await saveTranslation(testimonyId, content, resolvedTarget);
    },
    [testimonyId, resolvedTarget]
  );

  const { content, setContent, isSaving, lastSaved } = useAutosave(
    handleSave,
    2000
  );

  // Initialize content from existing translation
  useEffect(() => {
    setContent(existingTranslationContent);
  }, [existingTranslationContent, setContent]);

  const handleMarkComplete = () => {
    setMarkError(null);
    setMarkSuccess(false);

    startTransition(async () => {
      const result = await markTranslationComplete(testimonyId);
      if (result.error) {
        setMarkError(result.error);
      } else {
        setMarkSuccess(true);
        router.refresh();
      }
    });
  };

  const isAlreadyTranslated =
    testimonyStatus === "translated" ||
    testimonyStatus === "planned" ||
    testimonyStatus === "read";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight">
            Traduction
          </h1>
          {witnessName && (
            <p className="text-sm text-muted-foreground">
              Témoignage de {witnessName}
            </p>
          )}
        </div>
        <StatusBadge status={testimonyStatus} />
      </div>

      {/* Editor grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Original testimony (read-only) */}
        <div className="space-y-3">
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Original ({LANGUAGE_LABELS[sourceLanguage]})
          </Label>
          <div className="min-h-[200px] rounded-lg border border-border bg-muted/30 p-4 text-sm leading-relaxed">
            {originalContent ? (
              <p className="whitespace-pre-wrap">{originalContent}</p>
            ) : (
              <p className="italic text-muted-foreground">
                Aucun contenu textuel. Consultez le fichier audio.
              </p>
            )}
          </div>
        </div>

        {/* Translation textarea */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="translation-content"
              className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              Traduction ({LANGUAGE_LABELS[resolvedTarget]})
            </Label>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {isSaving && (
                <span className="flex items-center gap-1">
                  <Loader2 className="size-3 animate-spin" />
                  Sauvegarde...
                </span>
              )}
              {!isSaving && lastSaved && (
                <span className="flex items-center gap-1">
                  <Save className="size-3" />
                  Sauvegardé à {formatTime(lastSaved)}
                </span>
              )}
            </div>
          </div>
          <Textarea
            id="translation-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Saisissez votre traduction ici..."
            className="min-h-[200px] resize-y text-sm leading-relaxed"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 border-t border-border pt-4">
        {markError && (
          <p className="text-sm text-destructive">{markError}</p>
        )}
        {markSuccess && (
          <p className="flex items-center gap-1 text-sm text-success">
            <CheckCircle className="size-4" />
            Marqué comme traduit
          </p>
        )}
        {!isAlreadyTranslated && (
          <Button
            onClick={handleMarkComplete}
            disabled={isPending || !content.trim()}
            size="lg"
            className="w-full bg-gold text-white hover:bg-gold-hover"
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CheckCircle className="size-4" />
            )}
            Marquer comme traduit
          </Button>
        )}
        {isAlreadyTranslated && (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-success/20 bg-success/5 py-3 text-sm font-medium text-success">
            <CheckCircle className="size-4" />
            Traduction terminée
          </div>
        )}
      </div>
    </div>
  );
}
