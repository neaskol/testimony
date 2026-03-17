import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlanCard } from "@/components/plans/plan-card";
import { getPlans } from "@/actions/plans";
import { getCurrentProfile } from "@/actions/auth";

export default async function PlansPage() {
  const { data: profile, error: profileError } = await getCurrentProfile();
  if (profileError || !profile) redirect("/login");

  const { data: plans, error } = await getPlans();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight">
            Plannings
          </h1>
          <p className="text-sm text-muted-foreground">
            Organisez les témoignages pour chaque réunion.
          </p>
        </div>
        <Link href="/admin/plans/new">
          <Button>
            <Plus className="size-4" />
            Nouveau planning
          </Button>
        </Link>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {plans && plans.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
          <FileText className="size-10 text-muted-foreground/50" />
          <p className="mt-4 text-sm font-medium text-muted-foreground">
            Aucun planning
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Créez votre premier planning de lecture.
          </p>
        </div>
      )}

      {plans && plans.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      )}
    </div>
  );
}
