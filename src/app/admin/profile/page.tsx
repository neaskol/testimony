import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/actions/auth";
import { Separator } from "@/components/ui/separator";
import { NameForm } from "@/components/profile/name-form";
import { PasswordForm } from "@/components/profile/password-form";

export default async function AdminProfilePage() {
  const { data: profile, error } = await getCurrentProfile();
  if (error || !profile) redirect("/login");

  const roleLabel =
    profile.role === "superadmin"
      ? "Super Admin"
      : profile.role === "admin"
        ? "Pasteur"
        : "Traducteur";

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column — identity */}
        <section className="rounded-lg border border-border bg-card p-6 h-fit">
          <h2 className="font-serif text-lg font-semibold">Informations</h2>
          <dl className="mt-4 space-y-3">
            <div className="flex items-baseline gap-2">
              <dt className="text-sm text-muted-foreground w-24">Email</dt>
              <dd className="text-sm font-medium">{profile.email}</dd>
            </div>
            <div className="flex items-baseline gap-2">
              <dt className="text-sm text-muted-foreground w-24">Rôle</dt>
              <dd className="text-sm font-medium">{roleLabel}</dd>
            </div>
          </dl>

          <Separator className="my-5" />

          <h2 className="font-serif text-lg font-semibold">Modifier le nom</h2>
          <div className="mt-4">
            <NameForm currentName={profile.full_name} />
          </div>
        </section>

        {/* Right column — security */}
        <section className="rounded-lg border border-border bg-card p-6 h-fit">
          <h2 className="font-serif text-lg font-semibold">
            Changer le mot de passe
          </h2>
          <div className="mt-4">
            <PasswordForm />
          </div>
        </section>
      </div>
    </div>
  );
}
