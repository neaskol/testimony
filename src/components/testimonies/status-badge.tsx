import type { TestimonyStatus } from "@/lib/types";

const STATUS_CONFIG: Record<
  TestimonyStatus,
  { label: string; bg: string; text: string }
> = {
  received: {
    label: "Reçu",
    bg: "bg-blue-100",
    text: "text-blue-800",
  },
  in_translation: {
    label: "En traduction",
    bg: "bg-amber-100",
    text: "text-amber-800",
  },
  translated: {
    label: "Traduit",
    bg: "bg-green-100",
    text: "text-green-800",
  },
  planned: {
    label: "Planifié",
    bg: "bg-violet-100",
    text: "text-violet-800",
  },
  read: {
    label: "Lu",
    bg: "bg-emerald-100",
    text: "text-emerald-800",
  },
};

interface StatusBadgeProps {
  status: TestimonyStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
}

export { STATUS_CONFIG };
