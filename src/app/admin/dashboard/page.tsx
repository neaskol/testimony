import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getCurrentProfile } from "@/actions/auth";
import { getTestimonies } from "@/actions/testimonies";
import { getServices } from "@/actions/services";
import { getPlans } from "@/actions/plans";
import { formatDate, formatDateShort } from "@/lib/utils";

export default async function AdminDashboard() {
  const { data: profile, error } = await getCurrentProfile();
  if (error || !profile) redirect("/login");

  const [testimoniesResult, servicesResult, plansResult] = await Promise.all([
    getTestimonies(),
    getServices(),
    getPlans(),
  ]);

  const testimonies = testimoniesResult.data ?? [];
  const services = servicesResult.data ?? [];
  const plans = plansResult.data ?? [];

  // Stats
  const totalTestimonies = testimonies.length;
  const inTranslation = testimonies.filter(
    (t) => t.status === "in_translation"
  ).length;
  const translated = testimonies.filter(
    (t) => t.status === "translated"
  ).length;
  const planned = testimonies.filter((t) => t.status === "planned").length;

  // First name
  const firstName = profile.full_name.split(" ")[0] || profile.full_name;

  // Contextual summary
  let contextMessage: string;
  if (totalTestimonies === 0) {
    contextMessage = "Aucun témoignage pour le moment.";
  } else {
    const parts: string[] = [];
    parts.push(
      `${totalTestimonies} témoignage${totalTestimonies !== 1 ? "s" : ""}`
    );
    if (inTranslation > 0) {
      parts.push(`${inTranslation} en traduction`);
    }
    if (translated > 0) {
      parts.push(
        `${translated} traduit${translated !== 1 ? "s" : ""}`
      );
    }
    contextMessage = parts.join(" · ");
  }

  // Next upcoming service
  const today = new Date().toISOString().split("T")[0];
  const upcomingServices = services
    .filter((s) => s.service_date >= today)
    .sort((a, b) => a.service_date.localeCompare(b.service_date));
  const nextService = upcomingServices.length > 0 ? upcomingServices[0] : null;

  // Find a plan linked to the next service (if any)
  const nextServicePlan = nextService
    ? plans.find((p) => p.service_id === nextService.id)
    : null;

  // Display items
  const displayPlans = plans.slice(0, 7);
  const hasMorePlans = plans.length > 7;

  return (
    <div className="space-y-8">
      {/* ── Hero Section ── */}
      <header className="space-y-1 border-b border-border pb-6">
        <h1 className="font-serif text-3xl font-bold tracking-tight">
          Bonjour, {firstName}.
        </h1>
        <p className="text-base text-muted-foreground">{contextMessage}</p>
        {nextService && (
          <p className="text-sm">
            Prochaine réunion :{" "}
            {nextServicePlan ? (
              <Link
                href={`/admin/plans/${nextServicePlan.id}`}
                className="text-primary underline-offset-4 hover:underline"
              >
                {formatDate(nextService.service_date)}
              </Link>
            ) : (
              <span className="text-primary">
                {formatDate(nextService.service_date)}
              </span>
            )}
          </p>
        )}
      </header>

      {/* ── Two-Column Layout ── */}
      <div className="lg:grid lg:grid-cols-3 lg:gap-12">
        {/* ── Main Column (2/3) ── */}
        <div className="lg:col-span-2">
          {/* Mobile stats row */}
          <div className="mb-6 flex items-baseline gap-6 lg:hidden">
            <div>
              <span className="text-2xl font-bold tabular-nums tracking-tight">
                {totalTestimonies}
              </span>
              <span className="ml-1.5 text-xs text-muted-foreground">
                témoignage{totalTestimonies !== 1 ? "s" : ""}
              </span>
            </div>
            <div>
              <span className="text-2xl font-bold tabular-nums tracking-tight">
                {inTranslation}
              </span>
              <span className="ml-1.5 text-xs text-muted-foreground">
                en traduction
              </span>
            </div>
            <div>
              <span className="text-2xl font-bold tabular-nums tracking-tight">
                {planned}
              </span>
              <span className="ml-1.5 text-xs text-muted-foreground">
                planifié{planned !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Section title */}
          <h2 className="font-serif text-lg font-semibold">
            Plannings récents
          </h2>
          <div className="mt-1 border-b border-border" />

          {/* Article list */}
          {displayPlans.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aucun planning pour le moment.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {displayPlans.map((plan) => (
                <Link
                  key={plan.id}
                  href={`/admin/plans/${plan.id}`}
                  className="group flex items-center justify-between py-4 transition-colors hover:bg-muted/30"
                >
                  <div className="min-w-0">
                    <p className="font-semibold">{plan.service.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDateShort(plan.service.service_date)} {"—"}{" "}
                      {plan.testimony_ids.length} témoignage
                      {plan.testimony_ids.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          )}

          {hasMorePlans && (
            <div className="mt-3">
              <Link
                href="/admin/plans"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Tout voir
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* ── Sidebar (1/3, desktop only) ── */}
        <aside className="hidden border-l-2 border-primary pl-6 lg:block">
          <div className="space-y-4">
            <div>
              <p className="text-2xl font-bold tabular-nums tracking-tight">
                {totalTestimonies}
              </p>
              <p className="text-xs text-muted-foreground">
                Témoignage{totalTestimonies !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="border-b border-border" />
            <div>
              <p className="text-2xl font-bold tabular-nums tracking-tight">
                {inTranslation}
              </p>
              <p className="text-xs text-muted-foreground">En traduction</p>
            </div>
            <div className="border-b border-border" />
            <div>
              <p className="text-2xl font-bold tabular-nums tracking-tight">
                {planned}
              </p>
              <p className="text-xs text-muted-foreground">
                Planifié{planned !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="border-b border-border" />
            <div>
              <p className="text-2xl font-bold tabular-nums tracking-tight">
                {nextService
                  ? formatDateShort(nextService.service_date)
                  : "—"}
              </p>
              <p className="text-xs text-muted-foreground">
                Prochaine réunion
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
