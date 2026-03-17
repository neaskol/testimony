"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createService, updateService } from "@/actions/services";
import type { Service } from "@/lib/types";

interface ServiceFormProps {
  service?: Service;
}

export function ServiceForm({ service }: ServiceFormProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const isEditing = !!service;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);

    const formData = new FormData(e.currentTarget);

    const result = isEditing
      ? await updateService(service!.id, formData)
      : await createService(formData);

    setIsPending(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(isEditing ? "Fiche réunion mise à jour" : "Fiche réunion créée");

    if (!isEditing && result.data) {
      router.push(`/admin/services/${result.data.id}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Titre</Label>
        <Input
          id="title"
          name="title"
          required
          placeholder="Titre de la réunion"
          defaultValue={service?.title ?? ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="service_date">Date de la réunion</Label>
        <Input
          id="service_date"
          name="service_date"
          type="date"
          required
          defaultValue={service?.service_date ?? ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject">Sujet</Label>
        <Input
          id="subject"
          name="subject"
          placeholder="Sujet de la réunion (optionnel)"
          defaultValue={service?.subject ?? ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="inspiration">Inspiration</Label>
        <Textarea
          id="inspiration"
          name="inspiration"
          placeholder="Notes d'inspiration (optionnel)"
          defaultValue={service?.inspiration ?? ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="scriptures">Écritures</Label>
        <Input
          id="scriptures"
          name="scriptures"
          placeholder="Jean 3:16, Hébreux 11:1 (séparées par des virgules)"
          defaultValue={service?.scriptures?.join(", ") ?? ""}
        />
        <p className="text-xs text-muted-foreground">
          Séparez les références par des virgules.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={isPending}
          className="bg-gold text-white hover:bg-gold-hover"
        >
          {isPending
            ? "Enregistrement..."
            : isEditing
              ? "Mettre à jour"
              : "Créer la fiche réunion"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Annuler
        </Button>
      </div>
    </form>
  );
}
