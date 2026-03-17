import Link from "next/link";
import { Calendar, BookOpen } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import type { Service } from "@/lib/types";

interface ServiceCardProps {
  service: Service;
}

export function ServiceCard({ service }: ServiceCardProps) {
  return (
    <Link href={`/admin/services/${service.id}`} className="block">
      <Card className="transition-all hover:ring-2 hover:ring-gold/30">
        <CardHeader>
          <CardTitle className="font-serif">{service.title}</CardTitle>
          <CardDescription className="flex items-center gap-1.5">
            <Calendar className="size-3.5" />
            {formatDate(service.service_date)}
          </CardDescription>
        </CardHeader>
        {(service.subject || service.scriptures.length > 0) && (
          <CardContent className="space-y-2">
            {service.subject && (
              <p className="text-sm text-muted-foreground">{service.subject}</p>
            )}
            {service.scriptures.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <BookOpen className="size-3" />
                <span>{service.scriptures.join(" / ")}</span>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </Link>
  );
}
