import { redirect } from "next/navigation";
import { requireRole } from "@/actions/auth";
import { getWitnesses } from "@/actions/witnesses";
import { TestimonyForm } from "@/components/testimonies/testimony-form";

export default async function NewTestimonyPage() {
  const { data: profile, error: authError } = await requireRole([
    "superadmin",
    "admin",
  ]);
  if (authError || !profile) redirect("/login");

  const { data: witnesses } = await getWitnesses();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold tracking-tight">
          Nouveau témoignage
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enregistrer un nouveau témoignage reçu.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <TestimonyForm
          witnesses={
            witnesses?.map((w) => ({ id: w.id, full_name: w.full_name })) ?? []
          }
          mode="create"
        />
      </div>
    </div>
  );
}
