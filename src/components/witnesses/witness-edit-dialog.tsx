"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { WitnessForm } from "@/components/witnesses/witness-form";
import { DeleteWitnessButton } from "@/app/admin/witnesses/[id]/delete-button";
import type { Witness, ActionResult } from "@/lib/types";

interface WitnessEditDialogProps {
  witness: Witness;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onUpdate: (formData: FormData) => Promise<ActionResult<any>>;
  onDelete: () => Promise<ActionResult>;
}

export function WitnessEditDialog({
  witness,
  onUpdate,
  onDelete,
}: WitnessEditDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          render={
            <Button variant="outline" size="sm">
              <Pencil className="mr-1.5 size-3.5" />
              Modifier
            </Button>
          }
        />
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif">
              Modifier le temoin
            </DialogTitle>
          </DialogHeader>
          <WitnessForm
            witness={witness}
            action={onUpdate}
            onSuccess={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <DeleteWitnessButton onDelete={onDelete} />
    </div>
  );
}
