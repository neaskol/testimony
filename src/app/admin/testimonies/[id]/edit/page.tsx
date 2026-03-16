import { redirect, notFound } from "next/navigation";
import { requireRole } from "@/actions/auth";
import { getTestimony } from "@/actions/testimonies";
import { getWitnesses } from "@/actions/witnesses";
import { TestimonyForm } from "@/components/testimonies/testimony-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTestimonyPage({ params }: PageProps) {
  const { data: profile, error: authError } = await requireRole([
    "superadmin",
    "admin",
  ]);
  if (authError || !profile) redirect("/login");

  const { id } = await params;
  const [testimonyResult, witnessesResult] = await Promise.all([
    getTestimony(id),
    getWitnesses(),
  ]);

  if (testimonyResult.error || !testimonyResult.data) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold tracking-tight">
          Modifier le temoignage
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Mettre a jour les informations du temoignage.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <TestimonyForm
          witnesses={
            witnessesResult.data?.map((w) => ({
              id: w.id,
              full_name: w.full_name,
            })) ?? []
          }
          testimony={testimonyResult.data}
          mode="edit"
        />
      </div>
    </div>
  );
}
