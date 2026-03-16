import Link from "next/link";
import { redirect } from "next/navigation";
import { getMyAssignments } from "@/actions/translations";
import { StatusBadge } from "@/components/testimonies/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, User, ArrowRight } from "lucide-react";

export default async function TranslatorTestimoniesPage() {
  const { data: assignments, error } = await getMyAssignments();

  if (error || !assignments) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold tracking-tight">
          Mes témoignages
        </h1>
        <p className="text-sm text-muted-foreground">
          {assignments.length === 0
            ? "Aucun témoignage assigné pour le moment."
            : `${assignments.length} témoignage${assignments.length > 1 ? "s" : ""} assigné${assignments.length > 1 ? "s" : ""}`}
        </p>
      </div>

      {assignments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
          <FileText className="size-10 text-muted-foreground/50" />
          <p className="mt-4 text-sm text-muted-foreground">
            Aucun témoignage ne vous a été assigné.
          </p>
          <p className="text-xs text-muted-foreground">
            Contactez votre administrateur pour recevoir des assignations.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {assignments.map((assignment) => {
            const testimony = assignment.testimony;
            const witnessName = testimony.witness?.full_name ?? "Témoin anonyme";
            const preview = testimony.content
              ? testimony.content.length > 180
                ? testimony.content.slice(0, 180) + "..."
                : testimony.content
              : "Pas de contenu textuel";

            return (
              <Link
                key={assignment.id}
                href={`/translator/testimonies/${testimony.id}`}
              >
                <Card className="transition-colors hover:bg-muted/30">
                  <CardContent>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="size-4 shrink-0 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {witnessName}
                          </span>
                          <StatusBadge status={testimony.status} />
                        </div>
                        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                          {preview}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>
                            Langue : {testimony.source_language === "fr" ? "Français" : "Malgache"}
                          </span>
                          <span>
                            Assigné le{" "}
                            {new Intl.DateTimeFormat("fr-FR", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }).format(new Date(assignment.assigned_at))}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="size-5 shrink-0 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
