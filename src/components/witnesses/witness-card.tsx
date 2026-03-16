import Link from "next/link";
import { MapPin, Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ColorTag } from "@/components/witnesses/color-tag";
import type { Witness } from "@/lib/types";

const LANGUAGE_LABELS: Record<string, string> = {
  fr: "Francais",
  mg: "Malgache",
};

interface WitnessCardProps {
  witness: Witness;
}

export function WitnessCard({ witness }: WitnessCardProps) {
  return (
    <Link href={`/admin/witnesses/${witness.id}`} className="block">
      <Card className="transition-shadow hover:shadow-md">
        <CardContent>
          <div className="flex items-start gap-3">
            <ColorTag tag={witness.color_tag} className="mt-1.5" />
            <div className="min-w-0 flex-1">
              <h3 className="font-serif text-base font-semibold leading-snug text-foreground truncate">
                {witness.full_name}
              </h3>

              {witness.label && (
                <p className="mt-0.5 text-xs text-muted-foreground truncate">
                  {witness.label}
                </p>
              )}

              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {witness.city && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3" />
                    {witness.city}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Globe className="size-3" />
                  {LANGUAGE_LABELS[witness.language_preference] ??
                    witness.language_preference}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
