"use client";

import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import { toast } from "sonner";
import {
  updateTestimonyStatus,
  deleteTestimony,
} from "@/actions/testimonies";
import type { TestimonyStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2Icon, Trash2Icon } from "lucide-react";

const STATUS_OPTIONS: { value: TestimonyStatus; label: string }[] = [
  { value: "received", label: "Recu" },
  { value: "in_translation", label: "En traduction" },
  { value: "translated", label: "Traduit" },
  { value: "planned", label: "Planifie" },
  { value: "read", label: "Lu" },
];

interface TestimonyActionsProps {
  testimonyId: string;
  currentStatus: TestimonyStatus;
}

export function TestimonyActions({
  testimonyId,
  currentStatus,
}: TestimonyActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);

  function handleStatusChange(newStatus: string | null) {
    if (!newStatus || newStatus === currentStatus) return;
    startTransition(async () => {
      const result = await updateTestimonyStatus(
        testimonyId,
        newStatus as TestimonyStatus
      );
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Statut mis a jour");
      router.refresh();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteTestimony(testimonyId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Temoignage supprime");
      router.push("/admin/testimonies");
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        value={currentStatus}
        onValueChange={handleStatusChange}
      >
        <SelectTrigger className="w-40" disabled={isPending}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogTrigger
          render={
            <Button variant="destructive" size="icon-sm" disabled={isPending} />
          }
        >
          <Trash2Icon className="size-4" />
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le temoignage</DialogTitle>
            <DialogDescription>
              Cette action est irreversible. Le temoignage et toutes ses
              traductions associees seront definitivement supprimes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending && <Loader2Icon className="size-4 animate-spin" />}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
