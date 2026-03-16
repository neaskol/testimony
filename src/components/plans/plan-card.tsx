import Link from "next/link";
import { Calendar, FileText, Users } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import type { ReadingPlanWithService } from "@/lib/types";

interface PlanCardProps {
  plan: ReadingPlanWithService;
  translatorCount?: number;
  href?: string;
}

export function PlanCard({ plan, translatorCount, href }: PlanCardProps) {
  const linkHref = href ?? `/admin/plans/${plan.id}`;
  const testimonyCount = plan.testimony_ids.length;

  return (
    <Link href={linkHref} className="block">
      <Card className="transition-colors hover:ring-foreground/20">
        <CardHeader>
          <CardTitle className="font-serif">{plan.service.title}</CardTitle>
          <CardDescription className="flex items-center gap-1.5">
            <Calendar className="size-3.5" />
            {formatDate(plan.service.service_date)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <FileText className="size-3.5" />
              {testimonyCount} témoignage{testimonyCount !== 1 ? "s" : ""}
            </span>
            {translatorCount !== undefined && (
              <span className="flex items-center gap-1.5">
                <Users className="size-3.5" />
                {translatorCount} traducteur{translatorCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
