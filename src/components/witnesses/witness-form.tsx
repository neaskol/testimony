"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Witness, ActionResult } from "@/lib/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface WitnessFormProps {
  witness?: Witness;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  action: (formData: FormData) => Promise<ActionResult<any>>;
  onSuccess?: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LANGUAGE_OPTIONS = [
  { value: "fr", label: "Français" },
  { value: "mg", label: "Malgache" },
];

const COLOR_TAG_OPTIONS = [
  { value: "", label: "Aucune" },
  { value: "blue", label: "Bleu" },
  { value: "green", label: "Vert" },
  { value: "red", label: "Rouge" },
  { value: "yellow", label: "Jaune" },
  { value: "purple", label: "Violet" },
];

const COLOR_DOT: Record<string, string> = {
  blue: "#3B82F6",
  green: "#22C55E",
  red: "#EF4444",
  yellow: "#EAB308",
  purple: "#A855F7",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WitnessForm({ witness, action, onSuccess }: WitnessFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Controlled state for selects so we can include them in FormData
  const [language, setLanguage] = useState(
    witness?.language_preference ?? "fr"
  );
  const [colorTag, setColorTag] = useState(witness?.color_tag ?? "");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);

    // base-ui Select may not always write to FormData reliably via name prop,
    // so we explicitly set the values from controlled state.
    formData.set("language_preference", language);
    formData.set("color_tag", colorTag);

    startTransition(async () => {
      const result = await action(formData);
      if (result.error) {
        setError(result.error);
      } else if (onSuccess) {
        onSuccess();
        router.refresh();
      } else {
        router.push("/admin/witnesses");
      }
    });
  }

  const isEdit = Boolean(witness);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Full name */}
      <div className="space-y-2">
        <Label htmlFor="full_name">Nom complet *</Label>
        <Input
          id="full_name"
          name="full_name"
          required
          defaultValue={witness?.full_name ?? ""}
          placeholder="Nom et prénom"
        />
      </div>

      {/* Phone & City - side by side */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">Téléphone</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={witness?.phone ?? ""}
            placeholder="+261 34 00 000 00"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">Ville</Label>
          <Input
            id="city"
            name="city"
            defaultValue={witness?.city ?? ""}
            placeholder="Antananarivo"
          />
        </div>
      </div>

      {/* Language & Color tag - side by side */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Langue préférée</Label>
          <Select
            value={language}
            onValueChange={(val) => {
              if (val) setLanguage(val);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Étiquette couleur</Label>
          <Select
            value={colorTag}
            onValueChange={(val) => setColorTag(val ?? "")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Aucune" />
            </SelectTrigger>
            <SelectContent>
              {COLOR_TAG_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  <span className="inline-flex items-center gap-2">
                    {opt.value && (
                      <span
                        className="inline-block size-2.5 rounded-full"
                        style={{
                          backgroundColor: COLOR_DOT[opt.value],
                        }}
                      />
                    )}
                    {opt.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Label */}
      <div className="space-y-2">
        <Label htmlFor="label">Libellé</Label>
        <Input
          id="label"
          name="label"
          defaultValue={witness?.label ?? ""}
          placeholder="Ex : Membre du choeur, Diacre..."
        />
      </div>

      {/* Private notes */}
      <div className="space-y-2">
        <Label htmlFor="private_notes">Notes privées</Label>
        <Textarea
          id="private_notes"
          name="private_notes"
          defaultValue={witness?.private_notes ?? ""}
          placeholder="Notes visibles uniquement par les administrateurs"
          rows={3}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          type="submit"
          disabled={isPending}
          className="bg-gold text-white hover:bg-gold-hover"
        >
          {isPending
            ? "Enregistrement..."
            : isEdit
              ? "Mettre à jour"
              : "Créer le témoin"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => router.push("/admin/witnesses")}
        >
          Annuler
        </Button>
      </div>
    </form>
  );
}
