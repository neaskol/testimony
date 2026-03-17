"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTranslator } from "@/actions/auth";

export function InviteTranslatorForm() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);

    const formData = new FormData(e.currentTarget);
    const email = (formData.get("email") as string).trim();
    const fullName = (formData.get("full_name") as string).trim();
    const password = formData.get("password") as string;

    if (!email || !fullName || !password) {
      toast.error("Tous les champs sont requis.");
      setIsPending(false);
      return;
    }

    if (password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères.");
      setIsPending(false);
      return;
    }

    const result = await createTranslator(email, fullName, password);
    setIsPending(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Compte traducteur créé avec succès");
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
      <div className="max-w-sm space-y-2">
        <Label htmlFor="password">Mot de passe</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            minLength={6}
            placeholder="Min. 6 caractères"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Communiquez ces identifiants au traducteur pour qu&apos;il puisse se connecter.
        </p>
      </div>
      <Button
        type="submit"
        disabled={isPending}
        className="bg-gold text-white hover:bg-gold-hover"
      >
        {isPending ? "Création en cours..." : "Créer le compte traducteur"}
      </Button>
    </form>
  );
}
