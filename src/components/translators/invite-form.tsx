"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inviteTranslator } from "@/actions/auth";

export function InviteTranslatorForm() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);

    const formData = new FormData(e.currentTarget);
    const email = (formData.get("email") as string).trim();
    const fullName = (formData.get("full_name") as string).trim();

    if (!email || !fullName) {
      toast.error("L'email et le nom complet sont requis.");
      setIsPending(false);
      return;
    }

    const result = await inviteTranslator(email, fullName);
    setIsPending(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Invitation envoyée avec succès");
    e.currentTarget.reset();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="full_name">Nom complet</Label>
          <Input
            id="full_name"
            name="full_name"
            required
            placeholder="Prénom Nom"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Adresse email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="traducteur@exemple.com"
          />
        </div>
      </div>
      <Button
        type="submit"
        disabled={isPending}
        className="bg-[#B8860B] text-white hover:bg-[#996F09]"
      >
        {isPending ? "Envoi en cours..." : "Inviter le traducteur"}
      </Button>
    </form>
  );
}
