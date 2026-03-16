import { cn } from "@/lib/utils";
import type { ColorTag as ColorTagType } from "@/lib/types";

const COLOR_MAP: Record<ColorTagType, string> = {
  blue: "#3B82F6",
  green: "#22C55E",
  red: "#EF4444",
  yellow: "#EAB308",
  purple: "#A855F7",
};

interface ColorTagProps {
  tag: ColorTagType | null;
  className?: string;
}

export function ColorTag({ tag, className }: ColorTagProps) {
  if (!tag) return null;

  return (
    <span
      className={cn("inline-block size-2.5 shrink-0 rounded-full", className)}
      style={{ backgroundColor: COLOR_MAP[tag] }}
      aria-label={`Etiquette ${tag}`}
    />
  );
}
