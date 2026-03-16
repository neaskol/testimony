import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { requireRole } from "@/actions/auth";
import { getMyAssignments, getTranslation } from "@/actions/translations";
import { TranslationEditor } from "@/components/translations/translation-editor";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { LanguageCode } from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TranslatorTestimonyPage({ params }: PageProps) {
  const { id } = await params;

  const profileResult = await requireRole(["translator", "superadmin", "admin"]);
  if (profileResult.error) redirect("/login");

  // Get this translator's assignments to find the testimony
  const { data: assignments, error: assignError } = await getMyAssignments();
  if (assignError || !assignments) redirect("/login");

  const assignment = assignments.find((a) => a.testimony_id === id);
  if (!assignment) {
    notFound();
  }

  const testimony = assignment.testimony;

  // Get existing translation for this testimony
  const { data: translation } = await getTranslation(id);

  // Determine target language (opposite of source)
  const targetLanguage: LanguageCode =
    translation?.target_language ??
    (testimony.source_language === "fr" ? "mg" : "fr");

  return (
    <div className="space-y-6">
      <div>
        <Link href="/translator/testimonies">
          <Button variant="ghost" size="sm" className="mb-4 gap-1.5">
            <ArrowLeft className="size-4" />
            Retour aux témoignages
          </Button>
        </Link>
      </div>

      <TranslationEditor
        testimonyId={testimony.id}
        witnessName={testimony.witness?.full_name ?? null}
        originalContent={testimony.content}
        sourceLanguage={testimony.source_language}
        testimonyStatus={testimony.status}
        existingTranslationContent={translation?.content ?? ""}
        targetLanguage={targetLanguage}
      />
    </div>
  );
}
