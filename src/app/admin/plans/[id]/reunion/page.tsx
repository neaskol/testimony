import { redirect, notFound } from "next/navigation";
import { getCurrentProfile } from "@/actions/auth";
import { getPlan } from "@/actions/plans";
import { getReadingHistory } from "@/actions/reading";
import { createClient } from "@/lib/supabase/server";
import { ReunionView } from "@/components/reunion/reunion-view";
import type { ReunionTestimony, Translation } from "@/lib/types";

interface AdminReunionPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminReunionPage({
  params,
}: AdminReunionPageProps) {
  const { id } = await params;

  // Verify authentication (admin or superadmin)
  const { data: profile, error: profileError } = await getCurrentProfile();
  if (profileError || !profile) redirect("/login");

  if (profile.role !== "admin" && profile.role !== "superadmin") {
    redirect("/login");
  }

  // Fetch plan data (getPlan already checks admin ownership)
  const { data, error } = await getPlan(id);
  if (error || !data) notFound();

  const { plan, testimonies } = data;

  // Fetch translations for all testimonies in this plan
  const supabase = await createClient();
  const testimonyIds = testimonies.map((t) => t.id);

  const translationsMap = new Map<string, string>();

  if (testimonyIds.length > 0) {
    const { data: translations } = await supabase
      .from("translations")
      .select("*")
      .in("testimony_id", testimonyIds);

    if (translations) {
      for (const t of translations as Translation[]) {
        // Use the first translation found for each testimony
        if (!translationsMap.has(t.testimony_id)) {
          translationsMap.set(t.testimony_id, t.content);
        }
      }
    }
  }

  // Fetch existing reading history to pre-populate statuses
  const { data: readingHistory } = await getReadingHistory(id);
  const readStatusMap = new Map<string, "read" | "skipped">();
  if (readingHistory) {
    for (const occasion of readingHistory) {
      // Last status wins
      readStatusMap.set(occasion.testimony_id, occasion.status);
    }
  }

  // Build ReunionTestimony array
  const reunionTestimonies: ReunionTestimony[] = testimonies.map((testimony) => ({
    id: testimony.id,
    witnessName: testimony.witness?.full_name ?? "Temoin anonyme",
    content: testimony.content ?? "",
    translatedContent: translationsMap.get(testimony.id) || undefined,
    status: readStatusMap.get(testimony.id) ?? "pending",
  }));

  return (
    <ReunionView
      planId={plan.id}
      serviceId={plan.service.id}
      service={plan.service}
      initialTestimonies={reunionTestimonies}
      backUrl={`/admin/plans/${id}`}
    />
  );
}
