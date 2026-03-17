import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { getCurrentProfile } from "@/actions/auth";
import { getService, getServicePlans } from "@/actions/services";
import { ServiceForm } from "@/components/services/service-form";
import { DeleteServiceButton } from "@/components/services/delete-service-button";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/utils";

interface ServiceDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ServiceDetailPage({
  params,
}: ServiceDetailPageProps) {
  const { id } = await params;

  const { data: profile, error: profileError } = await getCurrentProfile();
  if (profileError || !profile) redirect("/login");

  const { data: service, error: serviceError } = await getService(id);
  if (serviceError || !service) notFound();

  const { data: plans } = await getServicePlans(id);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/admin/services"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Retour aux reunions
        </Link>
        <div className="mt-2 flex items-start justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold tracking-tight">
              {service.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              {formatDate(service.service_date)}
            </p>
          </div>
          <DeleteServiceButton serviceId={service.id} />
        </div>
      </div>

      <Separator />

      {/* Edit form */}
      <section className="space-y-4">
        <h2 className="font-serif text-lg font-semibold">
          Modifier la fiche
        </h2>
        <div className="max-w-2xl">
          <ServiceForm service={service} />
        </div>
      </section>

      <Separator />

      {/* Linked reading plans */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg font-semibold">
            Plannings de lecture
          </h2>
          <Link
            href="/admin/plans/new"
            className="text-sm font-medium text-gold transition-colors hover:text-gold-hover"
          >
            Créer un planning
          </Link>
        </div>

        {(!plans || plans.length === 0) && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-10">
            <FileText className="size-8 text-muted-foreground/50" />
            <p className="mt-3 text-sm text-muted-foreground">
              Aucun planning lie a cette reunion.
            </p>
          </div>
        )}

        {plans && plans.length > 0 && (
          <div className="space-y-3">
            {plans.map((plan) => (
              <Link
                key={plan.id}
                href={`/admin/plans/${plan.id}`}
                className="block rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      Planning du {formatDate(plan.created_at)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {plan.testimony_ids.length} témoignage{plan.testimony_ids.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <FileText className="size-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
