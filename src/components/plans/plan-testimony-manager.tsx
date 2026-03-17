"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronUp,
  ChevronDown,
  X,
  Plus,
  FileText,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updatePlanOrder } from "@/actions/plans";
import type { TestimonyWithWitness } from "@/lib/types";

interface PlanTestimonyManagerProps {
  planId: string;
  currentTestimonyIds: string[];
  currentTestimonies: TestimonyWithWitness[];
  allTestimonies: TestimonyWithWitness[];
}

export function PlanTestimonyManager({
  planId,
  currentTestimonyIds,
  currentTestimonies,
  allTestimonies,
}: PlanTestimonyManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [orderedIds, setOrderedIds] = useState<string[]>(currentTestimonyIds);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Testimonies currently in the plan (ordered)
  const selectedTestimonies = orderedIds
    .map(
      (id) =>
        currentTestimonies.find((t) => t.id === id) ??
        allTestimonies.find((t) => t.id === id)
    )
    .filter(Boolean) as TestimonyWithWitness[];

  // Testimonies available to add (not in plan)
  const availableTestimonies = allTestimonies
    .filter((t) => !orderedIds.includes(t.id))
    .filter((t) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        (t.witness?.full_name ?? "").toLowerCase().includes(q) ||
        (t.content ?? "").toLowerCase().includes(q)
      );
    });

  function addTestimony(id: string) {
    setOrderedIds((prev) => [...prev, id]);
  }

  function removeTestimony(id: string) {
    setOrderedIds((prev) => prev.filter((tid) => tid !== id));
  }

  function moveUp(index: number) {
    if (index === 0) return;
    setOrderedIds((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }

  function moveDown(index: number) {
    if (index === orderedIds.length - 1) return;
    setOrderedIds((prev) => {
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }

  function handleSave() {
    setError(null);

    if (orderedIds.length === 0) {
      setError("Le planning doit contenir au moins un temoignage.");
      return;
    }

    startTransition(async () => {
      const result = await updatePlanOrder(planId, orderedIds);
      if (result.error) {
        setError(result.error);
        return;
      }
      setIsEditing(false);
      router.refresh();
    });
  }

  function handleCancel() {
    setOrderedIds(currentTestimonyIds);
    setSearch("");
    setError(null);
    setIsEditing(false);
  }

  if (!isEditing) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsEditing(true)}
        className="gap-1.5"
      >
        <Plus className="size-3.5" />
        Modifier les temoignages
      </Button>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Available testimonies */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 font-serif text-sm">
              <FileText className="size-4" />
              Temoignages disponibles
              <span className="text-xs font-normal text-muted-foreground">
                ({availableTestimonies.length})
              </span>
            </CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 text-sm"
              />
            </div>
          </CardHeader>
          <CardContent>
            {availableTestimonies.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                {search.trim()
                  ? "Aucun resultat."
                  : "Tous les temoignages ont ete ajoutes."}
              </p>
            ) : (
              <div className="max-h-64 space-y-1.5 overflow-y-auto">
                {availableTestimonies.map((testimony) => (
                  <div
                    key={testimony.id}
                    className="flex items-center justify-between rounded-md border border-border p-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {testimony.witness?.full_name ?? "Temoin anonyme"}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {testimony.content
                          ? testimony.content.slice(0, 60) +
                            (testimony.content.length > 60 ? "..." : "")
                          : "Pas de contenu texte"}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => addTestimony(testimony.id)}
                      className="ml-2 size-7 shrink-0"
                    >
                      <Plus className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current order */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 font-serif text-sm">
              <FileText className="size-4" />
              Ordre de lecture
              <span className="text-xs font-normal text-muted-foreground">
                ({selectedTestimonies.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedTestimonies.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Ajoutez des temoignages depuis la liste.
              </p>
            ) : (
              <div className="max-h-64 space-y-1.5 overflow-y-auto">
                {selectedTestimonies.map((testimony, index) => (
                  <div
                    key={testimony.id}
                    className="flex items-center gap-2 rounded-md border border-border p-2.5"
                  >
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {testimony.witness?.full_name ?? "Temoin anonyme"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                        className="size-6"
                      >
                        <ChevronUp className="size-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => moveDown(index)}
                        disabled={index === selectedTestimonies.length - 1}
                        className="size-6"
                      >
                        <ChevronDown className="size-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTestimony(testimony.id)}
                        className="size-6 text-destructive hover:text-destructive"
                      >
                        <X className="size-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={handleCancel} disabled={isPending}>
          Annuler
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isPending}
          className="bg-gold text-white hover:bg-gold-hover"
        >
          {isPending ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>
    </div>
  );
}
