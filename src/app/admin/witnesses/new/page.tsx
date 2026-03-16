import { redirect } from "next/navigation";
import { requireRole } from "@/actions/auth";
import { createWitness } from "@/actions/witnesses";
import { WitnessForm } from "@/components/witnesses/witness-form";

export default async function NewWitnessPage() {
  const profileResult = await requireRole(["superadmin", "admin"]);
  if (profileResult.error) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold tracking-tight">
          Nouveau temoin
        </h1>
        <p className="text-sm text-muted-foreground">
          Ajoutez les informations du temoin
        </p>
      </div>

      <WitnessForm action={createWitness} />
    </div>
  );
}
