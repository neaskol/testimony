import { redirect } from "next/navigation";
import { FileText } from "lucide-react";
import { getCurrentProfile } from "@/actions/auth";
import { getTranslatorPlans } from "@/actions/plans";
import { PlanCard } from "@/components/plans/plan-card";

export default async function TranslatorPlansPage() {
  const { data: profile, error: profileError } = await getCurrentProfile();
  if (profileError || !profile) redirect("/login");

  const { data: plans, error } = await getTranslatorPlans();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold tracking-tight">
          Mes plannings
        </h1>
        <p className="text-sm text-muted-foreground">
          Les plannings de lecture qui vous sont assignés.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {plans && plans.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
          <FileText className="size-10 text-muted-foreground/50" />
          <p className="mt-4 text-sm font-medium text-muted-foreground">
            Aucun planning assigné
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Vos plannings de lecture apparaîtront ici.
          </p>
        </div>
      )}

      {plans && plans.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              href={`/translator/plans/${plan.id}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
