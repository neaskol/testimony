import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Play, Users, Calendar, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/testimonies/status-badge";
import { getCurrentProfile, getMyTranslators } from "@/actions/auth";
import { getPlan } from "@/actions/plans";
import { getTestimonies } from "@/actions/testimonies";
import { formatDate } from "@/lib/utils";
import {
  DeletePlanButton,
  TranslatorAssignment,
} from "@/components/plans/plan-detail-actions";
import { PlanTestimonyManager } from "@/components/plans/plan-testimony-manager";

interface PlanDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PlanDetailPage({ params }: PlanDetailPageProps) {
  const { id } = await params;

  const { data: profile, error: profileError } = await getCurrentProfile();
  if (profileError || !profile) redirect("/login");

  const { data, error } = await getPlan(id);
  if (error || !data) notFound();

  const { plan, testimonies, translators: assignedTranslators } = data;

  // Get all available translators for assignment
  const { data: allTranslators } = await getMyTranslators();

  // Get all testimonies for the testimony manager
  const { data: allTestimonies } = await getTestimonies();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <Link
          href="/admin/plans"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Retour aux plannings
        </Link>

        <h1 className="font-serif text-xl font-bold tracking-tight sm:text-2xl">
          {plan.service.title}
        </h1>

        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="size-3.5" />
            {formatDate(plan.service.service_date)}
          </span>
          {plan.service.scriptures.length > 0 && (
            <span className="flex items-center gap-1.5">
              <BookOpen className="size-3.5" />
              {plan.service.scriptures.join(" / ")}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/admin/plans/${id}/reunion`}>
            <Button size="sm">
              <Play className="size-3.5" />
              Démarrer la lecture
            </Button>
          </Link>
          <DeletePlanButton planId={id} />
        </div>
      </div>

      {/* Service info */}
      {(plan.service.subject || plan.service.inspiration) && (
        <>
          <div className="rounded-lg border border-border p-4">
            {plan.service.subject && (
              <div className="mb-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Sujet
                </p>
                <p className="mt-0.5 text-sm">{plan.service.subject}</p>
              </div>
            )}
            {plan.service.inspiration && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Inspiration
                </p>
                <p className="mt-0.5 text-sm">{plan.service.inspiration}</p>
              </div>
            )}
          </div>
          <Separator />
        </>
      )}

      {/* Testimony list */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg font-semibold">
            Témoignages ({testimonies.length})
          </h2>
          <PlanTestimonyManager
            planId={id}
            currentTestimonyIds={plan.testimony_ids}
            currentTestimonies={testimonies}
            allTestimonies={allTestimonies ?? []}
          />
        </div>

        {testimonies.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucun témoignage dans ce planning.
          </p>
        ) : (
          <div className="space-y-2">
            {testimonies.map((testimony, index) => (
              <Link
                key={testimony.id}
                href={`/admin/testimonies/${testimony.id}`}
                className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {testimony.witness?.full_name ?? "Témoin anonyme"}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {testimony.content
                      ? testimony.content.slice(0, 100) +
                        (testimony.content.length > 100 ? "..." : "")
                      : "Pas de contenu texte"}
                  </p>
                </div>
                <StatusBadge status={testimony.status} />
              </Link>
            ))}
          </div>
        )}
      </section>

      <Separator />

      {/* Translator assignments */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 font-serif text-lg font-semibold">
          <Users className="size-5" />
          Traducteurs assignés
        </h2>
        <TranslatorAssignment
          planId={id}
          assignedTranslators={assignedTranslators}
          availableTranslators={allTranslators ?? []}
        />
      </section>
    </div>
  );
}
