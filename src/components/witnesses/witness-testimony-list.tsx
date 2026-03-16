import Link from "next/link";
import { BookOpen, SparklesIcon } from "lucide-react";
import type { WitnessTestimonyWithReading, WitnessStats } from "@/lib/types";
import { formatDate, formatRelative } from "@/lib/utils";
import { StatusBadge } from "@/components/testimonies/status-badge";

interface WitnessTestimonyListProps {
  testimonies: WitnessTestimonyWithReading[];
  stats: WitnessStats;
}

export function WitnessTestimonyList({
  testimonies,
  stats,
}: WitnessTestimonyListProps) {
  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <span className="font-medium text-foreground">
          {stats.total} {stats.total > 1 ? "temoignages" : "temoignage"}
        </span>
        <span className="text-muted-foreground">
          {stats.read} lu{stats.read > 1 ? "s" : ""}
        </span>
        <span className="text-muted-foreground">
          {stats.pending} en attente
        </span>
        {stats.lastTestimonyDate && (
          <span className="text-muted-foreground">
            Dernier : {formatRelative(stats.lastTestimonyDate)}
          </span>
        )}
      </div>

      {/* List */}
      {testimonies.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Aucun temoignage enregistre pour ce temoin.
        </p>
      ) : (
        <div className="divide-y divide-border rounded-lg border bg-card">
          {testimonies.map((testimony) => {
            const readOccasion = testimony.reading_occasions.find(
              (ro) => ro.status === "read"
            );

            return (
              <Link
                key={testimony.id}
                href={`/admin/testimonies/${testimony.id}`}
                className="flex items-start gap-4 px-4 py-3.5 transition-colors hover:bg-muted/50"
              >
                {/* Date column */}
                <div className="w-20 shrink-0 pt-0.5 text-xs text-muted-foreground">
                  {formatDate(testimony.created_at)}
                </div>

                {/* Content column */}
                <div className="min-w-0 flex-1 space-y-1">
                  {testimony.summary ? (
                    <p className="text-sm leading-relaxed text-foreground line-clamp-2">
                      <SparklesIcon className="mr-1 inline size-3 text-[#B8860B]" />
                      {testimony.summary}
                    </p>
                  ) : testimony.content ? (
                    <p className="text-sm leading-relaxed text-foreground line-clamp-2">
                      {testimony.content.length > 120
                        ? testimony.content.slice(0, 120) + "..."
                        : testimony.content}
                    </p>
                  ) : (
                    <p className="text-sm italic text-muted-foreground">
                      Aucun contenu texte
                    </p>
                  )}

                  {/* Read info */}
                  {readOccasion && (
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <BookOpen className="size-3" />
                      <span>
                        Lu le {formatDate(readOccasion.read_at)}
                        {readOccasion.service && (
                          <>
                            {" — "}
                            <span
                              className="max-w-[200px] truncate inline-block align-bottom"
                              title={readOccasion.service.title}
                            >
                              {readOccasion.service.title}
                            </span>
                          </>
                        )}
                      </span>
                    </p>
                  )}
                </div>

                {/* Status column */}
                <div className="shrink-0 pt-0.5">
                  <StatusBadge status={testimony.status} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
