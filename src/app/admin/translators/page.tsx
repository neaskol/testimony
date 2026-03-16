import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { getCurrentProfile, getMyTranslators } from "@/actions/auth";
import { InviteTranslatorForm } from "@/components/translators/invite-form";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default async function TranslatorsPage() {
  const { data: profile, error: profileError } = await getCurrentProfile();
  if (profileError || !profile) redirect("/login");

  const { data: translators, error } = await getMyTranslators();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold tracking-tight">
          Traducteurs
        </h1>
        <p className="text-sm text-muted-foreground">
          Invitez et gérez vos traducteurs.
        </p>
      </div>

      {/* Invite form */}
      <section className="space-y-4">
        <h2 className="font-serif text-lg font-semibold">
          Inviter un traducteur
        </h2>
        <div className="rounded-lg border border-border bg-card p-6">
          <InviteTranslatorForm />
        </div>
      </section>

      <Separator />

      {/* Translators list */}
      <section className="space-y-4">
        <h2 className="font-serif text-lg font-semibold">
          Vos traducteurs
        </h2>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {translators && translators.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
            <Users className="size-10 text-muted-foreground/50" />
            <p className="mt-4 text-sm font-medium text-muted-foreground">
              Aucun traducteur
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Invitez un traducteur via le formulaire ci-dessus.
            </p>
          </div>
        )}

        {translators && translators.length > 0 && (
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Inscrit le</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {translators.map((translator) => (
                  <TableRow key={translator.id}>
                    <TableCell className="font-medium">
                      {translator.full_name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {translator.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        Traducteur
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(translator.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}
