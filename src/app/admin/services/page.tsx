import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, ChurchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ServiceCard } from "@/components/services/service-card";
import { getServices } from "@/actions/services";
import { getCurrentProfile } from "@/actions/auth";

export default async function ServicesPage() {
  const { data: profile, error: profileError } = await getCurrentProfile();
  if (profileError || !profile) redirect("/login");

  const { data: services, error } = await getServices();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight">
            Réunions
          </h1>
          <p className="text-sm text-muted-foreground">
            Gérez les fiches réunion et leur contenu.
          </p>
        </div>
        <Link href="/admin/services/new">
          <Button className="bg-[#B8860B] text-white hover:bg-[#996F09]">
            <Plus className="size-4" />
            Nouvelle réunion
          </Button>
        </Link>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {services && services.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
          <ChurchIcon className="size-10 text-muted-foreground/50" />
          <p className="mt-4 text-sm font-medium text-muted-foreground">
            Aucune fiche réunion
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Créez votre première fiche réunion pour commencer.
          </p>
        </div>
      )}

      {services && services.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      )}
    </div>
  );
}
