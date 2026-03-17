"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronUp,
  ChevronDown,
  X,
  Plus,
  Users,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/testimonies/status-badge";
import { createPlan, assignTranslatorToPlan } from "@/actions/plans";
import type { Service, TestimonyWithWitness, Profile } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface PlanBuilderProps {
  services: Service[];
  testimonies: TestimonyWithWitness[];
  translators: Profile[];
}

export function PlanBuilder({
  services,
  testimonies,
  translators,
}: PlanBuilderProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [selectedTestimonyIds, setSelectedTestimonyIds] = useState<string[]>(
    []
  );
  const [selectedTranslatorId, setSelectedTranslatorId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Testimonies already in the plan
  const selectedTestimonies = selectedTestimonyIds
    .map((id) => testimonies.find((t) => t.id === id))
    .filter(Boolean) as TestimonyWithWitness[];

  // Testimonies available to add (not yet in plan)
  const availableTestimonies = testimonies.filter(
    (t) => !selectedTestimonyIds.includes(t.id)
  );

  function addTestimony(id: string) {
    setSelectedTestimonyIds((prev) => [...prev, id]);
  }

  function removeTestimony(id: string) {
    setSelectedTestimonyIds((prev) => prev.filter((tid) => tid !== id));
  }

  function moveUp(index: number) {
    if (index === 0) return;
    setSelectedTestimonyIds((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }

  function moveDown(index: number) {
    if (index === selectedTestimonyIds.length - 1) return;
    setSelectedTestimonyIds((prev) => {
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }

  function handleSubmit() {
    setError(null);

    if (!selectedServiceId) {
      setError("Veuillez sélectionner une réunion.");
      return;
    }

    if (selectedTestimonyIds.length === 0) {
      setError("Veuillez ajouter au moins un témoignage.");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("service_id", selectedServiceId);
      formData.set("testimony_ids", JSON.stringify(selectedTestimonyIds));

      const result = await createPlan(formData);

      if (result.error) {
        setError(result.error);
        return;
      }

      // Assign translator if selected
      if (selectedTranslatorId && result.data) {
        await assignTranslatorToPlan(result.data.id, selectedTranslatorId);
      }

      router.push(`/admin/plans/${result.data!.id}`);
    });
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Service selection */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-base">
            Réunion associée
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedServiceId}
            onValueChange={(v) => setSelectedServiceId(v ?? "")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sélectionner une réunion..." />
            </SelectTrigger>
            <SelectContent>
              {services.map((service) => (
                <SelectItem key={service.id} value={service.id}>
                  {formatDate(service.service_date)} — {service.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Testimony selection */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Available testimonies */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-base">
              <FileText className="size-4" />
              Témoignages disponibles
              <span className="text-xs font-normal text-muted-foreground">
                ({availableTestimonies.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {availableTestimonies.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Tous les témoignages ont été ajoutés.
              </p>
            ) : (
              <div className="max-h-80 space-y-2 overflow-y-auto">
                {availableTestimonies.map((testimony) => (
                  <div
                    key={testimony.id}
                    className="flex items-center justify-between rounded-md border border-border p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {testimony.witness?.full_name ?? "Témoin anonyme"}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {testimony.content
                          ? testimony.content.slice(0, 80) + (testimony.content.length > 80 ? "..." : "")
                          : "Pas de contenu texte"}
                      </p>
                      <div className="mt-1">
                        <StatusBadge status={testimony.status} />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => addTestimony(testimony.id)}
                      className="ml-2 shrink-0"
                    >
                      <Plus className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selected testimonies (ordered) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-base">
              <FileText className="size-4" />
              Ordre de lecture
              <span className="text-xs font-normal text-muted-foreground">
                ({selectedTestimonies.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedTestimonies.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Ajoutez des témoignages depuis la liste.
              </p>
            ) : (
              <div className="space-y-2">
                {selectedTestimonies.map((testimony, index) => (
                  <div
                    key={testimony.id}
                    className="flex items-center gap-2 rounded-md border border-border p-3"
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {testimony.witness?.full_name ?? "Témoin anonyme"}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {testimony.content
                          ? testimony.content.slice(0, 60) + (testimony.content.length > 60 ? "..." : "")
                          : "Pas de contenu texte"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                      >
                        <ChevronUp className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => moveDown(index)}
                        disabled={index === selectedTestimonies.length - 1}
                      >
                        <ChevronDown className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => removeTestimony(testimony.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Translator assignment */}
      {translators.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-base">
              <Users className="size-4" />
              Traducteur assigné
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedTranslatorId}
              onValueChange={(v) => setSelectedTranslatorId(v ?? "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionner un traducteur (optionnel)..." />
              </SelectTrigger>
              <SelectContent>
                {translators.map((translator) => (
                  <SelectItem key={translator.id} value={translator.id}>
                    {translator.full_name} ({translator.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => router.push("/admin/plans")}
          disabled={isPending}
        >
          Annuler
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isPending}
          className="bg-gold text-white hover:bg-gold-hover"
        >
          {isPending ? "Création..." : "Créer le planning"}
        </Button>
      </div>
    </div>
  );
}
