import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/actions/auth";
import { getTestimonies } from "@/actions/testimonies";
import type { TestimonyStatus } from "@/lib/types";
import { TestimonyCard } from "@/components/testimonies/testimony-card";
import { TestimonyFilters } from "@/components/testimonies/testimony-filters";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";

interface PageProps {
  searchParams: Promise<{
    status?: string;
    witness?: string;
    search?: string;
    ai?: string;
    aiIds?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}

export default async function TestimoniesPage({ searchParams }: PageProps) {
  const { data: profile, error: authError } = await requireRole([
    "superadmin",
    "admin",
  ]);
  if (authError || !profile) redirect("/login");

  const params = await searchParams;

  const filters: {
    status?: TestimonyStatus;
    witnessId?: string;
    search?: string;
    aiMatchIds?: string[];
    dateFrom?: string;
    dateTo?: string;
  } = {};

  if (
    params.status &&
    ["received", "in_translation", "translated", "planned", "read"].includes(
      params.status
    )
  ) {
    filters.status = params.status as TestimonyStatus;
  }

  if (params.witness) {
    filters.witnessId = params.witness;
  }

  if (params.dateFrom) {
    filters.dateFrom = params.dateFrom;
  }
  if (params.dateTo) {
    filters.dateTo = params.dateTo;
  }

  // AI semantic search mode
  if (params.ai === "1" && params.aiIds) {
    if (params.aiIds === "none") {
      filters.aiMatchIds = [];
    } else {
      filters.aiMatchIds = params.aiIds.split(",").filter(Boolean);
    }
  } else if (params.search) {
    filters.search = params.search;
  }

  const { data: testimonies, error } = await getTestimonies(filters);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight">
            Témoignages
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {testimonies
              ? `${testimonies.length} témoignage${testimonies.length !== 1 ? "s" : ""}`
              : "Chargement..."}
          </p>
        </div>
        <Link href="/admin/testimonies/new">
          <Button>
            <PlusIcon className="size-4" />
            Nouveau témoignage
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <TestimonyFilters />

      {/* Content */}
      {error ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      ) : testimonies && testimonies.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {testimonies.map((testimony) => (
            <TestimonyCard key={testimony.id} testimony={testimony} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">
            Aucun témoignage trouvé.
          </p>
          <Link href="/admin/testimonies/new" className="mt-4 inline-block">
            <Button variant="outline" size="sm">
              <PlusIcon className="size-4" />
              Créer le premier témoignage
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
