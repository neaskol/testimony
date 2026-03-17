import { redirect, notFound } from "next/navigation";
import { getCurrentProfile } from "@/actions/auth";
import { getTranslatorPlan } from "@/actions/plans";
import { getReadingHistory } from "@/actions/reading";
import { ReunionView } from "@/components/reunion/reunion-view";
import type { ReunionTestimony } from "@/lib/types";

interface TranslatorReunionPageProps {
  params: Promise<{ id: string }>;
}

export default async function TranslatorReunionPage({
  params,
}: TranslatorReunionPageProps) {
  const { id } = await params;

  // Verify authentication
  const { data: profile, error: profileError } = await getCurrentProfile();
  if (profileError || !profile) redirect("/login");

  // Fetch plan data (includes authorization check for translator)
  const { data, error } = await getTranslatorPlan(id);
  if (error || !data) notFound();

  const { plan, testimonies } = data;

  // Fetch existing reading history to pre-populate statuses
  const { data: readingHistory } = await getReadingHistory(id);
  const readStatusMap = new Map<string, "read" | "skipped">();
  if (readingHistory) {
    for (const occasion of readingHistory) {
      readStatusMap.set(occasion.testimony_id, occasion.status);
    }
  }

  // Build ReunionTestimony array based on translator's reading language
  // The translator reads ALL testimonies — in the original language
  // For testimonies in the other language, they translate live at the podium
  const reunionTestimonies: ReunionTestimony[] = testimonies.map((testimony) => ({
    id: testimony.id,
    witnessName: testimony.witness?.full_name ?? "Temoin anonyme",
    content: testimony.content ?? "",
    sourceLanguage: testimony.source_language,
    status: readStatusMap.get(testimony.id) ?? "pending",
  }));

  return (
    <ReunionView
      planId={plan.id}
      serviceId={plan.service.id}
      service={plan.service}
      initialTestimonies={reunionTestimonies}
      backUrl={`/translator/plans/${id}`}
    />
  );
}
