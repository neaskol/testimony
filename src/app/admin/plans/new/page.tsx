import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentProfile, getMyTranslators } from "@/actions/auth";
import { getServices } from "@/actions/services";
import { getTestimonies } from "@/actions/testimonies";
import { PlanBuilder } from "@/components/plans/plan-builder";

export default async function NewPlanPage() {
  const { data: profile, error: profileError } = await getCurrentProfile();
  if (profileError || !profile) redirect("/login");

  const [servicesResult, testimoniesResult, translatorsResult] =
    await Promise.all([
      getServices(),
      getTestimonies(),
      getMyTranslators(),
    ]);

  const services = servicesResult.data ?? [];
  const testimonies = testimoniesResult.data ?? [];
  const translators = translatorsResult.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/plans"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Retour aux plannings
        </Link>
        <h1 className="mt-2 font-serif text-2xl font-bold tracking-tight">
          Nouveau planning
        </h1>
        <p className="text-sm text-muted-foreground">
          Sélectionnez une réunion, ajoutez des témoignages et définissez leur
          ordre de lecture.
        </p>
      </div>

      <PlanBuilder
        services={services}
        testimonies={testimonies}
        translators={translators}
      />
    </div>
  );
}
