import { getCurrentProfile } from "@/actions/auth";
import { getTestimonies } from "@/actions/testimonies";
import { getServices } from "@/actions/services";
import { getPlans } from "@/actions/plans";
import { redirect } from "next/navigation";
import { formatDate } from "@/lib/utils";

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

  const totalTestimonies = testimonies.length;
  const inTranslation = testimonies.filter(
    (t) => t.status === "in_translation"
  ).length;
  const planned = testimonies.filter((t) => t.status === "planned").length;

  // Find the next upcoming service (service_date >= today)
  const today = new Date().toISOString().split("T")[0];
  const upcomingServices = services
    .filter((s) => s.service_date >= today)
    .sort((a, b) => a.service_date.localeCompare(b.service_date));
  const nextService = upcomingServices.length > 0 ? upcomingServices[0] : null;

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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Témoignages"
          value={String(totalTestimonies)}
        />
        <DashboardCard
          title="En traduction"
          value={String(inTranslation)}
        />
        <DashboardCard
          title="Planifiés"
          value={String(planned)}
        />
        <DashboardCard
          title="Prochaine réunion"
          value={
            nextService ? formatDate(nextService.service_date) : "Aucun"
          }
        />
      </div>

      {/* Recent plans */}
      {plans.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-serif text-lg font-semibold">
            Plannings récents
          </h2>
          <div className="space-y-2">
            {plans.slice(0, 5).map((plan) => (
              <a
                key={plan.id}
                href={`/admin/plans/${plan.id}`}
                className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
              >
                <div>
                  <p className="text-sm font-medium">
                    {plan.service.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(plan.service.service_date)} —{" "}
                    {plan.testimony_ids.length} témoignage
                    {plan.testimony_ids.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function DashboardCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
    </div>
  );
}
