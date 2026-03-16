import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Play, Calendar, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/testimonies/status-badge";
import { getCurrentProfile } from "@/actions/auth";
import { getTranslatorPlan } from "@/actions/plans";
import { formatDate } from "@/lib/utils";

interface TranslatorPlanDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TranslatorPlanDetailPage({
  params,
}: TranslatorPlanDetailPageProps) {
  const { id } = await params;

  const { data: profile, error: profileError } = await getCurrentProfile();
  if (profileError || !profile) redirect("/login");

  const { data, error } = await getTranslatorPlan(id);
  if (error || !data) notFound();

  const { plan, testimonies } = data;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/translator/plans"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Retour aux plannings
        </Link>
        <div className="mt-2 flex items-start justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold tracking-tight">
              {plan.service.title}
            </h1>
            <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
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
          </div>
          <Link href={`/translator/plans/${id}/reunion`}>
            <Button className="bg-[#B8860B] text-white hover:bg-[#996F09]">
              <Play className="size-4" />
              Demarrer la lecture
            </Button>
          </Link>
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
        <h2 className="font-serif text-lg font-semibold">
          Ordre de lecture ({testimonies.length} temoignage
          {testimonies.length !== 1 ? "s" : ""})
        </h2>

        {testimonies.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucun temoignage dans ce planning.
          </p>
        ) : (
          <div className="space-y-2">
            {testimonies.map((testimony, index) => (
              <div
                key={testimony.id}
                className="flex items-center gap-3 rounded-lg border border-border p-4"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {testimony.witness?.full_name ?? "Temoin anonyme"}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {testimony.content
                      ? testimony.content.slice(0, 100) +
                        (testimony.content.length > 100 ? "..." : "")
                      : "Pas de contenu texte"}
                  </p>
                </div>
                <StatusBadge status={testimony.status} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
