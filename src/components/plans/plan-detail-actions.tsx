"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, UserPlus, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  deletePlan,
  assignTranslatorToPlan,
  unassignTranslatorFromPlan,
} from "@/actions/plans";
import type { Profile, LanguageCode } from "@/lib/types";
import type { TranslatorWithLanguage } from "@/actions/plans";

// ---------------------------------------------------------------------------
// Delete plan button
// ---------------------------------------------------------------------------

export function DeletePlanButton({ planId }: { planId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deletePlan(planId);
      if (!result.error) {
        router.push("/admin/plans");
      }
    });
  }

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="destructive" size="sm">
            <Trash2 className="size-4" />
            Supprimer
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supprimer ce planning</DialogTitle>
          <DialogDescription>
            Cette action est irréversible. Le planning sera supprimé
            définitivement.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose
            render={
              <Button variant="outline" disabled={isPending}>
                Annuler
              </Button>
            }
          />
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? "Suppression..." : "Supprimer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Translator assignment manager
// ---------------------------------------------------------------------------

interface TranslatorAssignmentProps {
  planId: string;
  assignedTranslators: TranslatorWithLanguage[];
  availableTranslators: Profile[];
}

export function TranslatorAssignment({
  planId,
  assignedTranslators,
  availableTranslators,
}: TranslatorAssignmentProps) {
  const [selectedId, setSelectedId] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>("mg");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Filter out already assigned translators
  const unassigned = availableTranslators.filter(
    (t) => !assignedTranslators.some((at) => at.id === t.id)
  );

  function handleAssign() {
    if (!selectedId) return;
    setError(null);
    startTransition(async () => {
      const result = await assignTranslatorToPlan(planId, selectedId, selectedLanguage);
      if (result.error) {
        setError(result.error);
      } else {
        setSelectedId("");
        setSelectedLanguage("mg");
      }
    });
  }

  function handleUnassign(translatorId: string) {
    setError(null);
    startTransition(async () => {
      const result = await unassignTranslatorFromPlan(planId, translatorId);
      if (result.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Currently assigned */}
      {assignedTranslators.length > 0 && (
        <div className="space-y-2">
          {assignedTranslators.map((translator) => (
            <div
              key={translator.id}
              className="flex items-center justify-between rounded-md border border-border p-3"
            >
              <div className="flex items-center gap-2">
                <div>
                  <p className="text-sm font-medium">{translator.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {translator.email}
                  </p>
                </div>
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                  {translator.reading_language === "mg" ? "Malgache" : "Francais"}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleUnassign(translator.id)}
                disabled={isPending}
                className="text-destructive hover:text-destructive"
              >
                <UserMinus className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {assignedTranslators.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Aucun traducteur assigne.
        </p>
      )}

      {/* Add translator */}
      {unassigned.length > 0 && (
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Select value={selectedId} onValueChange={(v) => setSelectedId(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Ajouter un traducteur...">
                  {(value) => {
                    if (!value) return null;
                    const t = unassigned.find((tr) => tr.id === value);
                    return t?.full_name ?? value;
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {unassigned.map((translator) => (
                  <SelectItem key={translator.id} value={translator.id}>
                    {translator.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-32 shrink-0">
            <Select value={selectedLanguage} onValueChange={(v) => setSelectedLanguage((v as LanguageCode) ?? "mg")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mg" label="Malgache">Malgache</SelectItem>
                <SelectItem value="fr" label="Francais">Francais</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleAssign}
            disabled={isPending || !selectedId}
            size="default"
            className="bg-gold text-white hover:bg-gold-hover"
          >
            <UserPlus className="size-4" />
            Assigner
          </Button>
        </div>
      )}
    </div>
  );
}
