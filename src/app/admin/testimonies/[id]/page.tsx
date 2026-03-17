import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { requireRole, getMyTranslators } from "@/actions/auth";
import { getTestimony } from "@/actions/testimonies";
import { getTestimonyAssignments } from "@/actions/assignments";
import { formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/testimonies/status-badge";
import { TestimonyActions } from "@/components/testimonies/testimony-actions";
import { TestimonyAssignment } from "@/components/testimonies/testimony-assignment";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeftIcon,
  PencilIcon,
  GlobeIcon,
  CalendarIcon,
  TagIcon,
  LockIcon,
  LanguagesIcon,
  FileTextIcon,
  UsersIcon,
} from "lucide-react";

const LANGUAGE_LABELS: Record<string, string> = {
  fr: "Français",
  mg: "Malgache",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TestimonyDetailPage({ params }: PageProps) {
  const { data: profile, error: authError } = await requireRole([
    "superadmin",
    "admin",
  ]);
  if (authError || !profile) redirect("/login");

  const { id } = await params;
  const [testimonyResult, assignmentsResult, translatorsResult] =
    await Promise.all([
      getTestimony(id),
      getTestimonyAssignments(id),
      getMyTranslators(),
    ]);

  const { data: testimony, error } = testimonyResult;

  if (error || !testimony) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back link and actions */}
      <div className="flex items-center justify-between gap-4">
        <Link href="/admin/testimonies">
          <Button variant="ghost" size="sm">
            <ArrowLeftIcon className="size-4" />
            Retour
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Link href={`/admin/testimonies/${testimony.id}/edit`}>
            <Button variant="outline" size="sm">
              <PencilIcon className="size-4" />
              Modifier
            </Button>
          </Link>
          <TestimonyActions
            testimonyId={testimony.id}
            currentStatus={testimony.status}
          />
        </div>
      </div>

      {/* Main content */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="font-serif text-xl font-bold">
                {testimony.witness?.full_name ?? "Anonyme"}
              </CardTitle>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CalendarIcon className="size-3.5" />
                  {formatDate(testimony.created_at)}
                </span>
                <span className="flex items-center gap-1">
                  <GlobeIcon className="size-3.5" />
                  {LANGUAGE_LABELS[testimony.source_language] ??
                    testimony.source_language}
                </span>
              </div>
            </div>
            <StatusBadge status={testimony.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary */}
          {testimony.summary && (
            <div>
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <FileTextIcon className="size-3 text-gold" />
                Résumé
              </h3>
              <div className="rounded-lg border border-gold/20 bg-gold/5 p-4">
                <p className="text-sm leading-relaxed">
                  {testimony.summary}
                </p>
              </div>
            </div>
          )}

          {/* Testimony content */}
          <div>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Contenu
            </h3>
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {testimony.content || "Aucun contenu texte."}
              </p>
            </div>
          </div>

          {/* Audio */}
          {testimony.audio_url && (
            <div>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Audio
              </h3>
              <audio controls className="w-full" src={testimony.audio_url}>
                Votre navigateur ne supporte pas la lecture audio.
              </audio>
            </div>
          )}

          {/* Tags */}
          {testimony.tags.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Tags
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {testimony.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground"
                  >
                    <TagIcon className="size-3" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Private notes */}
          {testimony.private_notes && (
            <div>
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <LockIcon className="size-3" />
                Notes privees
              </h3>
              <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4">
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {testimony.private_notes}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assignments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-lg font-semibold">
            <UsersIcon className="size-5" />
            Assignation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TestimonyAssignment
            testimonyId={testimony.id}
            assignments={assignmentsResult.data ?? []}
            translators={translatorsResult.data ?? []}
          />
        </CardContent>
      </Card>

      {/* Translations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-lg font-semibold">
            <LanguagesIcon className="size-5" />
            Traductions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {testimony.translations && testimony.translations.length > 0 ? (
            <div className="space-y-4">
              {testimony.translations.map((translation) => (
                <div
                  key={translation.id}
                  className="rounded-lg border border-border p-4"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {LANGUAGE_LABELS[translation.target_language] ??
                        translation.target_language}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(translation.updated_at)}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {translation.content || "Traduction en cours..."}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Aucune traduction pour le moment.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
