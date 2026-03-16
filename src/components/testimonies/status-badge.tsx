import type { TestimonyStatus } from "@/lib/types";

const STATUS_CONFIG: Record<
  TestimonyStatus,
  { label: string; bg: string; text: string }
> = {
  received: {
    label: "Reçu",
    bg: "bg-[#DBEAFE]",
    text: "text-[#1E40AF]",
  },
  in_translation: {
    label: "En traduction",
    bg: "bg-[#FEF3C7]",
    text: "text-[#92400E]",
  },
  translated: {
    label: "Traduit",
    bg: "bg-[#DCFCE7]",
    text: "text-[#166534]",
  },
  planned: {
    label: "Planifié",
    bg: "bg-[#EDE9FE]",
    text: "text-[#5B21B6]",
  },
  read: {
    label: "Lu",
    bg: "bg-[#D1FAE5]",
    text: "text-[#065F46]",
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
