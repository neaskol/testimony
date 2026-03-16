import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Users } from "lucide-react";
import { requireRole } from "@/actions/auth";
import { getWitnesses } from "@/actions/witnesses";
import { Button } from "@/components/ui/button";
import { WitnessCard } from "@/components/witnesses/witness-card";

export default async function WitnessesPage() {
  const profileResult = await requireRole(["superadmin", "admin"]);
  if (profileResult.error) redirect("/login");

  const { data: witnesses, error } = await getWitnesses();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight">
            Témoins
          </h1>
          <p className="text-sm text-muted-foreground">
            Gérez vos témoins et leurs informations
          </p>
        </div>
        <Link href="/admin/witnesses/new">
          <Button className="bg-[#B8860B] text-white hover:bg-[#996F09]">
            <Plus className="size-4" />
            Nouveau témoin
          </Button>
        </Link>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Empty state */}
      {witnesses && witnesses.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
          <Users className="size-10 text-muted-foreground/50" />
          <h2 className="mt-4 font-serif text-lg font-semibold">
            Aucun témoin
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Commencez par ajouter votre premier témoin.
          </p>
          <Link href="/admin/witnesses/new" className="mt-4">
            <Button
              variant="outline"
              className="border-[#B8860B]/30 text-[#B8860B] hover:bg-[#B8860B]/5"
            >
              <Plus className="size-4" />
              Ajouter un témoin
            </Button>
          </Link>
        </div>
      )}

      {/* Witness grid */}
      {witnesses && witnesses.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {witnesses.map((witness) => (
            <WitnessCard key={witness.id} witness={witness} />
          ))}
        </div>
      )}
    </div>
  );
}
