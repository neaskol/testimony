"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { assignTestimony, unassignTestimony } from "@/actions/assignments";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Profile } from "@/lib/types";

interface Assignment {
  id: string;
  translator_id: string;
  translator: { full_name: string; email: string };
}

interface TestimonyAssignmentProps {
  testimonyId: string;
  assignments: Assignment[];
  translators: Profile[];
}

export function TestimonyAssignment({
  testimonyId,
  assignments,
  translators,
}: TestimonyAssignmentProps) {
  const [selectedTranslator, setSelectedTranslator] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const assignedIds = assignments.map((a) => a.translator_id);
  const availableTranslators = translators.filter(
    (t) => !assignedIds.includes(t.id)
  );

  function handleAssign() {
    if (!selectedTranslator) return;
    setError(null);
    startTransition(async () => {
      const result = await assignTestimony(testimonyId, selectedTranslator);
      if (result.error) {
        setError(result.error);
      } else {
        setSelectedTranslator("");
        router.refresh();
      }
    });
  }

  function handleUnassign(translatorId: string) {
    setError(null);
    startTransition(async () => {
      const result = await unassignTestimony(testimonyId, translatorId);
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-3">
      <h3 className="font-serif text-sm font-semibold">
        Traducteurs assignés
      </h3>

      {assignments.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucun traducteur assigné
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {assignments.map((a) => (
            <Badge
              key={a.id}
              variant="secondary"
              className="flex items-center gap-1.5 pr-1"
            >
              {a.translator.full_name}
              <button
                onClick={() => handleUnassign(a.translator_id)}
                disabled={isPending}
                className="ml-1 rounded-full p-0.5 hover:bg-destructive/20"
                aria-label={`Retirer ${a.translator.full_name}`}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </Badge>
          ))}
        </div>
      )}

      {availableTranslators.length > 0 && (
        <div className="flex items-center gap-2">
          <select
            value={selectedTranslator}
            onChange={(e) => setSelectedTranslator(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Choisir un traducteur...</option>
            {availableTranslators.map((t) => (
              <option key={t.id} value={t.id}>
                {t.full_name}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            onClick={handleAssign}
            disabled={!selectedTranslator || isPending}
            className="bg-gold hover:bg-gold-hover"
          >
            Assigner
          </Button>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
