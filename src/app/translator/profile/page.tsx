import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/actions/auth";
import { Separator } from "@/components/ui/separator";
import { NameForm } from "@/components/profile/name-form";
import { PasswordForm } from "@/components/profile/password-form";

export default async function TranslatorProfilePage() {
  const { data: profile, error } = await getCurrentProfile();
  if (error || !profile) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold tracking-tight">
          Mon profil
        </h1>
        <p className="text-sm text-muted-foreground">
          Consultez vos informations et gérez votre mot de passe.
        </p>
      </div>

      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="font-serif text-lg font-semibold">Informations</h2>
        <dl className="mt-4 space-y-3">
          <div className="flex items-baseline gap-2">
            <dt className="text-sm text-muted-foreground w-24">Email</dt>
            <dd className="text-sm font-medium">{profile.email}</dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="text-sm text-muted-foreground w-24">Rôle</dt>
            <dd className="text-sm font-medium">Traducteur</dd>
          </div>
        </dl>
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="font-serif text-lg font-semibold">
          Modifier le nom
        </h2>
        <div className="rounded-lg border border-border bg-card p-6 max-w-md">
          <NameForm currentName={profile.full_name} />
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="font-serif text-lg font-semibold">
          Changer le mot de passe
        </h2>
        <div className="rounded-lg border border-border bg-card p-6 max-w-md">
          <PasswordForm />
        </div>
      </section>
    </div>
  );
}
