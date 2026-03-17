import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getCurrentProfile } from "@/actions/auth";
import { getMyAssignments, getMyTranslationStats } from "@/actions/translations";
import { getTranslatorPlans } from "@/actions/plans";
import { StatusBadge } from "@/components/testimonies/status-badge";
import { formatDateShort, formatRelative } from "@/lib/utils";

export default async function TranslatorDashboard() {
  const { data: profile, error } = await getCurrentProfile();
  if (error || !profile) redirect("/login");

  const [{ data: assignments }, { data: plans }, { data: stats }] =
    await Promise.all([
      getMyAssignments(),
      getTranslatorPlans(),
      getMyTranslationStats(),
    ]);
  const allAssignments = assignments ?? [];
  const allPlans = plans ?? [];

  // Compute stats
  const totalAssignments = allAssignments.length;
  const inProgressCount = stats?.inProgressCount ?? 0;
  const translatedCount = stats?.translatedCount ?? 0;

  // Pending = assignments with no translation started yet
  const pendingCount = totalAssignments - inProgressCount - translatedCount;

  // First name extraction
  const firstName = profile.full_name.split(" ")[0] || profile.full_name;

  // Contextual message
  let contextMessage: string;
  if (pendingCount > 0) {
    contextMessage =
      pendingCount === 1
        ? "1 témoignage vous attend."
        : `${pendingCount} témoignages vous attendent.`;
  } else if (inProgressCount > 0) {
    contextMessage =
      inProgressCount === 1
        ? "1 traduction en cours."
        : `${inProgressCount} traductions en cours.`;
  } else {
    contextMessage = "Tout est à jour.";
  }

  // Next plan within 7 days
  const today = new Date();
  const sevenDaysFromNow = new Date(today);
  sevenDaysFromNow.setDate(today.getDate() + 7);
  const todayStr = today.toISOString().split("T")[0];
  const sevenDaysStr = sevenDaysFromNow.toISOString().split("T")[0];

  const upcomingPlan = allPlans
    .filter(
      (p) =>
        p.service.service_date >= todayStr &&
        p.service.service_date <= sevenDaysStr
    )
    .sort((a, b) =>
      a.service.service_date.localeCompare(b.service.service_date)
    )[0];

  // Display items
  const displayAssignments = allAssignments.slice(0, 7);
  const hasMoreAssignments = allAssignments.length > 7;
  const displayPlans = allPlans.slice(0, 4);
  const hasMorePlans = allPlans.length > 4;

  return (
    <div className="space-y-8">
      {/* ── Hero Section ── */}
      <header className="space-y-1 border-b border-border pb-6">
        <h1 className="font-serif text-3xl font-bold tracking-tight">
          Bonjour, {firstName}.
        </h1>
        <p className="text-base text-muted-foreground">{contextMessage}</p>
        {upcomingPlan && (
          <p className="text-sm">
            Prochain planning :{" "}
            <Link
              href={`/translator/plans/${upcomingPlan.id}`}
              className="text-primary underline-offset-4 hover:underline"
            >
              {formatDateShort(upcomingPlan.service.service_date)}
            </Link>
          </p>
        )}
      </header>

      {/* ── Two-Column Layout ── */}
      <div className="lg:grid lg:grid-cols-3 lg:gap-12">
        {/* ── Main Column (2/3) ── */}
        <div className="lg:col-span-2">
          {/* Mobile stats row */}
          <div className="mb-6 flex items-baseline gap-6 lg:hidden">
            <Link href="/translator/testimonies" className="transition-opacity hover:opacity-70">
              <span className="text-2xl font-bold tabular-nums tracking-tight">
                {totalAssignments}
              </span>
              <span className="ml-1.5 text-xs text-muted-foreground">
                assignation{totalAssignments !== 1 ? "s" : ""}
              </span>
            </Link>
            <Link href="/translator/testimonies" className="transition-opacity hover:opacity-70">
              <span className="text-2xl font-bold tabular-nums tracking-tight">
                {inProgressCount}
              </span>
              <span className="ml-1.5 text-xs text-muted-foreground">
                en cours
              </span>
            </Link>
            <Link href="/translator/testimonies" className="transition-opacity hover:opacity-70">
              <span className="text-2xl font-bold tabular-nums tracking-tight">
                {translatedCount}
              </span>
              <span className="ml-1.5 text-xs text-muted-foreground">
                terminée{translatedCount !== 1 ? "s" : ""}
              </span>
            </Link>
          </div>

          {/* Section title */}
          <h2 className="font-serif text-lg font-semibold">À traduire</h2>
          <div className="mt-1 border-b border-border" />

          {/* Article list */}
          {displayAssignments.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aucune assignation pour le moment.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {displayAssignments.map((assignment) => {
                const testimony = assignment.testimony;
                const witnessName =
                  testimony.witness?.full_name ?? "Témoin anonyme";

                // Extract first sentence for the editorial extract
                const rawContent = testimony.content ?? "";
                let firstSentence = "";
                if (rawContent) {
                  const match = rawContent.match(/^[^.!?]+[.!?]/);
                  firstSentence = match
                    ? match[0].trim()
                    : rawContent.length > 120
                      ? rawContent.slice(0, 120).trim() + "…"
                      : rawContent.trim();
                }

                return (
                  <Link
                    key={assignment.id}
                    href={`/translator/testimonies/${testimony.id}`}
                    className="group flex items-start gap-4 py-4 transition-colors hover:bg-muted/30"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{witnessName}</p>
                      {firstSentence && (
                        <p className="mt-0.5 line-clamp-2 text-sm italic text-muted-foreground">
                          {"« "}{firstSentence}{" »"}
                        </p>
                      )}
                      <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                        <StatusBadge status={testimony.status} />
                        <span>{"·"}</span>
                        <span>{formatRelative(assignment.assigned_at)}</span>
                      </div>
                    </div>
                    <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                );
              })}
            </div>
          )}

          {hasMoreAssignments && (
            <div className="mt-3">
              <Link
                href="/translator/testimonies"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Tout voir
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          )}

          {/* Mobile plannings section */}
          {allPlans.length > 0 && (
            <div className="mt-8 lg:hidden">
              <h2 className="font-serif text-lg font-semibold">Plannings</h2>
              <div className="mt-1 border-b border-border" />
              <div className="divide-y divide-border">
                {displayPlans.map((plan) => (
                  <Link
                    key={plan.id}
                    href={`/translator/plans/${plan.id}`}
                    className="group flex items-center justify-between py-3 transition-colors hover:bg-muted/30"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {plan.service.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateShort(plan.service.service_date)} {"—"}{" "}
                        {plan.testimony_ids.length} témoignage
                        {plan.testimony_ids.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                ))}
              </div>
              {hasMorePlans && (
                <div className="mt-3">
                  <Link
                    href="/translator/plans"
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Tout voir
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Sidebar (1/3, desktop only) ── */}
        <aside className="hidden border-l-2 border-primary pl-6 lg:block">
          {/* Stat blocks */}
          <div className="space-y-4">
            <Link href="/translator/testimonies" className="block transition-opacity hover:opacity-70">
              <p className="text-2xl font-bold tabular-nums tracking-tight">
                {totalAssignments}
              </p>
              <p className="text-xs text-muted-foreground">
                Assignation{totalAssignments !== 1 ? "s" : ""}
              </p>
            </Link>
            <div className="border-b border-border" />
            <Link href="/translator/testimonies" className="block transition-opacity hover:opacity-70">
              <p className="text-2xl font-bold tabular-nums tracking-tight">
                {inProgressCount}
              </p>
              <p className="text-xs text-muted-foreground">En cours</p>
            </Link>
            <div className="border-b border-border" />
            <Link href="/translator/testimonies" className="block transition-opacity hover:opacity-70">
              <p className="text-2xl font-bold tabular-nums tracking-tight">
                {translatedCount}
              </p>
              <p className="text-xs text-muted-foreground">
                Terminée{translatedCount !== 1 ? "s" : ""}
              </p>
            </Link>
          </div>

          {/* Plannings section */}
          {allPlans.length > 0 && (
            <div className="mt-8">
              <h3 className="font-serif text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Plannings
              </h3>
              <div className="mt-2 border-b border-border" />
              <div className="divide-y divide-border">
                {displayPlans.map((plan) => (
                  <Link
                    key={plan.id}
                    href={`/translator/plans/${plan.id}`}
                    className="block py-3 transition-colors hover:bg-muted/30"
                  >
                    <p className="text-sm font-medium">
                      {plan.service.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDateShort(plan.service.service_date)} {"—"}{" "}
                      {plan.testimony_ids.length} témoignage
                      {plan.testimony_ids.length !== 1 ? "s" : ""}
                    </p>
                  </Link>
                ))}
              </div>
              {hasMorePlans && (
                <div className="mt-3">
                  <Link
                    href="/translator/plans"
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Tout voir
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
