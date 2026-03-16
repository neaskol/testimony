import type { Witness } from "@/lib/types";
import { Globe, MapPin } from "lucide-react";

const LANGUAGE_LABELS: Record<string, string> = {
  fr: "Français",
  mg: "Malgache",
};

const COLOR_DOT: Record<string, string> = {
  blue: "#3B82F6",
  green: "#22C55E",
  red: "#EF4444",
  yellow: "#EAB308",
  purple: "#A855F7",
};

interface WitnessProfileProps {
  witness: Witness;
}

export function WitnessProfile({ witness }: WitnessProfileProps) {
  return (
    <div className="flex items-start gap-4">
      {/* Color indicator */}
      <div className="mt-1.5">
        {witness.color_tag ? (
          <span
            className="block size-3 rounded-full"
            style={{ backgroundColor: COLOR_DOT[witness.color_tag] }}
          />
        ) : (
          <span className="block size-3 rounded-full bg-gray-300" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-3">
          <h1 className="font-serif text-2xl font-bold tracking-tight">
            {witness.full_name}
          </h1>
          {witness.label && (
            <span className="text-sm text-muted-foreground">
              {witness.label}
            </span>
          )}
        </div>

        <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Globe className="size-3.5" />
            {LANGUAGE_LABELS[witness.language_preference] ??
              witness.language_preference}
          </span>
          {witness.city && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" />
              {witness.city}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
