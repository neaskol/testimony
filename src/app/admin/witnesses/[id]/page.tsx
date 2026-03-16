import { redirect, notFound } from "next/navigation";
import { requireRole } from "@/actions/auth";
import { getWitness, updateWitness, deleteWitness } from "@/actions/witnesses";
import { WitnessForm } from "@/components/witnesses/witness-form";
import { DeleteWitnessButton } from "./delete-button";

interface WitnessDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function WitnessDetailPage({
  params,
}: WitnessDetailPageProps) {
  const { id } = await params;

  const profileResult = await requireRole(["superadmin", "admin"]);
  if (profileResult.error) redirect("/login");

  const { data: witness, error } = await getWitness(id);

  if (error || !witness) {
    notFound();
  }

  async function handleUpdate(formData: FormData) {
    "use server";
    return updateWitness(id, formData);
  }

  async function handleDelete() {
    "use server";
    const result = await deleteWitness(id);
    if (!result.error) {
      redirect("/admin/witnesses");
    }
    return result;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight">
            {witness.full_name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Modifier les informations du temoin
          </p>
        </div>
        <DeleteWitnessButton onDelete={handleDelete} />
      </div>

      <WitnessForm witness={witness} action={handleUpdate} />
    </div>
  );
}
