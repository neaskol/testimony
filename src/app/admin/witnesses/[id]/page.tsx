import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/actions/auth";
import { getWitness, updateWitness, deleteWitness, getWitnessTestimonies } from "@/actions/witnesses";
import { WitnessProfile } from "@/components/witnesses/witness-profile";
import { WitnessEditDialog } from "@/components/witnesses/witness-edit-dialog";
import { WitnessTestimonyList } from "@/components/witnesses/witness-testimony-list";

interface WitnessDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function WitnessDetailPage({
  params,
}: WitnessDetailPageProps) {
  const { id } = await params;

  const profileResult = await requireRole(["superadmin", "admin"]);
  if (profileResult.error) redirect("/login");

  const [witnessResult, testimoniesResult] = await Promise.all([
    getWitness(id),
    getWitnessTestimonies(id),
  ]);

  if (witnessResult.error || !witnessResult.data) {
    notFound();
  }

  const witness = witnessResult.data;
  const { testimonies, stats } = testimoniesResult.data ?? {
    testimonies: [],
    stats: { total: 0, read: 0, pending: 0, lastTestimonyDate: null },
  };

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
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Back link */}
      <Link
        href="/admin/witnesses"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        Temoins
      </Link>

      {/* Profile header + actions */}
      <div className="flex items-start justify-between gap-4">
        <WitnessProfile witness={witness} />
        <WitnessEditDialog
          witness={witness}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      </div>

      {/* Separator */}
      <div className="border-t" />

      {/* Testimonies section */}
      <div className="space-y-3">
        <h2 className="font-serif text-lg font-semibold">Temoignages</h2>
        <WitnessTestimonyList testimonies={testimonies} stats={stats} />
      </div>
    </div>
  );
}
