"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteService } from "@/actions/services";

interface DeleteServiceButtonProps {
  serviceId: string;
}

export function DeleteServiceButton({ serviceId }: DeleteServiceButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [isPending, setIsPending] = useState(false);

  async function handleDelete() {
    setIsPending(true);
    const result = await deleteService(serviceId);
    setIsPending(false);

    if (result.error) {
      toast.error(result.error);
      setConfirming(false);
      return;
    }

    toast.success("Fiche reunion supprimee");
    router.push("/admin/services");
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-destructive">Confirmer ?</span>
        <Button
          variant="destructive"
          size="sm"
          disabled={isPending}
          onClick={handleDelete}
        >
          {isPending ? "Suppression..." : "Supprimer"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setConfirming(false)}
        >
          Annuler
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={() => setConfirming(true)}
    >
      <Trash2 className="size-3.5" />
      Supprimer
    </Button>
  );
}
