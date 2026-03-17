import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/actions/auth";
import { getMyAssignments, getMyTranslationStats } from "@/actions/translations";
import { getTranslatorPlans } from "@/actions/plans";
import { StatusBadge } from "@/components/testimonies/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Languages,
  CheckCircle,
  ArrowRight,
  User,
  CalendarDays,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

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

  // Recent assignments (last 5)
  const recentAssignments = allAssignments.slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold tracking-tight">
          Tableau de bord
        </h1>
        <p className="text-sm text-muted-foreground">
          Bienvenue, {profile.full_name}
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Plannings"
          value={String(allPlans.length)}
          icon={<CalendarDays className="size-5 text-muted-foreground" />}
        />
        <DashboardCard
          title="Assignations"
          value={String(totalAssignments)}
          icon={<FileText className="size-5 text-muted-foreground" />}
        />
        <DashboardCard
          title="En cours de traduction"
          value={String(inProgressCount)}
          icon={<Languages className="size-5 text-warning" />}
        />
        <DashboardCard
          title="Traductions terminées"
          value={String(translatedCount)}
          icon={<CheckCircle className="size-5 text-success" />}
        />
      </div>

      {/* Recent assignments */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="font-serif">Assignations récentes</CardTitle>
          {totalAssignments > 0 && (
            <Link href="/translator/testimonies">
              <Button variant="ghost" size="sm" className="gap-1">
                Tout voir
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          )}
        </CardHeader>
        <CardContent>
          {recentAssignments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <FileText className="size-8 text-muted-foreground/50" />
              <p className="mt-3 text-sm text-muted-foreground">
                Aucune assignation pour le moment.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentAssignments.map((assignment) => {
                const testimony = assignment.testimony;
                const witnessName =
                  testimony.witness?.full_name ?? "Témoin anonyme";
                const preview = testimony.content
                  ? testimony.content.length > 120
                    ? testimony.content.slice(0, 120) + "..."
                    : testimony.content
                  : "Pas de contenu textuel";

                return (
                  <Link
                    key={assignment.id}
                    href={`/translator/testimonies/${testimony.id}`}
                    className="flex items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/30"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <User className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {witnessName}
                        </span>
                        <StatusBadge status={testimony.status} />
                      </div>
                      <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                        {preview}
                      </p>
                    </div>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming plans */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="font-serif">Plannings assignés</CardTitle>
          {allPlans.length > 0 && (
            <Link href="/translator/plans">
              <Button variant="ghost" size="sm" className="gap-1">
                Tout voir
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          )}
        </CardHeader>
        <CardContent>
          {allPlans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <CalendarDays className="size-8 text-muted-foreground/50" />
              <p className="mt-3 text-sm text-muted-foreground">
                Aucun planning assigné pour le moment.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {allPlans.slice(0, 5).map((plan) => (
                <Link
                  key={plan.id}
                  href={`/translator/plans/${plan.id}`}
                  className="flex items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/30"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {plan.service.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDate(plan.service.service_date)} — {plan.testimony_ids.length} témoignage{plan.testimony_ids.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {icon}
      </div>
      <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight">{value}</p>
    </div>
  );
}
