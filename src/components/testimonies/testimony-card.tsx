import Link from "next/link";
import type { TestimonyWithWitness } from "@/lib/types";
import { formatRelative } from "@/lib/utils";
import { StatusBadge } from "@/components/testimonies/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GlobeIcon } from "lucide-react";

const LANGUAGE_LABELS: Record<string, string> = {
  fr: "Français",
  mg: "Malgache",
};

interface TestimonyCardProps {
  testimony: TestimonyWithWitness;
}

export function TestimonyCard({ testimony }: TestimonyCardProps) {
  const witnessName = testimony.witness?.full_name ?? "Anonyme";
  const contentPreview = testimony.summary
    ? testimony.summary
    : testimony.content
      ? testimony.content.length > 100
        ? testimony.content.slice(0, 100) + "..."
        : testimony.content
      : "Aucun contenu texte";

  return (
    <Link href={`/admin/testimonies/${testimony.id}`} className="block group">
      <Card className="transition-all hover:ring-2 hover:ring-gold/30">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="font-serif text-base font-semibold leading-snug">
              {witnessName}
            </CardTitle>
            <StatusBadge status={testimony.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm leading-relaxed text-muted-foreground line-clamp-3">
            {contentPreview}
          </p>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <GlobeIcon className="size-3" />
                {LANGUAGE_LABELS[testimony.source_language] ??
                  testimony.source_language}
              </span>
              {testimony.tags.length > 0 && (
                <span className="flex items-center gap-1">
                  {testimony.tags.slice(0, 2).join(", ")}
                  {testimony.tags.length > 2 &&
                    ` +${testimony.tags.length - 2}`}
                </span>
              )}
            </div>
            <span>{formatRelative(testimony.created_at)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
