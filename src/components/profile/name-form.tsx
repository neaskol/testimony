"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateMyName } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function NameForm({ currentName }: { currentName: string }) {
  const [name, setName] = useState(currentName);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const trimmed = name.trim();
    if (!trimmed) {
      setError("Le nom ne peut pas être vide");
      return;
    }

    if (trimmed === currentName) {
      return;
    }

    setLoading(true);

    const result = await updateMyName(trimmed);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="full-name">Nom complet</Label>
        <Input
          id="full-name"
          type="text"
          placeholder="Votre nom complet"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && (
        <p className="text-sm text-green-600">
          Nom mis à jour avec succès
        </p>
      )}
      <Button
        type="submit"
        className="bg-gold hover:bg-gold-hover"
        disabled={loading || name.trim() === currentName}
      >
        {loading ? "Enregistrement..." : "Enregistrer"}
      </Button>
    </form>
  );
}
