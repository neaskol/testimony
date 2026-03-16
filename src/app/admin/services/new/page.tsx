import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentProfile } from "@/actions/auth";
import { ServiceForm } from "@/components/services/service-form";

export default async function NewServicePage() {
  const { data: profile, error } = await getCurrentProfile();
  if (error || !profile) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/services"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Retour aux reunions
        </Link>
        <h1 className="mt-2 font-serif text-2xl font-bold tracking-tight">
          Nouvelle reunion
        </h1>
        <p className="text-sm text-muted-foreground">
          Creez une nouvelle fiche reunion.
        </p>
      </div>

      <div className="max-w-2xl">
        <ServiceForm />
      </div>
    </div>
  );
}
