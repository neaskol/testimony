import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/actions/auth";
import { getMyAssignments } from "@/actions/translations";
import { StatusBadge } from "@/components/testimonies/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Languages,
  CheckCircle,
  ArrowRight,
  User,
} from "lucide-react";

export default async function TranslatorDashboard() {
  const { data: profile, error } = await getCurrentProfile();
  if (error || !profile) redirect("/login");

  const { data: assignments } = await getMyAssignments();
  const allAssignments = assignments ?? [];

  // Compute stats
  const totalAssignments = allAssignments.length;
  const inProgressCount = allAssignments.filter(
    (a) => a.testimony.status === "in_translation"
  ).length;
  const translatedCount = allAssignments.filter(
    (a) =>
      a.testimony.status === "translated" ||
      a.testimony.status === "planned" ||
      a.testimony.status === "read"
  ).length;

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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <DashboardCard
          title="Assignations"
          value={String(totalAssignments)}
          icon={<FileText className="size-5 text-muted-foreground" />}
        />
        <DashboardCard
          title="En cours de traduction"
          value={String(inProgressCount)}
          icon={<Languages className="size-5 text-[#92400E]" />}
        />
        <DashboardCard
          title="Traductions terminees"
          value={String(translatedCount)}
          icon={<CheckCircle className="size-5 text-[#166534]" />}
        />
      </div>

      {/* Recent assignments */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="font-serif">Assignations recentes</CardTitle>
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
                  testimony.witness?.full_name ?? "Temoin anonyme";
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
      <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
    </div>
  );
}
